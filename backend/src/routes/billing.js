/**
 * Billing Routes (Stripe Integration + CSF Extraction)
 */

import { Router } from 'express';
import { createRequire } from 'module';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { asyncHandler, HttpErrors } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config/index.js';

// pdf-parse se carga de forma lazy para evitar crash en startup (lee archivos de test al importar)
const _require = createRequire(import.meta.url);
function getPdfParse() {
  return _require('pdf-parse/lib/pdf-parse.js');
}

// Multer: memory storage for PDF uploads
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Supabase admin client — optional; graceful fallback if env vars not set
const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// SAT CSF text extraction — handles several layout variations
function extractFiscalData(text) {
  const rfcMatch      = text.match(/RFC\s*:?\s*([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})/i);
  const nameMatch     = text.match(/(?:Denominaci[oó]n\s*[/\\]?\s*Raz[oó]n\s*Social|Raz[oó]n\s*Social)\s*:?\s*([^\n\r]+)/i);
  const regimenMatch  = text.match(/R[eé]gimen(?:\s*Fiscal)?\s*:?\s*([^\n\r]+)/i);
  const cpMatch       = text.match(/(?:C[oó]digo\s*Postal|C\.P\.)\s*:?\s*(\d{5})/i);
  return {
    rfc:          rfcMatch?.[1]?.trim()      ?? '',
    razonSocial:  nameMatch?.[1]?.trim()     ?? '',
    regimenFiscal: regimenMatch?.[1]?.trim() ?? '',
    codigoPostal: cpMatch?.[1]?.trim()       ?? '',
  };
}

const router = Router();

// Initialize Stripe (only if key is provided)
const stripe = config.stripe.secretKey 
  ? new Stripe(config.stripe.secretKey) 
  : null;

/**
 * GET /billing/subscription
 * Get current subscription
 */
router.get('/subscription', authenticate, asyncHandler(async (req, res) => {
  // In production, fetch subscription from database/Stripe
  const subscription = {
    id: 'sub_demo',
    plan: 'pro',
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
  };

  res.json({
    success: true,
    data: subscription,
  });
}));

/**
 * POST /billing/checkout
 * Create Stripe checkout session
 */
router.post('/checkout', authenticate, asyncHandler(async (req, res) => {
  const { priceId } = req.body;

  if (!priceId) {
    throw HttpErrors.badRequest('Price ID required');
  }

  if (!stripe) {
    throw HttpErrors.internal('Stripe not configured');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${config.corsOrigin}/dashboard/billing?success=true`,
    cancel_url: `${config.corsOrigin}/dashboard/billing?canceled=true`,
    customer_email: req.user.email,
    metadata: {
      userId: req.user.id,
    },
  });

  res.json({
    success: true,
    data: {
      url: session.url,
      sessionId: session.id,
    },
  });
}));

/**
 * POST /billing/portal
 * Create Stripe customer portal session
 */
router.post('/portal', authenticate, asyncHandler(async (req, res) => {
  if (!stripe) {
    throw HttpErrors.internal('Stripe not configured');
  }

  // In production, get customer ID from database
  const customerId = req.body.customerId || 'cus_demo';

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${config.corsOrigin}/dashboard/billing`,
  });

  res.json({
    success: true,
    data: {
      url: session.url,
    },
  });
}));

/**
 * GET /billing/invoices
 * Get invoice history
 */
router.get('/invoices', authenticate, asyncHandler(async (req, res) => {
  // In production, fetch from Stripe
  const invoices = [
    {
      id: 'inv_001',
      number: 'INV-001',
      amount: 2900,
      currency: 'usd',
      status: 'paid',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      pdfUrl: '#',
    },
    {
      id: 'inv_002',
      number: 'INV-002',
      amount: 2900,
      currency: 'usd',
      status: 'paid',
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      pdfUrl: '#',
    },
  ];

  res.json({
    success: true,
    data: invoices,
  });
}));

/**
 * GET /billing/plans
 * Get available plans
 */
router.get('/plans', asyncHandler(async (req, res) => {
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Perfect for getting started',
      price: 900,
      interval: 'month',
      features: [
        '5 team members',
        '10 projects',
        '5GB storage',
        'Basic analytics',
        'Email support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Best for growing teams',
      price: 2900,
      interval: 'month',
      popular: true,
      features: [
        '25 team members',
        'Unlimited projects',
        '100GB storage',
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
        'API access',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      price: 9900,
      interval: 'month',
      features: [
        'Unlimited team members',
        'Unlimited projects',
        'Unlimited storage',
        'Custom analytics',
        '24/7 phone support',
        'Custom integrations',
        'API access',
        'SLA guarantee',
        'Dedicated manager',
      ],
    },
  ];

  res.json({
    success: true,
    data: plans,
  });
}));

// ── POST /billing/csf/upload ──────────────────────────────────────────────────
// Recibe un PDF de Constancia de Situación Fiscal (SAT), extrae datos fiscales
// y lo sube a Supabase Storage. Auth opcional — funciona en checkout público.
router.post('/csf/upload', upload.single('csf'), asyncHandler(async (req, res) => {
  if (!req.file) throw HttpErrors.badRequest('Archivo CSF requerido');
  if (req.file.mimetype !== 'application/pdf' && !req.file.originalname?.toLowerCase().endsWith('.pdf')) {
    throw HttpErrors.badRequest('Solo se aceptan archivos PDF');
  }

  // Extract fiscal data from PDF text
  let extracted = { rfc: '', razonSocial: '', regimenFiscal: '', codigoPostal: '' };
  try {
    const pdfParse = getPdfParse();
    const pdfData = await pdfParse(req.file.buffer);
    extracted = extractFiscalData(pdfData.text);
  } catch (err) {
    console.warn('[CSF] PDF parse warning:', err.message);
    // Graceful — return empty data so user fills manually
  }

  // Upload to Supabase Storage (optional — only if SUPABASE_SERVICE_ROLE_KEY is set)
  let publicUrl = null;
  if (supabaseAdmin) {
    try {
      const userId   = req.user?.id ?? 'anon';
      const filename = `${userId}/${Date.now()}_csf.pdf`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('constancias_fiscales')
        .upload(filename, req.file.buffer, { contentType: 'application/pdf', upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from('constancias_fiscales')
          .getPublicUrl(filename);
        publicUrl = urlData?.publicUrl ?? null;
      } else {
        console.warn('[CSF] Storage upload failed:', uploadError.message);
      }
    } catch (err) {
      console.warn('[CSF] Storage error:', err.message);
    }
  }

  console.log(`[CSF] ✅ RFC:${extracted.rfc || '—'} | url:${publicUrl ? 'stored' : 'none'}`);
  res.json({ success: true, data: extracted, url: publicUrl });
}));

export default router;


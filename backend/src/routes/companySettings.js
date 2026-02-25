/**
 * Company Settings Routes — Singleton config for ToneBOX
 * GET  /api/company-settings  → público (checkout lo necesita sin auth)
 * PUT  /api/company-settings  → solo admin
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, HttpErrors } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router  = Router();
const prisma  = new PrismaClient();
const DEFAULTS = {
  id:                'tonebox',
  bankName:          'BBVA Bancomer',
  beneficiario:      'ToneBox México S.A. de C.V.',
  clabeNumber:       '012180004567890123',
  comprobantesEmail: 'pagos@tonebox.mx',
};

// ── GET /api/company-settings ─────────────────────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const settings = await prisma.companySettings.upsert({
    where:  { id: 'tonebox' },
    create: DEFAULTS,
    update: {},
  });
  res.json({ success: true, data: settings });
}));

// ── PUT /api/company-settings ─────────────────────────────────────────────────
router.put('/', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw HttpErrors.forbidden('Solo administradores');

  const allowed = ['bankName', 'beneficiario', 'clabeNumber', 'comprobantesEmail', 'rfc', 'razonSocial', 'usoCFDI'];
  const data = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) data[field] = req.body[field] || null;
  }

  if (Object.keys(data).length === 0) throw HttpErrors.badRequest('Sin campos para actualizar');

  const settings = await prisma.companySettings.upsert({
    where:  { id: 'tonebox' },
    create: { ...DEFAULTS, ...data },
    update: data,
  });

  console.log('[CompanySettings] ✅ Actualizado por admin:', req.user.email);
  res.json({ success: true, data: settings });
}));

export default router;

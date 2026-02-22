import express from 'express';
import multer from 'multer';
import { processSpeiConfirmation, approveSpeiPayment } from '../services/speiService.js';
import { createOrder, markOrderAsPaid } from '../services/orderService.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Solo PDF, JPG o PNG'));
    }
});

/**
 * POST /api/payments/spei/confirm
 * El cliente confirma pago SPEI. Crea la orden, genera el folio TB-XXXX y notifica a Iván.
 */
router.post('/spei/confirm', upload.single('receipt'), async (req, res) => {
    try {
        const { productName, amount, clientName, clientContact, trackingKey, userId } = req.body;

        if (!productName || !amount) {
            return res.status(400).json({ error: 'productName y amount son requeridos.' });
        }

        // 1. Crear la orden y generar el folio TB-XXXX
        const order = await createOrder({
            productName,
            amount,
            paymentMethod: 'SPEI',
            userId: userId || null,
            clientName,
            clientContact,
        });

        const receiptBuffer = req.file?.buffer || null;
        const receiptMimetype = req.file?.mimetype || null;

        // 2. Registrar pago y disparar correo a Iván con asunto: [TB-XXXX] - Nueva Orden de [Cliente]
        const speiPayment = await processSpeiConfirmation(
            {
                orderId: order.id,
                folio: order.folio,
                trackingKey,
                amount,
                productName,
                clientName,
                clientContact,
            },
            receiptBuffer,
            receiptMimetype
        );

        res.json({
            success: true,
            folio: order.folio,
            paymentId: speiPayment.id,
            message: `Tu pedido ${order.folio} fue registrado. Te contactaremos en cuanto validemos la transferencia.`,
        });
    } catch (error) {
        console.error('SPEI confirm error:', error);
        res.status(500).json({ error: 'Error procesando tu confirmación. Contáctanos por WhatsApp.' });
    }
});

/**
 * POST /api/payments/spei/:id/approve  (Admin)
 * Iván valida el pago en Banxico CEP y aprueba la orden.
 */
router.post('/spei/:id/approve', async (req, res) => {
    try {
        const payment = await approveSpeiPayment(req.params.id);
        if (payment.orderId) {
            await markOrderAsPaid(payment.orderId, 'SPEI');
        }
        res.json({ success: true, message: `✅ Orden aprobada y lista para despacho.`, payment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/payments/spei/pending  (Admin)
 * Lista pagos SPEI pendientes de validación para el Master Panel.
 */
router.get('/spei/pending', async (req, res) => {
    try {
        const pending = await prisma.speiPayment.findMany({
            where: { status: 'PENDING_VALIDATION' },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ total: pending.length, items: pending });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/payments/orders  (Crear orden directa sin pago SPEI)
 */
router.post('/orders', async (req, res) => {
    try {
        const order = await createOrder(req.body);
        res.json({ success: true, order, folio: order.folio });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/payments/stripe/webhook
 * Stripe confirma pagos con tarjeta.
 * Usa IDEMPOTENCIA: registra cada event.id para no procesar duplicados.
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
        return res.status(400).json({ error: 'Webhook secret no configurado.' });
    }

    let event;
    try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('[Stripe Webhook] Firma inválida:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // ── IDEMPOTENCIA ──────────────────────────────────────────────────────────
    // Si ya procesamos este evento, lo ignoramos silenciosamente (evita cobros dobles)
    const alreadyProcessed = await prisma.processedStripeEvent.findUnique({
        where: { id: event.id }
    });
    if (alreadyProcessed) {
        console.log(`[Stripe Webhook] ℹ️ Evento duplicado ignorado: ${event.id}`);
        return res.json({ received: true, duplicate: true });
    }

    // Registrar el evento como procesado ANTES de ejecutar la lógica
    await prisma.processedStripeEvent.create({
        data: { id: event.id, type: event.type }
    });
    // ──────────────────────────────────────────────────────────────────────────

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { orderId, folio } = session.metadata || {};

        if (folio) {
            await markOrderAsPaid(folio, 'CARD');
            console.log(`[Stripe Webhook] ✅ Orden ${folio} marcada como PAGADA con tarjeta.`);
        }
    }

    if (event.type === 'payment_intent.payment_failed') {
        const intent = event.data.object;
        console.warn(`[Stripe Webhook] ❌ Pago fallido: ${intent.id}`);
    }

    res.json({ received: true });
});

export default router;

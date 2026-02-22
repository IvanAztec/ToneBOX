import express from 'express';
import multer from 'multer';
import { processSpeiConfirmation, approveSpeiPayment } from '../services/speiService.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Multer: almacenamiento en memoria (el buffer se manda por correo)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF, JPG o PNG'));
        }
    }
});

/**
 * POST /api/payments/spei/confirm
 * El cliente confirma que ya realizó la transferencia.
 * Registra el pago y notifica a Iván por correo con el comprobante adjunto.
 */
router.post('/spei/confirm', upload.single('receipt'), async (req, res) => {
    try {
        const { orderId, trackingKey, amount, productName, clientContact } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({ error: 'orderId y amount son requeridos.' });
        }

        const receiptBuffer = req.file?.buffer || null;
        const receiptMimetype = req.file?.mimetype || null;

        const speiPayment = await processSpeiConfirmation(
            { orderId, trackingKey, amount, productName, clientContact },
            receiptBuffer,
            receiptMimetype
        );

        res.json({
            success: true,
            message: 'Comprobante recibido. Tu pedido será despachado en cuanto validemos la transferencia.',
            paymentId: speiPayment.id,
            status: speiPayment.status,
        });
    } catch (error) {
        console.error('SPEI confirm error:', error);
        res.status(500).json({ error: 'Error procesando tu confirmación. Contáctanos por WhatsApp.' });
    }
});

/**
 * POST /api/payments/spei/:id/approve (Admin only)
 * Iván aprueba el pago SPEI desde el Master Panel tras verificar en Banxico CEP.
 */
router.post('/spei/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await approveSpeiPayment(id);
        res.json({
            success: true,
            message: `✅ Orden ${payment.orderId} marcada como PAGADA. Lista para despacho.`,
            payment,
        });
    } catch (error) {
        console.error('SPEI approve error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/payments/spei/pending (Admin only)
 * Lista todos los pagos SPEI pendientes de validación para el Master Panel.
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
 * POST /api/payments/stripe/webhook
 * Webhook de Stripe — El pedido con tarjeta SOLO pasa a PAGADO cuando Stripe confirma.
 * Mantiene seguridad ante pagos fallidos o fraudulentos.
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
        console.error('Stripe webhook signature failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // ✅ Solo cuando Stripe confirma el pago → actualizar el estado de la orden
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, orderId } = session.metadata || {};
        console.log(`[Stripe Webhook] ✅ Pago confirmado: orden ${orderId}, usuario ${userId}`);
        // Aquí conectas con tu lógica de despacho cuando implementes el modelo Order completo
    }

    if (event.type === 'payment_intent.payment_failed') {
        const intent = event.data.object;
        console.warn(`[Stripe Webhook] ❌ Pago fallido: ${intent.id}`);
    }

    res.json({ received: true });
});

export default router;

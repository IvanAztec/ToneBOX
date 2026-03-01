import express from 'express';
import multer from 'multer';
import { processSpeiConfirmation, approveSpeiPayment } from '../services/speiService.js';
import { createOrder, markOrderAsPaid } from '../services/orderService.js';
import { validateSpeiPayment } from '../services/speiValidator.js';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

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

// ── Helper: crear PaymentLog ──────────────────────────────────────────────────
async function createPaymentLog({ orderId, catalogOrderId, folio, clientName, method, amount, status = 'PENDING', claveRastreo }) {
    return prisma.paymentLog.create({
        data: { orderId, catalogOrderId, folio, clientName, method, amount, status, claveRastreo },
    }).catch(err => console.error('[PaymentLog] Error creando log:', err.message));
}

/**
 * POST /api/payments/pre-folio
 * Crea una orden pre-reservada y devuelve el Folio Real (TB-XXXX)
 * al instante en que el usuario selecciona SPEI como método de pago.
 */
router.post('/pre-folio', async (req, res) => {
    try {
        const { productName, amount, userId } = req.body;

        const order = await createOrder({
            productName: productName || 'Reserva SPEI',
            amount: parseFloat(amount || 0),
            paymentMethod: 'SPEI',
            status: 'PRE_RESERVED',
            userId: userId || null,
        });

        res.json({ success: true, folio: order.folio, orderId: order.id });
    } catch (err) {
        console.error('[pre-folio] Error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/payments/spei/confirm
 * El cliente confirma pago SPEI. Crea la orden, genera el folio TB-XXXX y notifica a Iván con datos fiscales.
 */
router.post('/spei/confirm', upload.fields([
    { name: 'receipt', maxCount: 1 },
    { name: 'csf', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            productName, sku, amount, clientName, clientContact, trackingKey, userId,
            existingOrderId, requiresInvoice, rfc, razonSocial, regimenFiscal
        } = req.body;

        if (!productName || !amount) {
            return res.status(400).json({ error: 'productName y amount son requeridos.' });
        }

        // Datos Fiscales y Archivos
        const receiptFile = req.files?.['receipt']?.[0];
        const csfFile = req.files?.['csf']?.[0];

        const orderData = {
            productName,
            sku: sku || null,
            amount: parseFloat(amount),
            paymentMethod: 'SPEI',
            userId: userId || null,
            clientName,
            clientContact,
            requiresInvoice: requiresInvoice === 'true',
            rfc,
            razonSocial,
            regimenFiscal,
            status: 'PENDING_PAYMENT_VALIDATION', // Prioridad: Blindaje v3
        };

        let order;
        if (existingOrderId) {
            order = await prisma.order.findUnique({ where: { id: existingOrderId } });
            if (order) {
                // Actualizar orden existente si es el caso
                order = await prisma.order.update({
                    where: { id: existingOrderId },
                    data: { ...orderData, folio: order.folio }
                });
            } else {
                order = await createOrder(orderData);
            }
        } else {
            order = await createOrder(orderData);
        }

        // Registrar pago y notificar admin (pasar buffer de CSF si existe)
        const speiPayment = await processSpeiConfirmation(
            {
                orderId: order.id,
                folio: order.folio,
                trackingKey,
                amount,
                productName,
                clientName,
                clientContact,
                requiresInvoice: orderData.requiresInvoice,
                rfc,
                razonSocial,
                regimenFiscal
            },
            receiptFile?.buffer || null,
            receiptFile?.mimetype || null,
            csfFile?.buffer || null // Pasamos el buffer del CSF
        );

        // Crear PaymentLog
        await createPaymentLog({
            orderId: order.id,
            folio: order.folio,
            clientName: clientName || null,
            method: 'SPEI',
            amount: parseFloat(amount),
            status: 'PENDING',
            claveRastreo: trackingKey || null,
        });

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
 * POST /api/payments/spei/validate-cep
 * Admin: Valida clave de rastreo contra Banxico CEP.
 * Si es LIQUIDADA y monto correcto → marca orden como PAGADO automáticamente.
 */
router.post('/spei/validate-cep', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });

        const { orderId, catalogOrderId, claveRastreo, fechaOperacion, monto } = req.body;

        if (!claveRastreo || !fechaOperacion || !monto) {
            return res.status(400).json({ error: 'Se requieren: claveRastreo, fechaOperacion, monto' });
        }

        // 1. Obtener CLABE de configuración de empresa
        const settings = await prisma.companySettings.findUnique({ where: { id: 'tonebox' } });
        const clabeEsperada = settings?.clabeNumber || process.env.COMPANY_CLABE || '012180004567890123';

        // 2. Consultar Banxico CEP
        const { valid, cep, error: cepError } = await validateSpeiPayment({
            claveRastreo,
            fechaOperacion,
            montoEsperado: parseFloat(monto),
            clabeEsperada,
        });

        // 3. Upsert PaymentLog con datos CEP
        const logData = {
            method: 'SPEI',
            amount: parseFloat(monto),
            status: valid ? 'COMPLETED' : 'FAILED',
            claveRastreo,
            cepData: cep?.raw ?? null,
            cepBancoEmisor: cep?.bancoEmisor ?? null,
            cepRfcOrdenante: cep?.rfcOrdenante ?? null,
            cepHoraCert: cep?.horaCertificacion ? new Date(cep.horaCertificacion) : null,
            cepEstado: cep?.estado ?? null,
            validatedBy: 'BANXICO_AUTO',
            validatedAt: new Date(),
            notes: cepError ?? null,
        };

        // Buscar log existente o crear uno nuevo
        const existing = await prisma.paymentLog.findFirst({
            where: {
                OR: [
                    orderId ? { orderId } : {},
                    catalogOrderId ? { catalogOrderId } : {},
                    { claveRastreo },
                ],
            },
        });

        let log;
        if (existing) {
            log = await prisma.paymentLog.update({ where: { id: existing.id }, data: logData });
        } else {
            log = await prisma.paymentLog.create({
                data: { ...logData, orderId: orderId || null, catalogOrderId: catalogOrderId || null },
            });
        }

        // 4. Si válido → actualizar estado de la orden
        if (valid) {
            if (orderId) {
                await markOrderAsPaid(orderId, 'SPEI');
            }
            if (catalogOrderId) {
                await prisma.catalogOrder.update({
                    where: { id: catalogOrderId },
                    data: { status: 'PAID' },
                });
            }
        }

        res.json({
            success: true,
            valid,
            cep,
            log,
            error: cepError,
            message: valid
                ? `✅ LIQUIDADA. Orden marcada como PAGADO automáticamente.`
                : `⚠️ No validado: ${cepError}`,
        });

    } catch (error) {
        console.error('[validate-cep]', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/payments/spei/:id/approve  (Admin — aprobación manual)
 * Iván valida el pago manualmente y aprueba la orden.
 */
router.post('/spei/:id/approve', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });

        const payment = await approveSpeiPayment(req.params.id);
        if (payment.orderId) {
            await markOrderAsPaid(payment.orderId, 'SPEI');
        }

        // Actualizar o crear PaymentLog con aprobación manual
        const existing = await prisma.paymentLog.findFirst({ where: { orderId: payment.orderId ?? undefined } });
        if (existing) {
            await prisma.paymentLog.update({
                where: { id: existing.id },
                data: { status: 'COMPLETED', validatedBy: 'ADMIN_MANUAL', validatedAt: new Date() },
            });
        }

        res.json({ success: true, message: `✅ Orden aprobada y lista para despacho.`, payment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/payments/spei/pending  (Admin)
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
 * POST /api/payments/orders
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
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) return res.status(400).json({ error: 'Webhook secret no configurado.' });

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
    const alreadyProcessed = await prisma.processedStripeEvent.findUnique({ where: { id: event.id } });
    if (alreadyProcessed) {
        console.log(`[Stripe Webhook] ℹ️ Evento duplicado ignorado: ${event.id}`);
        return res.json({ received: true, duplicate: true });
    }
    await prisma.processedStripeEvent.create({ data: { id: event.id, type: event.type } });
    // ──────────────────────────────────────────────────────────────────────────

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { orderId, folio } = session.metadata || {};

        if (folio) {
            const order = await markOrderAsPaid(folio, 'CARD');
            await createPaymentLog({
                orderId: orderId || null,
                folio: folio,
                clientName: session.customer_details?.name || null,
                method: 'STRIPE',
                amount: (session.amount_total || 0) / 100,
                status: 'COMPLETED',
            });
            console.log(`[Stripe Webhook] ✅ Orden ${folio} marcada como PAGADA con tarjeta.`);
        }
    }

    if (event.type === 'payment_intent.payment_failed') {
        const intent = event.data.object;
        console.warn(`[Stripe Webhook] ❌ Pago fallido: ${intent.id}`);
    }

    res.json({ received: true });
});

/**
 * GET /api/payments/orders  (Admin dashboard)
 */
router.get('/orders', async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json({ total: orders.length, items: orders });
    } catch (error) {
        if (error.code === 'P2021') return res.json({ total: 0, items: [] });
        console.error('Orders list error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

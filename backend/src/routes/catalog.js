import express from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { getActiveCatalogAlerts, promoteAlertToProductDraft } from '../services/catalogIntelligence.js';

const prisma = new PrismaClient();

const router = express.Router();

/**
 * @route GET /api/catalog/alerts
 * @desc Master Panel: Obtiene todas las alertas activas de productos en demanda
 */
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await getActiveCatalogAlerts();
        res.json({ total: alerts.length, items: alerts });
    } catch (error) {
        console.error('Catalog alerts error:', error);
        res.status(200).json({ total: 0, items: [] });
    }
});

/**
 * @route POST /api/catalog/alerts/:id/promote
 * @desc Master Panel: Con 1 clic, convierte una alerta en un ProductDraft para revisión
 */
router.post('/alerts/:id/promote', async (req, res) => {
    try {
        const { id } = req.params;
        const draft = await promoteAlertToProductDraft(id);
        res.json({
            message: '✅ ProductDraft creado exitosamente. Revísalo en el panel de borradores.',
            draft
        });
    } catch (error) {
        console.error('Promote alert error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /api/catalog/order
 * @desc Crea un pedido del catálogo público (checkout 3 pasos)
 * @access Public
 */
router.post('/order', async (req, res) => {
    try {
        const { items, subtotal, speiTotal, shipping, billing, clientInfo } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Se requiere al menos un producto' });
        }

        // Crear orden (folio se genera con el id)
        const order = await prisma.catalogOrder.create({
            data: {
                folio:          'TC-TEMP',
                userId:         clientInfo?.userId  || null,
                clientName:     clientInfo?.name    || null,
                clientPhone:    clientInfo?.phone   || null,
                items:          items,
                subtotal:       subtotal  || 0,
                speiTotal:      speiTotal || 0,
                shippingStreet: shipping?.street  || null,
                shippingColonia:shipping?.colonia || null,
                shippingCity:   shipping?.city    || null,
                shippingState:  shipping?.state   || null,
                shippingZip:    shipping?.zip     || null,
                requiresInvoice: billing?.requiresInvoice || false,
                rfc:            billing?.rfc            || null,
                razonSocial:    billing?.razonSocial    || null,
                regimenFiscal:  billing?.regimenFiscal  || null,
                usoCFDI:        billing?.usoCFDI        || null,
                status:         'PENDING_PAYMENT_VALIDATION',
            },
        });

        // Folio: TC- + últimos 6 chars del cuid
        const folio = `TC-${order.id.slice(-6).toUpperCase()}`;
        await prisma.catalogOrder.update({ where: { id: order.id }, data: { folio } });

        console.log(`[CatalogOrder] ✅ ${folio} | $${speiTotal} SPEI | ${clientInfo?.name || 'Anónimo'}`);
        res.json({ success: true, folio, orderId: order.id });

    } catch (error) {
        console.error('Catalog order error:', error);
        // Generar folio de emergencia para no bloquear al cliente
        const fallback = `TC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        res.status(500).json({ success: false, folio: fallback, error: error.message });
    }
});

export default router;

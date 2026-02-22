import express from 'express';
import { getActiveCatalogAlerts, promoteAlertToProductDraft } from '../services/catalogIntelligence.js';

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
        res.status(500).json({ error: 'Internal server error' });
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

export default router;

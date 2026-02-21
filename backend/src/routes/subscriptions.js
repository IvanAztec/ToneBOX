import express from 'express';
import { subscriptionService } from '../services/subscriptionService.js';

const router = express.Router();

/**
 * @route GET /api/subscriptions/upcoming-renewals
 * @desc Get customers close to depletion for admin dashboard (7-day window)
 */
router.get('/upcoming-renewals', async (req, res) => {
    try {
        const renewals = await subscriptionService.getUpcomingRenewals(7);
        res.json(renewals);
    } catch (error) {
        console.error('Renewals fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

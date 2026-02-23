import express from 'express';
import { PrismaClient } from '@prisma/client';
import { validatePotentialProduct } from '../utils/productValidator.js';
import { evaluateDemandThreshold } from '../services/catalogIntelligence.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/products
 * @desc List all available products (not OUT_OF_STOCK)
 */
router.get('/', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const products = await prisma.product.findMany({
            include: { provider: { select: { name: true, code: true } } },
            orderBy: { updatedAt: 'desc' },
            take: limit,
        });
        res.json({ total: products.length, items: products });
    } catch (error) {
        if (error.code === 'P2021') return res.json({ total: 0, items: [] });
        console.error('Products list error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route GET /api/products/bundles
 * @desc List all active Duo Pack bundles
 */
router.get('/bundles', async (req, res) => {
    try {
        const bundles = await prisma.productBundle.findMany({
            where: { availabilityStatus: { not: 'OUT_OF_STOCK' } },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ total: bundles.length, items: bundles });
    } catch (error) {
        if (error.code === 'P2021') return res.json({ total: 0, items: [] });
        console.error('Bundles list error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route GET /api/products/search
 * @desc Search products and log results with market intelligence validation
 */
router.get('/search', async (req, res) => {
    try {
        const { q, brand, category } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Prepare search filters
        const where = {
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } },
                { compatibility: { hasSome: [q] } },
            ],
        };

        if (brand) where.brand = brand;
        if (category) where.category = category;

        // Execute search — include provider for tier classification
        const rawProducts = await prisma.product.findMany({
            where,
            include: { provider: { select: { name: true, code: true } } },
            take: 20,
        });

        // ── Tier classification ───────────────────────────────────────────────
        // AHORRO_VIP: BOP / CADTONER (Compatibles estratégicos)
        // PREMIUM:    CT / UNICOM (Originales + HP exclusivo)
        const AHORRO_PROVIDERS = new Set(['BOP', 'BOP-MX', 'CADTONER']);
        const products = rawProducts
            .map(p => ({
                ...p,
                tier: AHORRO_PROVIDERS.has(p.provider?.code) ? 'AHORRO_VIP' : 'PREMIUM',
            }))
            // Sort: COMPATIBLE (AHORRO_VIP) first, then ORIGINAL (PREMIUM)
            .sort((a, b) => {
                if (a.tier === 'AHORRO_VIP' && b.tier !== 'AHORRO_VIP') return -1;
                if (a.tier !== 'AHORRO_VIP' && b.tier === 'AHORRO_VIP') return 1;
                return 0;
            });

        const count = products.length;

        // VALIDATION LOGIC: If no results found, check if it "exists in reality" (heuristic)
        let validation = { isPotential: false };
        if (count === 0) {
            validation = validatePotentialProduct(q);
        }

        // LOGGING REQUIREMENT: Track missed opportunities vs typos
        await prisma.searchLog.create({
            data: {
                query: q,
                resultsCount: count,
                isPotentialProduct: validation.isPotential,
                metadata: count === 0 ? validation : {},
                userId: req.user?.id || null,
                ipAddress: req.ip,
            },
        });

        // AUTO-BLINDAJE: Si no hay resultados, evaluar si debemos crear una alerta
        let catalogAlert = null;
        if (count === 0 && validation.isPotential) {
            catalogAlert = await evaluateDemandThreshold(q, validation);
        }

        res.json({
            query: q,
            total: count,
            isPotentialValidProduct: validation.isPotential,
            ...(catalogAlert && { demandAlert: { priority: catalogAlert.priority, hitCount: catalogAlert.hitCount } }),
            products
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route GET /api/products/search-logs
 * @desc Get missed opportunities (searches with 0 results)
 * @access Private/Admin
 */
router.get('/search-logs', async (req, res) => {
    try {
        const logs = await prisma.searchLog.findMany({
            where: {
                resultsCount: 0,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 100,
        });

        res.json(logs);
    } catch (error) {
        console.error('Logs fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route GET /api/products/lost-opportunities
 * @desc Get high-confidence missed opportunities for the admin widget
 */
router.get('/lost-opportunities', async (req, res) => {
    try {
        const opportunities = await prisma.searchLog.findMany({
            where: {
                resultsCount: 0,
                isPotentialProduct: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
        });

        res.json(opportunities);
    } catch (error) {
        console.error('Opportunities fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

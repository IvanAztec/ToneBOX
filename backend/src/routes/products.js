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
 * @route GET /api/products/brands
 * @desc Distinct brands with product count (for brand filter UI)
 */
router.get('/brands', async (req, res) => {
    try {
        const result = await prisma.product.groupBy({
            by: ['brand'],
            where: {
                brand: { not: null },
                availabilityStatus: { not: 'OUT_OF_STOCK' },
            },
            _count: { brand: true },
            orderBy: { _count: { brand: 'desc' } },
        });
        const brands = result
            .filter(r => r.brand && r.brand !== 'Sin marca')
            .map(r => ({ name: r.brand, count: r._count.brand }));
        res.json({ brands });
    } catch (error) {
        if (error.code === 'P2021') return res.json({ brands: [] });
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /api/products/bundles
 * @desc List all active Duo Pack bundles
 */
router.get('/bundles', async (req, res) => {
    try {
        const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;

        const where = { availabilityStatus: { not: 'OUT_OF_STOCK' } };
        if (maxPrice != null && !isNaN(maxPrice)) {
            where.price = { lte: maxPrice };
        }

        const bundles = await prisma.productBundle.findMany({
            where,
            orderBy: { price: 'asc' },
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
 * @desc Search products with tier classification. Requires q or brand.
 */
router.get('/search', async (req, res) => {
    try {
        const { q, brand, category } = req.query;

        if (!q && !brand) {
            return res.status(400).json({ error: 'Se requiere q (búsqueda) o brand (marca)' });
        }

        const where = {};

        if (q) {
            where.OR = [
                { name:          { contains: q, mode: 'insensitive' } },
                { sku:           { contains: q, mode: 'insensitive' } },
                { compatibility: { hasSome: [q.toUpperCase()] } },
            ];
        }

        if (brand) {
            where.brand = { contains: brand, mode: 'insensitive' };
        }

        if (category) {
            where.category = { contains: category, mode: 'insensitive' };
        }

        // Execute search — include provider for tier classification
        const rawProducts = await prisma.product.findMany({
            where,
            include: { provider: { select: { name: true, code: true } } },
            take: 60,
            orderBy: { priceMXN: 'asc' },
        });

        // ── Tier classification ───────────────────────────────────────────────
        const AHORRO_PROVIDERS = new Set(['BOP', 'BOP-MX', 'CADTONER']);
        const products = rawProducts
            .map(p => ({
                ...p,
                tier: AHORRO_PROVIDERS.has(p.provider?.code) ? 'AHORRO_VIP' : 'PREMIUM',
            }))
            .sort((a, b) => {
                if (a.tier === 'AHORRO_VIP' && b.tier !== 'AHORRO_VIP') return -1;
                if (a.tier !== 'AHORRO_VIP' && b.tier === 'AHORRO_VIP') return 1;
                return 0;
            });

        const count = products.length;

        // VALIDATION LOGIC: If no results found, check if it "exists in reality"
        let validation = { isPotential: false };
        if (count === 0 && q) {
            validation = validatePotentialProduct(q);
        }

        // LOGGING REQUIREMENT: Track missed opportunities
        if (q) {
            await prisma.searchLog.create({
                data: {
                    query:              q,
                    resultsCount:       count,
                    isPotentialProduct: validation.isPotential,
                    metadata:           count === 0 ? validation : {},
                    userId:             req.user?.id || null,
                    ipAddress:          req.ip,
                },
            });
        }

        // AUTO-BLINDAJE: Si no hay resultados, evaluar alerta
        let catalogAlert = null;
        if (count === 0 && validation.isPotential && q) {
            catalogAlert = await evaluateDemandThreshold(q, validation);
        }

        res.json({
            query:   q || null,
            brand:   brand || null,
            total:   count,
            isPotentialValidProduct: validation.isPotential,
            ...(catalogAlert && { demandAlert: { priority: catalogAlert.priority, hitCount: catalogAlert.hitCount } }),
            products,
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
            where: { resultsCount: 0 },
            orderBy: { createdAt: 'desc' },
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
            where: { resultsCount: 0, isPotentialProduct: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        res.json(opportunities);
    } catch (error) {
        console.error('Opportunities fetch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { validatePotentialProduct } from '../utils/productValidator.js';
import { evaluateDemandThreshold } from '../services/catalogIntelligence.js';

const router = express.Router();
const prisma = new PrismaClient();

// ── Fuzzy intent parser ───────────────────────────────────────────────────────
// Permite queries como "toner para hp laserjet" o "tambores brother"

const STOP_WORDS = new Set([
    'para','de','el','la','los','las','con','en','un','una','mi','su',
    'y','o','a','al','del','que','impresora','por','mis','sus','marca',
]);

const INTENT_BRANDS = {
    hp:'hp', hewlett:'hp', 'hewlett-packard':'hp',
    brother:'brother', canon:'canon', epson:'epson',
    kyocera:'kyocera', samsung:'samsung', xerox:'xerox',
    ricoh:'ricoh', lexmark:'lexmark',
};

const INTENT_CATEGORIES = {
    toner:'Toner', tóner:'Toner', toners:'Toner', tóners:'Toner',
    drum:'Drum', tambor:'Drum', tambores:'Drum', drums:'Drum',
    cartucho:'Cartucho', cartuchos:'Cartucho', tinta:'Cartucho', tintas:'Cartucho',
};

const NOISE_CATEGORIES = ['Ribbon','Label','Paper','Consumible'];

/**
 * Generate SKU variants with and without dashes so that 'tn660' matches 'TN-660' and vice-versa.
 * e.g. 'tn660' → ['tn660', 'tn-660']
 *      'tn-660' → ['tn-660', 'tn660']
 */
function skuVariants(t) {
    const variants = [t];
    const stripped = t.replace(/-/g, '');
    if (stripped !== t) {
        variants.push(stripped);
    } else {
        // Try inserting a dash at the letter-to-number boundary
        const m = t.match(/^([a-z]+)(\d[\w]*)$/);
        if (m) variants.push(`${m[1]}-${m[2]}`);
    }
    return [...new Set(variants)];
}

function parseIntent(rawQ) {
    const tokens = rawQ.toLowerCase().split(/[\s,;/]+/).filter(t => t.length > 1);
    let brand = null, category = null;
    const model = [];
    for (const t of tokens) {
        if (STOP_WORDS.has(t))     continue;
        if (INTENT_BRANDS[t])     { brand    = brand    || INTENT_BRANDS[t];    continue; }
        if (INTENT_CATEGORIES[t]) { category = category || INTENT_CATEGORIES[t]; continue; }
        model.push(t);
    }
    return { brand, category, model };
}

/**
 * @route GET /api/products
 * @desc List all available products (not OUT_OF_STOCK)
 */
router.get('/', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const products = await prisma.product.findMany({
            select: {
                id: true, sku: true, name: true, brand: true, category: true,
                publicPrice: true, speiPrice: true, productType: true, providerSku: true,
                compatibility: true, image: true, availabilityStatus: true,
                updatedAt: true,
                provider: { select: { name: true, code: true } },
            },
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

        if (!q && !brand && !category) {
            return res.status(400).json({ error: 'Se requiere q, brand o category' });
        }

        // ── Fuzzy intent: parsea lenguaje natural ─────────────────────────────
        const intent      = q ? parseIntent(q) : { brand: null, category: null, model: [] };
        const effBrand    = brand    || intent.brand;
        const effCategory = category || intent.category;
        const conditions  = [];

        // Texto: cada token del modelo DEBE aparecer en name/sku/compatibility (AND)
        // skuVariants normalizes dashes so 'tn660' matches 'TN-660' and vice-versa
        if (intent.model.length > 0) {
            for (const t of intent.model) {
                const variants = skuVariants(t);
                conditions.push({
                    OR: variants.flatMap(v => [
                        { name:          { contains: v, mode: 'insensitive' } },
                        { sku:           { contains: v, mode: 'insensitive' } },
                        { providerSku:   { contains: v, mode: 'insensitive' } },
                        { compatibility: { hasSome:  [v.toUpperCase()] } },
                    ]),
                });
            }
        } else if (q && !intent.brand && !intent.category) {
            // Sin intención detectada → búsqueda de cadena completa como fallback
            const variants = skuVariants(q.toLowerCase().trim());
            conditions.push({
                OR: variants.flatMap(v => [
                    { name:          { contains: v, mode: 'insensitive' } },
                    { sku:           { contains: v, mode: 'insensitive' } },
                    { providerSku:   { contains: v, mode: 'insensitive' } },
                    { compatibility: { hasSome:  [v.toUpperCase()] } },
                ]),
            });
        }

        // Filtros de marca y categoría
        if (effBrand)    conditions.push({ brand:    { contains: effBrand,    mode: 'insensitive' } });
        if (effCategory) conditions.push({ category: { contains: effCategory, mode: 'insensitive' } });
        else             conditions.push({ category: { notIn: NOISE_CATEGORIES } });

        const where = conditions.length > 0 ? { AND: conditions } : {};

        // Execute search — select explícito para no filtrar campos internos
        const rawProducts = await prisma.product.findMany({
            where,
            select: {
                id: true, sku: true, name: true, brand: true, category: true,
                publicPrice: true, speiPrice: true, productType: true, providerSku: true,
                compatibility: true, image: true, availabilityStatus: true,
                provider: { select: { name: true, code: true } },
            },
            take: 60,
            orderBy: { publicPrice: 'asc' },
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

/**
 * BUNDLE GENERATOR
 * Crea ProductBundles Tóner + Drum en dos estrategias:
 *
 * 1. generateOriginalBundles()   — CT original toners + CT drums (matching por printer models)
 * 2. generateCompatibleBundles() — CADTONER/BOP compatible toners + CT drums
 *    Cross-reference: compToner.compatibility[] contiene el sku del tonerOriginal,
 *    luego usa los printer models del original para encontrar drums.
 *
 * Precio: (toner.priceMXN + drum.priceMXN) * 0.87  (ahorro 13%)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BUNDLE_DISCOUNT = 0.87;

// ── Estrategia 1: Originales CT-CT ───────────────────────────────────────────
async function generateOriginalBundles() {
    const products = await prisma.product.findMany({
        where: {
            availabilityStatus: 'IN_STOCK',
            category: { in: ['Toner', 'Drum'] },
            productType: 'ORIGINAL',
        },
        select: { id: true, sku: true, name: true, brand: true, category: true, compatibility: true, priceMXN: true },
    });

    const toners = products.filter(p => p.category === 'Toner');
    const drums  = products.filter(p => p.category === 'Drum');
    const bundles = [];

    for (const toner of toners) {
        if (!toner.compatibility?.length) continue;

        const compatibleDrums = drums.filter(drum =>
            drum.compatibility?.some(model => toner.compatibility.includes(model))
        );

        for (const drum of compatibleDrums) {
            const existing = await prisma.productBundle.findFirst({
                where: { tonerId: toner.id, drumId: drum.id },
            });
            if (existing) continue;

            const sharedModels = toner.compatibility.filter(m => drum.compatibility.includes(m));
            const printerModel = sharedModels[0] || 'Compatible';
            const rawPrice = (toner.priceMXN || 0) + (drum.priceMXN || 0);

            bundles.push({
                name:               `Duo Pack ${toner.brand} ${printerModel}`,
                description:        `${toner.name} + ${drum.name}`,
                tonerId:            toner.id,
                drumId:             drum.id,
                price:              rawPrice > 0 ? parseFloat((rawPrice * BUNDLE_DISCOUNT).toFixed(2)) : null,
                availabilityStatus: 'IN_STOCK',
            });
        }
    }
    return bundles;
}

// ── Estrategia 2: Compatible Toner + Original Drum ────────────────────────────
// Cross-ref: compToner.compatibility contiene el OEM sku del toner original.
// Usamos ese original para encontrar drums con printer models compatibles.
async function generateCompatibleBundles() {
    const origToners = await prisma.product.findMany({
        where: { availabilityStatus: 'IN_STOCK', category: 'Toner', productType: 'ORIGINAL' },
        select: { id: true, sku: true, providerSku: true, name: true, brand: true, compatibility: true, priceMXN: true },
    });

    const compToners = await prisma.product.findMany({
        where: { availabilityStatus: 'IN_STOCK', category: 'Toner', productType: 'COMPATIBLE' },
        select: { id: true, sku: true, name: true, brand: true, compatibility: true, priceMXN: true },
    });

    const drums = await prisma.product.findMany({
        where: { availabilityStatus: 'IN_STOCK', category: 'Drum' },
        select: { id: true, sku: true, name: true, brand: true, compatibility: true, priceMXN: true },
    });

    // Índice: origToner.sku → origToner
    const origByOEM = new Map(origToners.map(t => [t.sku, t]));

    const bundles = [];

    for (const compToner of compToners) {
        if (!compToner.compatibility?.length || !compToner.priceMXN) continue;

        // Buscar el toner original referenciado por este compatible
        const origToner = compToner.compatibility
            .map(oemRef => origByOEM.get(oemRef))
            .find(Boolean);

        if (!origToner || !origToner.compatibility?.length) continue;

        // Buscar drums compatibles con los printer models del original
        const compatibleDrums = drums.filter(drum =>
            drum.compatibility?.some(model => origToner.compatibility.includes(model))
        );

        for (const drum of compatibleDrums) {
            if (!drum.priceMXN) continue;

            const existing = await prisma.productBundle.findFirst({
                where: { tonerId: compToner.id, drumId: drum.id },
            });
            if (existing) continue;

            const printerModel = origToner.compatibility[0] || 'Compatible';
            const rawPrice = compToner.priceMXN + drum.priceMXN;

            bundles.push({
                name:               `Duo Pack Compatible ${compToner.brand} ${printerModel}`,
                description:        `${compToner.name} + ${drum.name}`,
                tonerId:            compToner.id,
                drumId:             drum.id,
                price:              parseFloat((rawPrice * BUNDLE_DISCOUNT).toFixed(2)),
                availabilityStatus: 'IN_STOCK',
            });
        }
    }
    return bundles;
}

// ── Entry point ───────────────────────────────────────────────────────────────
export async function generateBundlesFromDB() {
    const [origBundles, compBundles] = await Promise.all([
        generateOriginalBundles(),
        generateCompatibleBundles(),
    ]);

    const allBundles = [...origBundles, ...compBundles];

    if (allBundles.length === 0) {
        console.log('[BundleGen] No se encontraron nuevos pares compatibles.');
        return 0;
    }

    await prisma.productBundle.createMany({
        data:           allBundles,
        skipDuplicates: true,
    });

    console.log(`[BundleGen] ✅ ${origBundles.length} bundles originales + ${compBundles.length} bundles compatibles generados.`);
    return allBundles.length;
}

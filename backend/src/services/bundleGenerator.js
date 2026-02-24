/**
 * BUNDLE GENERATOR — Regla de Origen Único
 *
 * Cada Duo Pack (Tóner + Tambor) DEBE pertenecer al mismo proveedor/almacén.
 * PROHIBIDO: mezclar proveedores en un mismo bundle (doble flete = pérdida de margen).
 *
 * Estrategia única: generateSameProviderBundles(providerCode)
 *   - Fetches toners + drums del MISMO proveedor
 *   - Empareja por valores compartidos en compatibility[]
 *   - Precio: (toner.priceMXN + drum.priceMXN) * 0.87  (13% de ahorro)
 *
 * Proveedores válidos: CT (original), CADTONER (compatible, 30 drums), UNICOM (original), BOP (sin drums → skip)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BUNDLE_DISCOUNT = 0.87;

// Proveedores a procesar en orden de prioridad
const ACTIVE_PROVIDERS = ['CT', 'CADTONER', 'UNICOM', 'BOP'];

// ── Genera bundles para UN proveedor específico ────────────────────────────────

async function generateSameProviderBundles(providerCode) {
    const products = await prisma.product.findMany({
        where: {
            availabilityStatus: 'IN_STOCK',
            category: { in: ['Toner', 'Drum'] },
            provider: { code: providerCode },
        },
        include: { provider: { select: { code: true } } },
    });

    const toners = products.filter(p => p.category === 'Toner' && p.priceMXN);
    const drums  = products.filter(p => p.category === 'Drum'  && p.priceMXN);

    if (toners.length === 0 || drums.length === 0) {
        console.log(`[BundleGen] ${providerCode}: sin toners (${toners.length}) o drums (${drums.length}) — skip`);
        return [];
    }

    console.log(`[BundleGen] ${providerCode}: ${toners.length} toners · ${drums.length} drums`);

    const typeLabel = toners[0]?.productType === 'COMPATIBLE' ? 'Compatible ' : '';
    const bundles   = [];

    for (const toner of toners) {
        if (!toner.compatibility?.length) continue;

        const matchingDrums = drums.filter(drum =>
            drum.compatibility?.some(m => toner.compatibility.includes(m))
        );

        for (const drum of matchingDrums) {
            const existing = await prisma.productBundle.findFirst({
                where: { tonerId: toner.id, drumId: drum.id },
            });
            if (existing) continue;

            const sharedModels = toner.compatibility.filter(m => drum.compatibility.includes(m));
            const printerModel = sharedModels[0] ?? 'Kit';
            const rawPrice     = toner.priceMXN + drum.priceMXN;

            bundles.push({
                name:               `Duo Pack ${typeLabel}${toner.brand ?? ''} ${printerModel}`.trim(),
                description:        `${toner.name} + ${drum.name}`,
                tonerId:            toner.id,
                drumId:             drum.id,
                price:              parseFloat((rawPrice * BUNDLE_DISCOUNT).toFixed(2)),
                availabilityStatus: 'IN_STOCK',
            });
        }
    }

    console.log(`[BundleGen] ${providerCode}: ${bundles.length} nuevos pares encontrados`);
    return bundles;
}

// ── Elimina bundles cross-provider existentes ─────────────────────────────────

async function cleanCrossProviderBundles() {
    const all = await prisma.productBundle.findMany({
        include: {
            toner: { include: { provider: { select: { code: true } } } },
            drum:  { include: { provider: { select: { code: true } } } },
        },
    });

    const invalid = all.filter(b => {
        const tonerCode = b.toner?.provider?.code;
        const drumCode  = b.drum?.provider?.code;
        return tonerCode && drumCode && tonerCode !== drumCode;
    });

    if (invalid.length === 0) return 0;

    await prisma.productBundle.deleteMany({
        where: { id: { in: invalid.map(b => b.id) } },
    });

    console.log(`[BundleGen] 🧹 ${invalid.length} bundles cross-provider eliminados`);
    return invalid.length;
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function generateBundlesFromDB() {
    // 1. Limpiar bundles inválidos previos
    const cleaned = await cleanCrossProviderBundles();

    // 2. Generar bundles por proveedor (mismo origen)
    const results = await Promise.all(
        ACTIVE_PROVIDERS.map(code => generateSameProviderBundles(code))
    );

    const allBundles = results.flat();

    if (allBundles.length === 0) {
        console.log('[BundleGen] No se encontraron nuevos pares compatibles.');
        return { created: 0, cleaned };
    }

    await prisma.productBundle.createMany({
        data:           allBundles,
        skipDuplicates: true,
    });

    const byProvider = ACTIVE_PROVIDERS.map((code, i) => `${code}:${results[i].length}`).join(' · ');
    console.log(`[BundleGen] ✅ ${allBundles.length} bundles creados (${byProvider}) · ${cleaned} inválidos eliminados`);

    return { created: allBundles.length, cleaned };
}

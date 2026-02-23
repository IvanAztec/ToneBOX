/**
 * BUNDLE GENERATOR
 * Detecta automáticamente pares Tóner + Drum compatibles y crea ProductBundles.
 *
 * Lógica:
 * 1. Agrupa productos por modelos de impresora compatibles
 * 2. Si un grupo tiene ≥1 Toner y ≥1 Drum → genera bundle Duo Pack
 * 3. Precio del bundle = precio individual mejor estimado * 0.87 (ahorro 13%)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BUNDLE_DISCOUNT = 0.87; // 13% de descuento al comprar Toner + Drum juntos

/**
 * Genera bundles automáticamente desde los productos actuales en DB.
 * Se llama después de cada ingesta de CT.
 */
export async function generateBundlesFromDB() {
    const products = await prisma.product.findMany({
        where: {
            availabilityStatus: 'IN_STOCK',
            category: { in: ['Toner', 'Drum'] },
        },
        select: { id: true, sku: true, name: true, brand: true, category: true, compatibility: true },
    });

    const toners = products.filter(p => p.category === 'Toner');
    const drums  = products.filter(p => p.category === 'Drum');

    console.log(`[BundleGen] Analizando ${toners.length} toners y ${drums.length} drums...`);

    const bundlesToCreate = [];

    for (const toner of toners) {
        if (!toner.compatibility?.length) continue;

        // Buscar drums que comparten al menos un modelo de impresora
        const compatibleDrums = drums.filter(drum =>
            drum.compatibility?.some(model => toner.compatibility.includes(model))
        );

        for (const drum of compatibleDrums) {
            // Evitar duplicados: verificar si el bundle ya existe
            const existing = await prisma.productBundle.findFirst({
                where: { tonerId: toner.id, drumId: drum.id },
            });
            if (existing) continue;

            const sharedModels = toner.compatibility.filter(m => drum.compatibility.includes(m));
            const printerModel = sharedModels[0] || 'Compatible';

            bundlesToCreate.push({
                name:        `Duo Pack ${toner.brand} ${printerModel}`,
                description: `${toner.name} + ${drum.name}`,
                tonerId:     toner.id,
                drumId:      drum.id,
                availabilityStatus: 'IN_STOCK',
            });
        }
    }

    if (bundlesToCreate.length === 0) {
        console.log('[BundleGen] No se encontraron nuevos pares compatibles.');
        return 0;
    }

    await prisma.productBundle.createMany({
        data:           bundlesToCreate,
        skipDuplicates: true,
    });

    console.log(`[BundleGen] ✅ ${bundlesToCreate.length} bundles generados.`);
    return bundlesToCreate.length;
}

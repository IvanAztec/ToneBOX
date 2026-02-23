/**
 * CT Online — Cron Job de Sincronización Automática
 *
 * Ejecuta la ingesta completa del catálogo CT cada 4 horas.
 * Misma lógica que POST /api/admin/ct/ingest, pero sin HTTP roundtrip.
 *
 * Schedule: 0 *\/4 * * *  (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import {
    getCTToken,
    getCTExistencia,
    filterAhorroProducts,
    mapCTProductToSchema,
} from '../services/ctService.js';
import { downloadCTCatalogViaFTP } from '../services/ftpService.js';
import { generateBundlesFromDB } from '../services/bundleGenerator.js';

const prisma = new PrismaClient();

async function ensureCTProvider() {
    return prisma.provider.upsert({
        where:  { code: 'CT' },
        update: { active: true },
        create: {
            name:                'CT Internacional',
            code:                'CT',
            dispatchType:        'DIRECT',
            defaultShippingCost: 0,
            active:              true,
        },
    });
}

export async function runCTSync() {
    const startTime = Date.now();
    const ts = new Date().toISOString();
    console.log(`[CronSync ${ts}] Iniciando sincronización automática CT...`);

    try {
        // FTP primario; HTTP API como fallback
        let rawData;
        try {
            rawData = await downloadCTCatalogViaFTP();
        } catch (ftpErr) {
            console.warn(`[CronSync] FTP falló (${ftpErr.message}), usando HTTP API...`);
            const token = await getCTToken();
            rawData = await getCTExistencia(token);
        }
        const filtered = filterAhorroProducts(rawData);

        if (filtered.length === 0) {
            console.warn(`[CronSync] CT respondió sin productos en categorías Ahorro.`);
            return { success: false, reason: 'no_products' };
        }

        const provider = await ensureCTProvider();

        let created = 0;
        let updated = 0;
        let errors  = 0;

        for (const ctProduct of filtered) {
            const mapped = mapCTProductToSchema(ctProduct, provider.id);
            if (!mapped.sku) { errors++; continue; }

            try {
                const data = {
                    sku:               mapped.sku,
                    name:              mapped.name,
                    brand:             mapped.brand,
                    category:          mapped.category,
                    color:             mapped.color,
                    yield:             mapped.yield,
                    compatibility:     mapped.compatibility,
                    availabilityStatus: mapped.availabilityStatus,
                    productType:       mapped.productType,
                    priceMXN:          mapped.priceMXN,
                    image:             mapped.image,
                    providerId:        mapped.providerId,
                    providerSku:       mapped.providerSku,
                    weightKg:          mapped.weightKg,
                };

                const existing = await prisma.product.findUnique({ where: { sku: mapped.sku } });
                if (existing) {
                    await prisma.product.update({ where: { sku: mapped.sku }, data });
                    updated++;
                } else {
                    await prisma.product.create({ data });
                    created++;
                }
            } catch {
                errors++;
            }
        }

        const bundlesCreated = await generateBundlesFromDB();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(
            `[CronSync] ✅ Completado en ${elapsed}s — ` +
            `Creados: ${created}, Actualizados: ${updated}, ` +
            `Errores: ${errors}, Bundles: ${bundlesCreated}`
        );

        return { success: true, elapsed, created, updated, errors, bundlesCreated };

    } catch (error) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`[CronSync] ❌ Error en ${elapsed}s:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Registra el cron job. Llamar una sola vez al arrancar el servidor.
 * Expresión: cada 4 horas exactas (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)
 */
export function startCTSyncJob() {
    const EVERY_4_HOURS = '0 */4 * * *';

    cron.schedule(EVERY_4_HOURS, () => {
        runCTSync().catch(err =>
            console.error('[CronSync] Unhandled error en cron:', err.message)
        );
    }, {
        timezone: 'America/Mexico_City',
    });

    console.log('[CronSync] 🕐 Cron job registrado — sincronización CT cada 4 horas (America/Mexico_City)');
}

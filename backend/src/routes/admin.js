/**
 * ADMIN ROUTES — Ingesta de datos CT Online + Importación proveedores
 *
 * POST /api/admin/ct/ingest              → Descarga catálogo CT, upsert en Supabase, genera bundles
 * GET  /api/admin/ct/test                → Verifica conexión con CT (solo token)
 * GET  /api/admin/ct/status              → Resumen de productos y bundles en DB
 * POST /api/admin/providers/:code/import → Importa Excel/CSV de BOP, CADTONER, UNICOM
 * GET  /api/admin/providers              → Lista proveedores activos con conteo de productos
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { addDays, differenceInDays } from 'date-fns';
import { sendTelegramMessage, getTelegramStatus } from '../services/telegramService.js';
import {
    getCTToken,
    getCTExistencia,
    filterAhorroProducts,
    mapCTProductToSchema,
} from '../services/ctService.js';
import { downloadCTCatalogViaFTP } from '../services/ftpService.js';
import { generateBundlesFromDB } from '../services/bundleGenerator.js';
import { importProviderCatalog } from '../services/providerImportService.js';

const router = express.Router();
const prisma = new PrismaClient();

// ── WA Master Template ────────────────────────────────────────────────────────
// Copy oficial: personalizado + cierre + CTA "Adelante"
function buildWaMessage({ nombre, empresa, modelo, impresora, daysUsed, yieldPages }) {
    return [
        `Hola ${nombre}, espero que la semana vaya excelente en ${empresa}. 👋`,
        `Soy de ToneBOX. Te escribo porque según nuestros registros, tu tóner ${modelo} para la ${impresora} está llegando a su zona crítica de agotamiento.`,
        `📊 Llevas aproximadamente ${daysUsed} días de uso y el rendimiento estimado es de ${yieldPages} páginas.`,
        `¿Te gustaría que te enviemos el reemplazo antes de que se acabe? Tenemos el compatible ToneBOX que funciona perfecto y puedes ahorrar hasta 70% vs el original.`,
        `¡Que tengas un día muy productivo, quedo a la orden! 🙌`,
        `Respóndeme con *Adelante* y en minutos te coordino el reemplazo. 🚀`,
    ].join('\n\n');
}

// ── Upsert o crea el proveedor CT Internacional ───────────────────────────────
async function ensureCTProvider() {
    return prisma.provider.upsert({
        where:  { code: 'CT' },
        update: { active: true },
        create: {
            name:               'CT Internacional',
            code:               'CT',
            dispatchType:       'DIRECT',
            defaultShippingCost: 0,
            active:             true,
        },
    });
}

// ── POST /api/admin/ct/ingest ─────────────────────────────────────────────────
router.post('/ct/ingest', async (req, res) => {
    const startTime = Date.now();
    console.log('[CT Ingest] Iniciando ingesta de catálogo...');

    try {
        // 1. Descargar catálogo — FTP primero, HTTP API como fallback
        let rawData;
        try {
            rawData = await downloadCTCatalogViaFTP();
            console.log('[CT Ingest] Fuente: FTP');
        } catch (ftpErr) {
            console.warn(`[CT Ingest] FTP falló (${ftpErr.message}), intentando HTTP API...`);
            const token = await getCTToken();
            rawData = await getCTExistencia(token);
            console.log('[CT Ingest] Fuente: HTTP API');
        }

        // 3. Filtrar categorías "Ahorro"
        const filtered = filterAhorroProducts(rawData);

        if (filtered.length === 0) {
            return res.json({
                success: false,
                message: 'CT respondió pero no se encontraron productos en categorías Ahorro con stock.',
                total: rawData.length,
            });
        }

        // 4. Asegurar proveedor CT en DB
        const provider = await ensureCTProvider();

        // 5. Upsert productos en Supabase
        let created = 0;
        let updated = 0;
        const errors = [];

        for (const ctProduct of filtered) {
            const mapped = mapCTProductToSchema(ctProduct, provider.id);

            if (!mapped.sku) {
                errors.push(`Producto sin SKU: ${mapped.name}`);
                continue;
            }

            try {
                const existing = await prisma.product.findUnique({
                    where: { sku: mapped.sku },
                });

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
                    costPrice:         mapped.costPrice,
                    publicPrice:       mapped.publicPrice,
                    speiPrice:         mapped.speiPrice,
                    image:             mapped.image,
                    providerId:        mapped.providerId,
                    providerSku:       mapped.providerSku,
                    weightKg:          mapped.weightKg,
                };

                if (existing) {
                    await prisma.product.update({ where: { sku: mapped.sku }, data });
                    updated++;
                } else {
                    await prisma.product.create({ data });
                    created++;
                }
            } catch (err) {
                errors.push(`${mapped.sku}: ${err.message}`);
            }
        }

        // 6. Auto-generar bundles
        const bundlesCreated = await generateBundlesFromDB();

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(`[CT Ingest] ✅ Completado en ${elapsed}s — Creados: ${created}, Actualizados: ${updated}, Bundles: ${bundlesCreated}`);

        res.json({
            success:        true,
            elapsed:        `${elapsed}s`,
            catalog:        { total: rawData.length, filtered: filtered.length },
            products:       { created, updated, errors: errors.slice(0, 10) },
            bundles:        { created: bundlesCreated },
        });

    } catch (error) {
        console.error('[CT Ingest] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── GET /api/admin/ct/test ────────────────────────────────────────────────────
router.get('/ct/test', async (req, res) => {
    try {
        const token = await getCTToken();
        res.json({
            success:      true,
            message:      'Conexión con CT Internacional exitosa.',
            tokenPreview: `${token.substring(0, 20)}...`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error:   error.message,
            fixie:   process.env.FIXIE_URL ? 'configurado' : 'NO configurado',
            ct_url:  process.env.CT_API_URL || 'http://connect.ctonline.mx:3001',
        });
    }
});

// ── GET /api/admin/ct/status ──────────────────────────────────────────────────
router.get('/ct/status', async (req, res) => {
    try {
        const [products, bundles, inStock, onDemand] = await Promise.all([
            prisma.product.count(),
            prisma.productBundle.count(),
            prisma.product.count({ where: { availabilityStatus: 'IN_STOCK' } }),
            prisma.product.count({ where: { availabilityStatus: 'ON_DEMAND' } }),
        ]);

        const byCategory = await prisma.product.groupBy({
            by: ['category'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        });

        res.json({
            products:   { total: products, inStock, onDemand },
            bundles:    { total: bundles },
            byCategory: byCategory.map(c => ({ category: c.category, count: c._count.id })),
        });
    } catch (error) {
        if (error.code === 'P2021') {
            return res.json({ products: { total: 0 }, bundles: { total: 0 }, byCategory: [] });
        }
        res.status(500).json({ error: error.message });
    }
});

// ── GET /api/admin/providers ──────────────────────────────────────────────────
router.get('/providers', async (req, res) => {
    try {
        const providers = await prisma.provider.findMany({
            where: { active: true },
            include: { _count: { select: { products: true } } },
            orderBy: { code: 'asc' },
        });

        res.json({
            total: providers.length,
            providers: providers.map(p => ({
                id:           p.id,
                name:         p.name,
                code:         p.code,
                dispatchType: p.dispatchType,
                products:     p._count.products,
                active:       p.active,
            })),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── POST /api/admin/providers/:code/import ────────────────────────────────────
// Acepta multipart/form-data con campo "file" (xlsx o csv)
// curl -X POST .../api/admin/providers/BOP/import -F "file=@catalogo_bop.xlsx"
router.post('/providers/:code/import', async (req, res) => {
    const { code } = req.params;
    const ALLOWED_CODES = ['BOP', 'BOP-MX', 'CADTONER', 'UNICOM'];

    if (!ALLOWED_CODES.includes(code.toUpperCase())) {
        return res.status(400).json({
            error: `Código de proveedor no soportado: ${code}. Permitidos: ${ALLOWED_CODES.join(', ')}`,
        });
    }

    // Leer body raw como Buffer (Express json/urlencoded no aplica aquí)
    // Se espera que el cliente envíe el archivo como application/octet-stream
    // con header X-Filename indicando el nombre del archivo.
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        const filename = req.headers['x-filename'] || 'catalogo.xlsx';

        if (buffer.length === 0) {
            return res.status(400).json({ error: 'Body vacío. Envía el archivo como application/octet-stream.' });
        }

        try {
            const result = await importProviderCatalog(buffer, filename, code.toUpperCase());
            res.json({ success: true, ...result });
        } catch (err) {
            console.error(`[Import ${code}] Error:`, err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });
    req.on('error', err => {
        res.status(500).json({ error: err.message });
    });
});

// ── GET /api/admin/critical-alerts ───────────────────────────────────────────
// Zona Crítica de Agotamiento — usuarios con ≤ 10 días de tóner restante
// Formula: exhaustionDate = lastRefillDate + floor(yield / consumptionRate) días
router.get('/critical-alerts', async (req, res) => {
    const CRITICAL_DAYS = 10;
    const WA_ADMIN = '528441628536';

    try {
        const today = new Date();
        const subs = await prisma.replenishmentSubscription.findMany({
            where: { status: 'active' },
            orderBy: { nextReminderDate: 'asc' },
        });

        const alerts = [];

        for (const sub of subs) {
            if (!sub.consumptionRate || sub.consumptionRate <= 0) continue;

            const daysTotal     = Math.floor(sub.yield / sub.consumptionRate);
            const exhaustionDate = addDays(new Date(sub.lastRefillDate), daysTotal);
            const daysRemaining  = differenceInDays(exhaustionDate, today);

            if (daysRemaining > CRITICAL_DAYS) continue;

            const [user, product] = await Promise.all([
                prisma.user.findUnique({
                    where:  { id: sub.userId },
                    select: { id: true, name: true, email: true, whatsapp: true, empresa: true, cargo: true },
                }),
                prisma.product.findUnique({
                    where:  { id: sub.productId },
                    select: { name: true, sku: true, publicPrice: true, speiPrice: true },
                }),
            ]);

            const nombre    = user?.name    ?? 'Cliente';
            const empresa   = user?.empresa ?? 'tu empresa';
            const modelo    = product?.sku  ?? 'tóner';
            const impresora = sub.printerModel ?? 'tu impresora';
            const daysUsed  = differenceInDays(today, new Date(sub.lastRefillDate));
            const waTarget  = (user?.whatsapp ?? '').replace(/\D/g, '') || WA_ADMIN;

            const waMessage = buildWaMessage({ nombre, empresa, modelo, impresora, daysUsed, yieldPages: sub.yield });

            alerts.push({
                subscriptionId:  sub.id,
                daysRemaining,
                exhaustionDate:  exhaustionDate.toISOString(),
                isUrgent:        daysRemaining <= 3,
                user:            user ?? { id: sub.userId, name: 'Desconocido' },
                product:         product ?? { name: 'Desconocido', sku: sub.productId },
                printerModel:    sub.printerModel,
                yield:           sub.yield,
                consumptionRate: sub.consumptionRate,
                waUrl:           `https://wa.me/${waTarget}?text=${encodeURIComponent(waMessage)}`,
            });
        }

        alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
        res.json({ total: alerts.length, alerts });

    } catch (error) {
        console.error('[Critical Alerts] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ── GET /api/admin/wa-template/:subscriptionId ────────────────────────────────
// Genera URL de WhatsApp con el copy template personalizado para un cliente
router.get('/wa-template/:subscriptionId', async (req, res) => {
    const { subscriptionId } = req.params;
    const WA_ADMIN = '528441628536';

    try {
        const sub = await prisma.replenishmentSubscription.findUnique({
            where: { id: subscriptionId },
        });
        if (!sub) return res.status(404).json({ error: 'Suscripción no encontrada' });

        const [user, product] = await Promise.all([
            prisma.user.findUnique({
                where:  { id: sub.userId },
                select: { name: true, whatsapp: true, empresa: true },
            }),
            prisma.product.findUnique({
                where:  { id: sub.productId },
                select: { name: true, sku: true },
            }),
        ]);

        const today     = new Date();
        const nombre    = user?.name    ?? 'Cliente';
        const empresa   = user?.empresa ?? 'tu empresa';
        const modelo    = product?.sku  ?? 'tóner';
        const impresora = sub.printerModel ?? 'tu impresora';
        const daysUsed  = differenceInDays(today, new Date(sub.lastRefillDate));
        const waTarget  = (user?.whatsapp ?? '').replace(/\D/g, '') || WA_ADMIN;

        const message = buildWaMessage({ nombre, empresa, modelo, impresora, daysUsed, yieldPages: sub.yield });

        res.json({
            waUrl:   `https://wa.me/${waTarget}?text=${encodeURIComponent(message)}`,
            message,
            target:  waTarget,
        });

    } catch (error) {
        console.error('[WA Template] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ── GET /api/admin/telegram/status ───────────────────────────────────────────
router.get('/telegram/status', (_req, res) => {
    res.json(getTelegramStatus());
});

// ── POST /api/admin/telegram/test ────────────────────────────────────────────
// Envía el mensaje de prueba: "Hola Iván, la Fábrica ToneBOX está conectada"
router.post('/telegram/test', async (_req, res) => {
    try {
        const msg = '🏭 <b>Hola Iván, la Fábrica ToneBOX está conectada.</b>\n\nEl sistema de alertas está activo y listo para enviarte notificaciones de Zona Crítica de Agotamiento. ✅';
        const result = await sendTelegramMessage(msg);
        res.json({ success: true, messageId: result.message_id });
    } catch (error) {
        console.error('[Telegram Test] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;

/**
 * Replenishment Alert Job — Hiperpersonalización
 *
 * Ejecuta diariamente a las 09:00 América/Mexico_City.
 * Identifica clientes que no han comprado en +30 días y envía
 * un digest al admin vía Telegram con clasificación por urgencia.
 *
 * Niveles:
 *   MEDIUM   → 30–44 días  (🟡 En Riesgo)
 *   HIGH     → 45–59 días  (🟠 Urgente)
 *   CRITICAL → 60+ días    (🔴 Crítico)
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendTelegramMessage } from '../services/telegramService.js';

const prisma = new PrismaClient();

const THRESHOLD_DAYS = 30;

// ── Lógica core (exportada para uso en endpoint) ──────────────────────────────
export async function computeReplenishmentAlerts() {
    const now = new Date();
    const cutoff = new Date(now.getTime() - THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

    // Última compra por userId (órdenes no canceladas)
    const lastOrders = await prisma.catalogOrder.groupBy({
        by: ['userId'],
        _max: { createdAt: true },
        _count: { id: true },
        _sum: { speiTotal: true },
        where: {
            userId:  { not: null },
            status:  { not: 'CANCELLED' },
            createdAt: { lt: cutoff },     // solo los que ya pasaron el umbral
        },
    });

    if (lastOrders.length === 0) return [];

    // Datos de usuario para los at-risk
    const userIds = lastOrders.map(o => o.userId).filter(Boolean);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
            id: true, name: true, empresa: true,
            whatsapp: true, email: true, businessType: true,
        },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const alerts = lastOrders
        .map(o => {
            const user = userMap.get(o.userId);
            if (!user) return null;
            const lastPurchase = o._max.createdAt;
            const days = Math.floor((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
            const level = days >= 60 ? 'CRITICAL' : days >= 45 ? 'HIGH' : 'MEDIUM';
            return {
                userId:       user.id,
                name:         user.name,
                empresa:      user.empresa,
                whatsapp:     user.whatsapp,
                email:        user.email,
                businessType: user.businessType,
                lastPurchase,
                days,
                level,
                orderCount:   o._count.id,
                ltv:          o._sum.speiTotal ?? 0,
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.days - a.days);   // más días primero

    return alerts;
}

// ── Formato del mensaje Telegram ──────────────────────────────────────────────
function buildTelegramMessage(alerts, runDate) {
    const critical = alerts.filter(a => a.level === 'CRITICAL');
    const high     = alerts.filter(a => a.level === 'HIGH');
    const medium   = alerts.filter(a => a.level === 'MEDIUM');

    const dateStr = runDate.toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric',
        timeZone: 'America/Mexico_City',
    });

    const formatClient = (a) => {
        const empresa = a.empresa || a.name || a.email;
        const giro    = a.businessType !== 'POR_CLASIFICAR' ? ` (${a.businessType})` : '';
        const wa      = a.whatsapp ? ` • WA: ${a.whatsapp}` : '';
        return `  • <b>${empresa}</b>${giro} — ${a.days} días${wa}`;
    };

    let msg = `🔔 <b>Alertas de Reabastecimiento</b>\n`;
    msg += `📅 ${dateStr}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `Total en riesgo: <b>${alerts.length} cliente${alerts.length !== 1 ? 's' : ''}</b>\n\n`;

    if (critical.length > 0) {
        msg += `🔴 <b>CRÍTICOS (+60d): ${critical.length}</b>\n`;
        msg += critical.map(formatClient).join('\n') + '\n\n';
    }
    if (high.length > 0) {
        msg += `🟠 <b>URGENTES (45-59d): ${high.length}</b>\n`;
        msg += high.map(formatClient).join('\n') + '\n\n';
    }
    if (medium.length > 0) {
        msg += `🟡 <b>EN RIESGO (30-44d): ${medium.length}</b>\n`;
        msg += medium.map(formatClient).join('\n') + '\n\n';
    }

    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💡 <i>Abre CRM Clientes → Alertas para disparar WA de reabastecimiento</i>`;

    return msg;
}

// ── Runner principal ──────────────────────────────────────────────────────────
export async function runReplenishmentAlerts() {
    const now = new Date();
    console.log(`[ReplenishmentJob] Iniciando análisis — ${now.toISOString()}`);

    try {
        const alerts = await computeReplenishmentAlerts();

        console.log(`[ReplenishmentJob] ${alerts.length} clientes en riesgo encontrados`);
        if (alerts.length === 0) {
            console.log('[ReplenishmentJob] Sin alertas hoy. ¡Todos activos!');
            return { success: true, total: 0, alerts: [] };
        }

        // Enviar Telegram solo si está configurado
        const { configured } = await import('../services/telegramService.js')
            .then(m => ({ configured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) }));

        if (configured) {
            const msg = buildTelegramMessage(alerts, now);
            await sendTelegramMessage(msg);
            console.log('[ReplenishmentJob] ✅ Digest Telegram enviado');
        } else {
            console.warn('[ReplenishmentJob] ⚠️  Telegram no configurado — digest omitido');
        }

        const summary = {
            critical: alerts.filter(a => a.level === 'CRITICAL').length,
            high:     alerts.filter(a => a.level === 'HIGH').length,
            medium:   alerts.filter(a => a.level === 'MEDIUM').length,
        };
        console.log(`[ReplenishmentJob] Resumen: 🔴 ${summary.critical} | 🟠 ${summary.high} | 🟡 ${summary.medium}`);

        return { success: true, total: alerts.length, summary, alerts };

    } catch (error) {
        console.error('[ReplenishmentJob] ❌ Error:', error.message);
        return { success: false, error: error.message };
    }
}

// ── Registro del cron ─────────────────────────────────────────────────────────
export function startReplenishmentAlertJob() {
    // Todos los días a las 09:00 hora México
    const DAILY_9AM = '0 9 * * *';

    cron.schedule(DAILY_9AM, () => {
        runReplenishmentAlerts().catch(err =>
            console.error('[ReplenishmentJob] Error no manejado:', err.message)
        );
    }, {
        timezone: 'America/Mexico_City',
    });

    console.log('[ReplenishmentJob] 🕘 Alertas de reabastecimiento — diario 09:00 (America/Mexico_City)');
}

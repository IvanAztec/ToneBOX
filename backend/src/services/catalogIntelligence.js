/**
 * CATALOG INTELLIGENCE SERVICE
 * Sistema de Auto-Blindaje: aprende automáticamente qué productos añadir al catálogo.
 * 
 * Flujo:
 * 1. Cliente busca un tóner que no existe → SearchLog se crea.
 * 2. Si el mismo query acumula 3+ búsquedas (umbral), se genera un CatalogAlert.
 * 3. El Admin Panel muestra la alerta con prioridad y botón de acción.
 * 4. Con 1 click, Iván convierte la alerta en un ProductDraft para revisión.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMAND_THRESHOLD = 3; // Número de búsquedas para disparar una alerta

/**
 * Analiza los SearchLogs recientes para detectar productos en alta demanda
 * que no existen en el catálogo. Si supera el umbral, crea una alerta.
 *
 * @param {string} query - La búsqueda que acaba de fallar
 * @param {object} validation - Resultado del validador heurístico
 */
export async function evaluateDemandThreshold(query, validation) {
    if (!validation.isPotential) return null; // Solo procesar búsquedas que parecen reales

    // Contar cuántas veces se ha buscado este término sin resultados
    const hitCount = await prisma.searchLog.count({
        where: {
            query: { equals: query, mode: 'insensitive' },
            resultsCount: 0,
            isPotentialProduct: true,
        }
    });

    // Si superamos el umbral, crear o actualizar la alerta
    if (hitCount >= DEMAND_THRESHOLD) {
        const alert = await prisma.catalogAlert.upsert({
            where: { query },
            update: {
                hitCount: hitCount,
                priority: hitCount >= 10 ? 'CRITICAL' : hitCount >= 5 ? 'HIGH' : 'MEDIUM',
                updatedAt: new Date(),
            },
            create: {
                query,
                hitCount: hitCount,
                detectedBrand: validation.brand !== 'unknown' ? validation.brand : null,
                detectedType: validation.type,
                confidence: validation.confidence,
                priority: hitCount >= 10 ? 'CRITICAL' : hitCount >= 5 ? 'HIGH' : 'MEDIUM',
                status: 'PENDING',
            }
        });

        console.log(`[CatalogIntelligence] 🔔 Alerta generada: "${query}" (${hitCount} hits, prioridad: ${alert.priority})`);
        return alert;
    }

    return null;
}

/**
 * Obtiene todas las alertas activas ordenadas por prioridad y demanda.
 * Usado por el Admin Master Panel.
 */
export async function getActiveCatalogAlerts() {
    return prisma.catalogAlert.findMany({
        where: { status: 'PENDING' },
        orderBy: [
            { priority: 'asc' },
            { hitCount: 'desc' },
        ],
    });
}

/**
 * Convierte una alerta en un ProductDraft listo para que Iván revise y apruebe.
 * Este es el "1 clic" que cierra el ciclo de Auto-Blindaje.
 *
 * @param {string} alertId - ID de la CatalogAlert a procesar
 */
export async function promoteAlertToProductDraft(alertId) {
    const alert = await prisma.catalogAlert.findUnique({ where: { id: alertId } });
    if (!alert) throw new Error('Alerta no encontrada.');

    // Crear el borrador del producto
    const draft = await prisma.productDraft.create({
        data: {
            suggestedSku: alert.query.toUpperCase().replace(/\s+/g, '-'),
            suggestedName: `${alert.detectedBrand || 'Generic'} ${alert.query} (Compatible)`,
            brand: alert.detectedBrand || 'Sin definir',
            category: alert.detectedType || 'Toner',
            status: 'PENDING_REVIEW',
            sourceAlertId: alert.id,
            demandScore: alert.hitCount,
        }
    });

    // Marcar la alerta como procesada
    await prisma.catalogAlert.update({
        where: { id: alertId },
        data: { status: 'PROMOTED' }
    });

    console.log(`[CatalogIntelligence] ✅ ProductDraft creado: "${draft.suggestedName}"`);
    return draft;
}

/**
 * ORDER SERVICE
 * Gestiona el ciclo de vida de las órdenes de ToneBOX.
 * Folios formato: TB-[orderNumber] (ej. TB-1000, TB-1024)
 * Secuencias de BD empiezan en 1000 (ver migration SQL).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Genera el folio oficial de una orden.
 * @param {number} orderNumber - El número auto-incremental de la BD
 * @returns {string} - Ej: "TB-1024"
 */
export function generateFolio(orderNumber) {
    return `TB-${orderNumber}`;
}

/**
 * Crea una nueva orden con folio automático.
 * El orderNumber lo asigna PostgreSQL desde la secuencia (empieza en 1000).
 *
 * @param {Object} data
 * @param {string} data.productName
 * @param {number} data.amount
 * @param {string} data.paymentMethod - 'SPEI' | 'CARD'
 * @param {string} [data.userId]
 * @param {string} [data.clientName]
 * @param {string} [data.clientContact]
 */
export async function createOrder(data) {
    const { productName, amount, paymentMethod, userId, clientName, clientContact } = data;

    // Crear la orden — el orderNumber lo genera la BD automáticamente
    const order = await prisma.order.create({
        data: {
            folio: 'TB-TEMP', // Placeholder temporal; se actualiza en el siguiente paso
            productName,
            amount,
            paymentMethod,
            userId: userId || null,
            clientName: clientName || null,
            clientContact: clientContact || null,
        }
    });

    // Generar el folio real con el número asignado y actualizar
    const folio = generateFolio(order.orderNumber);
    const finalOrder = await prisma.order.update({
        where: { id: order.id },
        data: { folio }
    });

    console.log(`[OrderService] ✅ Orden creada: ${folio} | $${amount} MXN | ${paymentMethod}`);
    return finalOrder;
}

/**
 * Marca una orden como PAGADA (SPEI o Tarjeta).
 */
export async function markOrderAsPaid(folioOrId, method = 'SPEI') {
    const isId = folioOrId.startsWith('clx') || folioOrId.length > 10 && !folioOrId.startsWith('TB');
    const where = isId ? { id: folioOrId } : { folio: folioOrId };

    return prisma.order.update({
        where,
        data: {
            status: method === 'SPEI' ? 'PAID_SPEI' : 'PAID_CARD',
            paymentMethod: method,
        }
    });
}

/**
 * Obtiene órdenes pendientes para el Master Panel.
 */
export async function getPendingOrders() {
    return prisma.order.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, whatsapp: true } } }
    });
}

/**
 * Busca una orden por folio.
 */
export async function getOrderByFolio(folio) {
    return prisma.order.findUnique({ where: { folio } });
}

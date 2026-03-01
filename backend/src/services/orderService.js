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
 * Crea una nueva orden con folio automático y blindaje fiscal.
 * @param {Object} data
 */
export async function createOrder(data) {
    const {
        productName, sku, amount, paymentMethod, userId, clientName, clientContact,
        requiresInvoice, rfc, razonSocial, regimenFiscal, usoCFDI, csfUrl
    } = data;

    // Crear la orden — el orderNumber lo genera la BD automáticamente
    const order = await prisma.order.create({
        data: {
            folio: 'TB-TEMP', // Placeholder temporal
            productName,
            sku: sku || null,
            amount,
            paymentMethod,
            status: data.status || 'PENDING',
            userId: userId || null,
            clientName: clientName || null,
            clientContact: clientContact || null,
            requiresInvoice: !!requiresInvoice,
            rfc: rfc || null,
            razonSocial: razonSocial || null,
            regimenFiscal: regimenFiscal || null,
            usoCFDI: usoCFDI || null,
            csfUrl: csfUrl || null,
        }
    });

    // Generar el folio real con el número asignado y actualizar
    const folio = generateFolio(order.orderNumber);
    const finalOrder = await prisma.order.update({
        where: { id: order.id },
        data: { folio }
    });

    console.log(`[OrderService] ✅ Orden creada: ${folio} | SKU: ${sku || 'N/A'} | Fiscal: ${requiresInvoice ? 'SÍ' : 'NO'}`);
    return finalOrder;
}

/**
 * Marca una orden como PAGADA (SPEI o Tarjeta).
 * Si tiene SKU, dispara automáticamente la lógica de Dropshipping.
 */
export async function markOrderAsPaid(folioOrId, method = 'SPEI') {
    const isId = folioOrId.startsWith('clx') || folioOrId.length > 10 && !folioOrId.startsWith('TB');
    const where = isId ? { id: folioOrId } : { folio: folioOrId };

    const order = await prisma.order.update({
        where,
        data: {
            status: method === 'SPEI' ? 'PAID_SPEI' : 'PAID_CARD',
            paymentMethod: method,
        }
    });

    // ── GATILLO DE DROPSHIPPING AUTOMÁTICO ────────────────────────────────────
    if (order.sku) {
        try {
            // Intentar importar dinámicamente para evitar ciclos si los hay
            const { ProveedoresService } = await import('../features/proveedores/proveedores.service.js');

            // Buscar el proveedor vinculado al producto
            const product = await prisma.product.findUnique({
                where: { sku: order.sku },
                include: { provider: true }
            });

            if (product && product.provider) {
                console.log(`[OrderService] 🔄 Disparando Dropshipping para ${order.folio} -> ${product.provider.name}`);
                await ProveedoresService.testPiloto(
                    product.provider.id,
                    'Pendiente de Generación', // La guía se suele subir después, o se genera vía API
                    order.sku,
                    1,
                    { clientName: order.clientName, clientAddress: 'Verificar en Panel Admin' }
                );
            }
        } catch (dsErr) {
            console.error('[OrderService] ⚠️ Error en gatillo de dropshipping:', dsErr.message);
        }
    }

    return order;
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

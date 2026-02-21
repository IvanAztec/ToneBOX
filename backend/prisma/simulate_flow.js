import { PrismaClient } from '@prisma/client';
import { subscriptionService } from '../src/services/subscriptionService.js';
import { validatePotentialProduct } from '../src/utils/productValidator.js';
import { notificationScheduler } from '../src/services/notificationScheduler.js';

const prisma = new PrismaClient();

async function runSimulation() {
    console.log('🚀 Iniciando Simulación de Compra y Marketing ToneBOX...\n');

    // 1. Simulación de Usuario Nuevo y Lead Capture (WhatsApp)
    console.log('--- PASO 1: Registro de Usuario y Lead Capture ---');
    const user = await prisma.user.upsert({
        where: { email: 'cliente@estudiogarza.com' },
        update: {},
        create: {
            email: 'cliente@estudiogarza.com',
            name: 'Despacho Garza',
            whatsapp: '+528115551234',
            role: 'user',
        }
    });
    console.log(`✅ Usuario creado: ${user.name} | WhatsApp: ${user.whatsapp}`);

    // 2. Simulación de Compra de Duo Pack Brother L2540
    console.log('\n--- PASO 2: Compra de Duo Pack Toner + Drum ---');
    const toner = await prisma.product.findUnique({ where: { sku: 'TN660-COMP' } });

    // 3. Disparar Algoritmo de Anticipación de Demanda
    // Uso de 'Oficina Media': ~25 páginas por día
    const USAGE_RATE = 25;
    console.log(`🔄 Calculando demanda basada en tasa: ${USAGE_RATE} pág/día...`);

    const subscription = await subscriptionService.createSubscription({
        userId: user.id,
        productId: toner.id,
        yieldAmount: toner.yield, // 2600 páginas
        consumptionRate: USAGE_RATE,
        printerModel: 'Brother DCP-L2540DW'
    });

    console.log('✅ Suscripción Activa:');
    console.log(`   - Producto: ${toner.name}`);
    console.log(`   - Rendimiento: ${toner.yield} páginas`);
    console.log(`   - Fecha Estimada Agotamiento: ${new Date(new Date().getTime() + (toner.yield / USAGE_RATE) * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
    console.log(`   - 🚨 Recordatorio Programado (T-7): ${subscription.nextReminderDate.toLocaleDateString()}`);

    // EXIBICIÓN DE MENSAJE OFICIAL
    const finalMessage = notificationScheduler.prepareDuoPackMessage(user.name, subscription.printerModel);
    console.log('\n--- MENSAJE VIP OFICIAL (T-7) ---');
    console.log(`Cuerpo: ${finalMessage.body}`);
    console.log(`Acción: ${finalMessage.actions[0].label}`);

    // 4. Prueba de Error Heurística (Oportunidad Perdida)
    console.log('\n--- PASO 3: Simulación de Búsqueda Fallida (Market Intel) ---');
    const query = 'Ricoh MP 402 toner';
    const validation = validatePotentialProduct(query);

    const searchLog = await prisma.searchLog.create({
        data: {
            query: query,
            resultsCount: 0,
            isPotentialProduct: validation.isPotential,
            metadata: validation,
            userId: user.id,
            ipAddress: '192.168.1.50'
        }
    });

    console.log(`🔍 Búsqueda capturada: "${query}"`);
    console.log(`   - ¿Es producto real?: ${searchLog.isPotentialProduct ? 'SÍ (Alta Confianza)' : 'No'}`);
    console.log(`   - Tipo Detectado: ${validation.type} | Marca: ${validation.brand}`);
    console.log('\n✅ Simulación completada con éxito. ToneBOX está listo para el despliegue.');
}

runSimulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

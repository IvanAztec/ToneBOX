/**
 * test_critical_alerts.js — Validación del Growth Engine v1
 *
 * Tests:
 *   1. Lógica de Zona Crítica  → 6 meses atrás = URGENTE | 3 días atrás = NORMAL
 *   2. WA Template             → cierre + "Adelante" + %0A en URL
 *   3. Simulación del endpoint → JSON correcto, solo el crítico aparece
 *
 * Run desde /backend:
 *   node prisma/test_critical_alerts.js
 */

import { PrismaClient } from '@prisma/client';
import { addDays, differenceInDays, subDays } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
const prisma = new PrismaClient();

const CRITICAL_DAYS = 10;
const WA_ADMIN      = '528441628536';

// ── Mismo helper que admin.js ─────────────────────────────────────────────────
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

function pass(msg) { console.log(`  ✅  ${msg}`); return 1; }
function fail(msg) { console.log(`  ❌  ${msg}`); return 0; }

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
    const today = new Date();
    let passed = 0;
    let failed = 0;

    console.log('\n🧪  ToneBOX — Growth Engine: Test Suite\n' + '═'.repeat(60));

    // ── Seed: proveedor, producto y dos usuarios de prueba ────────────────────
    const provider = await prisma.provider.upsert({
        where:  { code: 'TEST_CRIT' },
        update: {},
        create: { name: 'Test Provider (auto)', code: 'TEST_CRIT', dispatchType: 'DIRECT', active: false },
    });

    const product = await prisma.product.upsert({
        where:  { sku: 'TEST-CE285A-CRIT' },
        update: {},
        create: {
            sku:         'TEST-CE285A-CRIT',
            name:        'Tóner Test HP 85A (prueba)',
            brand:       'HP',
            category:    'Toner',
            productType: 'COMPATIBLE',
            publicPrice: 184,
            speiPrice:   177,
            weightKg:    0.33,
            providerId:  provider.id,
        },
    });

    // Usuario CRÍTICO: compra hace 180 días, yield=1600, consumptionRate=10 → exhausted 20 días atrás
    const userCrit = await prisma.user.upsert({
        where:  { email: 'test.critico@tonebox.test' },
        update: { name: 'Ana García [TEST]', empresa: 'Imprenta Los Andes', cargo: 'Gerente de Compras', whatsapp: '528441000001' },
        create: { email: 'test.critico@tonebox.test', name: 'Ana García [TEST]', empresa: 'Imprenta Los Andes', cargo: 'Gerente de Compras', whatsapp: '528441000001', role: 'user' },
    });

    // Usuario NORMAL: compra hace 3 días, yield=1600, consumptionRate=10 → 157 días restantes
    const userNorm = await prisma.user.upsert({
        where:  { email: 'test.normal@tonebox.test' },
        update: { name: 'Carlos Ruiz [TEST]', empresa: 'Diseño y Print MX', whatsapp: '528441000002' },
        create: { email: 'test.normal@tonebox.test', name: 'Carlos Ruiz [TEST]', empresa: 'Diseño y Print MX', cargo: 'Diseñador Jefe', whatsapp: '528441000002', role: 'user' },
    });

    // Limpiar subs anteriores de estos usuarios
    await prisma.replenishmentSubscription.deleteMany({ where: { userId: { in: [userCrit.id, userNorm.id] } } });

    const subCrit = await prisma.replenishmentSubscription.create({
        data: {
            userId:          userCrit.id,
            productId:       product.id,
            printerModel:    'HP LaserJet P1102W',
            yield:           1600,
            consumptionRate: 10,
            lastRefillDate:  subDays(today, 180),  // 180 días atrás → agotado hace 20 días
            nextReminderDate: subDays(today, 27),
            status:          'active',
        },
    });

    const subNorm = await prisma.replenishmentSubscription.create({
        data: {
            userId:          userNorm.id,
            productId:       product.id,
            printerModel:    'HP LaserJet M1132',
            yield:           1600,
            consumptionRate: 10,
            lastRefillDate:  subDays(today, 3),    // 3 días atrás → 157 días restantes
            nextReminderDate: addDays(today, 150),
            status:          'active',
        },
    });

    console.log('\n  Datos de prueba insertados:');
    console.log(`  • ${userCrit.name} — lastRefill: hace 180 días`);
    console.log(`  • ${userNorm.name}  — lastRefill: hace 3 días\n`);

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 1 — Lógica de Zona Crítica
    // ══════════════════════════════════════════════════════════════════════════
    console.log('─'.repeat(60));
    console.log('TEST 1 — Lógica de Zona Crítica\n');

    for (const [sub, expectCrit] of [[subCrit, true], [subNorm, false]]) {
        const daysTotal      = Math.floor(sub.yield / sub.consumptionRate);
        const exhaustionDate = addDays(new Date(sub.lastRefillDate), daysTotal);
        const daysRemaining  = differenceInDays(exhaustionDate, today);
        const isCritical     = daysRemaining <= CRITICAL_DAYS;
        const isUrgent       = daysRemaining <= 3;

        const userName = expectCrit ? userCrit.name : userNorm.name;
        const label    = isCritical ? (isUrgent ? '🚨 URGENTE' : '⚠️  CRÍTICO') : '✅ NORMAL';

        console.log(`  ${userName}`);
        console.log(`    lastRefillDate:  ${new Date(sub.lastRefillDate).toDateString()}`);
        console.log(`    daysTotal:       ${daysTotal}d (${sub.yield} págs ÷ ${sub.consumptionRate}/día)`);
        console.log(`    exhaustionDate:  ${exhaustionDate.toDateString()}`);
        console.log(`    daysRemaining:   ${daysRemaining}`);
        console.log(`    Categoría:       ${label}`);

        const ok = (expectCrit && isCritical) || (!expectCrit && !isCritical);
        if (ok) { passed += pass(`Categorización correcta (esperado: ${expectCrit ? 'CRÍTICO' : 'NORMAL'})`); }
        else    { failed++; fail(`Categorización INCORRECTA (esperado: ${expectCrit ? 'CRÍTICO' : 'NORMAL'}, obtenido: ${isCritical ? 'CRÍTICO' : 'NORMAL'})`); }
        console.log();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 2 — WA Template: cierre, "Adelante", saltos de línea
    // ══════════════════════════════════════════════════════════════════════════
    console.log('─'.repeat(60));
    console.log('TEST 2 — WhatsApp Template\n');

    const daysUsed  = differenceInDays(today, new Date(subCrit.lastRefillDate));
    const message   = buildWaMessage({
        nombre:    userCrit.name,
        empresa:   userCrit.empresa,
        modelo:    product.sku,
        impresora: subCrit.printerModel,
        daysUsed,
        yieldPages: subCrit.yield,
    });
    const waUrl = `https://wa.me/${userCrit.whatsapp}?text=${encodeURIComponent(message)}`;

    console.log('  Mensaje (raw):');
    console.log('  ' + '─'.repeat(56));
    message.split('\n').forEach(line => console.log(`  ${line}`));
    console.log('  ' + '─'.repeat(56) + '\n');

    const hasClosing   = message.includes('¡Que tengas un día muy productivo, quedo a la orden!');
    const hasAdelante  = message.includes('Adelante');
    const hasLineBreak = waUrl.includes('%0A');

    if (hasClosing)  { passed += pass('Cierre "¡Que tengas un día muy productivo, quedo a la orden!" ✓'); }
    else             { failed++; fail('Cierre NO encontrado en el template'); }

    if (hasAdelante) { passed += pass('Invitación "Adelante" presente ✓'); }
    else             { failed++; fail('"Adelante" NO encontrado en el template'); }

    if (hasLineBreak){ passed += pass('Saltos de línea codificados como %0A en waUrl ✓'); }
    else             { failed++; fail('waUrl no contiene %0A — saltos de línea incorrectos'); }

    console.log(`\n  waUrl (primeros 120 chars):\n  ${waUrl.substring(0, 120)}...\n`);

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 3 — Simulación del endpoint /api/admin/critical-alerts
    // ══════════════════════════════════════════════════════════════════════════
    console.log('─'.repeat(60));
    console.log('TEST 3 — Simulación endpoint /api/admin/critical-alerts\n');

    const activeSubs = await prisma.replenishmentSubscription.findMany({
        where: { status: 'active', userId: { in: [userCrit.id, userNorm.id] } },
    });

    const alerts = [];
    for (const s of activeSubs) {
        if (!s.consumptionRate || s.consumptionRate <= 0) continue;
        const dt = Math.floor(s.yield / s.consumptionRate);
        const ed = addDays(new Date(s.lastRefillDate), dt);
        const dr = differenceInDays(ed, today);
        if (dr > CRITICAL_DAYS) continue;

        const [u, p] = await Promise.all([
            prisma.user.findUnique({ where: { id: s.userId }, select: { id: true, name: true, email: true, whatsapp: true, empresa: true, cargo: true } }),
            prisma.product.findUnique({ where: { id: s.productId }, select: { name: true, sku: true, publicPrice: true, speiPrice: true } }),
        ]);
        const du  = differenceInDays(today, new Date(s.lastRefillDate));
        const msg = buildWaMessage({ nombre: u?.name ?? 'Cliente', empresa: u?.empresa ?? 'tu empresa', modelo: p?.sku ?? 'tóner', impresora: s.printerModel ?? 'tu impresora', daysUsed: du, yieldPages: s.yield });
        alerts.push({
            subscriptionId: s.id,
            daysRemaining:  dr,
            exhaustionDate: ed.toISOString(),
            isUrgent:       dr <= 3,
            user:           { name: u?.name, empresa: u?.empresa, whatsapp: u?.whatsapp },
            product:        { sku: p?.sku },
            waUrl:          `https://wa.me/${(u?.whatsapp ?? WA_ADMIN).replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`,
        });
    }
    alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);

    console.log(`  Respuesta simulada del endpoint:`);
    console.log('  ' + JSON.stringify({ total: alerts.length, alerts }, null, 2).replace(/\n/g, '\n  ').substring(0, 600) + '...\n');

    const onlyOneCritical = alerts.length === 1;
    const isCorrectUser   = alerts[0]?.user?.name === userCrit.name;
    const isMarkedUrgent  = alerts[0]?.isUrgent === true;

    if (onlyOneCritical) { passed += pass(`Solo 1 alerta devuelta (el usuario normal queda fuera) ✓`); }
    else                 { failed++; fail(`Se esperaba 1 alerta, se obtuvieron ${alerts.length}`); }

    if (isCorrectUser)   { passed += pass(`El usuario crítico es "${alerts[0]?.user?.name}" ✓`); }
    else                 { failed++; fail(`Usuario incorrecto en la alerta`); }

    if (isMarkedUrgent)  { passed += pass(`isUrgent=true correctamente asignado ✓`); }
    else                 { failed++; fail(`isUrgent debería ser true para daysRemaining=${alerts[0]?.daysRemaining}`); }

    // ══════════════════════════════════════════════════════════════════════════
    // Resumen
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    const total = passed + failed;
    console.log(`\nRESULTADO: ${passed}/${total} tests pasaron\n`);

    if (failed === 0) {
        console.log('🎉  Todos los tests pasaron. Growth Engine validado.\n');
    } else {
        console.log('⚠️   Hay fallos — revisar antes de desplegar.\n');
    }

    // ── Cleanup ───────────────────────────────────────────────────────────────
    console.log('🧹  Limpiando datos de prueba...');
    await prisma.replenishmentSubscription.deleteMany({ where: { userId: { in: [userCrit.id, userNorm.id] } } });
    await prisma.user.deleteMany({ where: { email: { in: ['test.critico@tonebox.test', 'test.normal@tonebox.test'] } } });
    await prisma.product.deleteMany({ where: { sku: 'TEST-CE285A-CRIT' } });
    await prisma.provider.deleteMany({ where: { code: 'TEST_CRIT' } });
    console.log('✅  Datos de prueba eliminados.\n');

    if (failed > 0) process.exit(1);
}

main()
    .catch(e => { console.error('❌  Error fatal:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());

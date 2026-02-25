/**
 * seed_products.js — ToneBOX Catálogo Demo
 * Inserta productos HP, Samsung y Brother para pruebas del buscador.
 *
 * Run desde /backend:
 *   node prisma/seed_products.js
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
const prisma = new PrismaClient();

// ── Pricing helper (v3: COMPATIBLE×2.0, ORIGINAL×1.35, HARDWARE×1.20 × 1.04) ──
function calcPrices(costPrice, productType) {
    const margin =
        productType === 'COMPATIBLE' ? 2.0 :
        productType === 'HARDWARE'   ? 1.2 : 1.35;
    return {
        costPrice,
        publicPrice: Math.round(costPrice * margin * 1.04 * 100) / 100,
        speiPrice:   Math.round(costPrice * margin * 100) / 100,
    };
}

async function main() {
    console.log('🛒 ToneBOX — Seed de catálogo demo\n');

    // ── Proveedores ─────────────────────────────────────────────────────────
    const provDEMO = await prisma.provider.upsert({
        where:  { code: 'DEMO' },
        update: { name: 'Proveedor Demo', active: true },
        create: { name: 'Proveedor Demo', code: 'DEMO', dispatchType: 'DIRECT', active: true },
    });

    // BOP = proveedor ToneBOX para compatibles (waterfall prioridad 1)
    const provBOP = await prisma.provider.upsert({
        where:  { code: 'BOP' },
        update: { name: 'BOP — ToneBOX Compatible', active: true },
        create: { name: 'BOP — ToneBOX Compatible', code: 'BOP', dispatchType: 'DIRECT', active: true },
    });

    // CADTONER = proveedor secundario de compatibles (waterfall prioridad 2)
    const provCAD = await prisma.provider.upsert({
        where:  { code: 'CADTONER' },
        update: { name: 'Cadtoner', active: true },
        create: { name: 'Cadtoner', code: 'CADTONER', dispatchType: 'DIRECT', active: true },
    });

    console.log(`✅ Providers: DEMO | BOP | CADTONER\n`);

    const provider = provDEMO; // alias para productos genéricos

    // ── Productos ──────────────────────────────────────────────────────────
    // _providerCode indica qué proveedor asignar; se elimina antes del upsert
    const CATALOG = [
        // ─── HP ──────────────────────────────────────────────────────────
        // Original HP 85A — precio de lista ~$1499 (costPrice retro-calculado)
        {
            _providerCode: 'DEMO',
            sku:         'CE285A',
            name:        'Tóner HP 85A CE285A Original Negro 1600 págs',
            brand:       'HP',
            category:    'Toner',
            productType: 'ORIGINAL',
            costPrice:   1068,
            publicPrice: 1499,   // 1068 × 1.35 × 1.04 ≈ 1499
            speiPrice:   1442,   // 1068 × 1.35
            yield:       1600,
            compatibility:      ['P1102', 'P1102W', 'M1130', 'M1132', 'M1210', 'M1212NF', 'M1217NFW', 'M1130MFP'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.35,
        },
        // Compatible ToneBOX HP 85A — proveedor BOP (waterfall prioridad 1)
        {
            _providerCode: 'BOP',
            sku:         'CE285A-C',
            name:        'Tóner Compatible HP 85A CE285A Negro ToneBOX',
            brand:       'HP',
            category:    'Toner',
            productType: 'COMPATIBLE',
            costPrice:   88,
            publicPrice: 184,    // precio fijado por ToneBOX
            speiPrice:   177,    // 184 / 1.04 ≈ 177
            yield:       1600,
            // CE285A en compatibility → pairProducts() lo empareja con el Original
            compatibility:      ['CE285A', 'P1102', 'P1102W', 'M1130', 'M1132', 'M1210', 'M1212NF', 'M1217NFW'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.33,
        },

        // ─── Samsung ─────────────────────────────────────────────────────
        {
            _providerCode: 'DEMO',
            sku:         'MLT-D111S',
            name:        'Tóner Samsung MLT-D111S Original Negro 1000 págs',
            brand:       'Samsung',
            category:    'Toner',
            productType: 'ORIGINAL',
            ...calcPrices(350, 'ORIGINAL'),
            yield:       1000,
            compatibility:      ['M2020', 'M2020W', 'M2022', 'M2022W', 'M2070', 'M2070W', 'M2070F', 'M2071'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.30,
        },
        {
            _providerCode: 'BOP',
            sku:         'MLT-D111S-C',
            name:        'Tóner Compatible Samsung MLT-D111S Negro ToneBOX',
            brand:       'Samsung',
            category:    'Toner',
            productType: 'COMPATIBLE',
            ...calcPrices(130, 'COMPATIBLE'),
            yield:       1000,
            compatibility:      ['MLT-D111S', 'M2020', 'M2020W', 'M2022', 'M2022W', 'M2070', 'M2070W', 'M2070F'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.28,
        },
        {
            _providerCode: 'DEMO',
            sku:         'MLT-D101S',
            name:        'Tóner Samsung MLT-D101S Original Negro 1500 págs',
            brand:       'Samsung',
            category:    'Toner',
            productType: 'ORIGINAL',
            ...calcPrices(310, 'ORIGINAL'),
            yield:       1500,
            compatibility:      ['ML-2160', 'ML-2165', 'ML-2165W', 'SCX-3400', 'SCX-3401', 'SCX-3405', 'SCX-3406W'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.30,
        },
        {
            _providerCode: 'BOP',
            sku:         'MLT-D101S-C',
            name:        'Tóner Compatible Samsung MLT-D101S Negro ToneBOX',
            brand:       'Samsung',
            category:    'Toner',
            productType: 'COMPATIBLE',
            ...calcPrices(120, 'COMPATIBLE'),
            yield:       1500,
            compatibility:      ['MLT-D101S', 'ML-2160', 'ML-2165', 'SCX-3400', 'SCX-3405'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.28,
        },

        // ─── Brother ─────────────────────────────────────────────────────
        {
            _providerCode: 'DEMO',
            sku:         'TN-660',
            name:        'Tóner Brother TN-660 Original Negro Alta Capacidad 2600 págs',
            brand:       'Brother',
            category:    'Toner',
            productType: 'ORIGINAL',
            ...calcPrices(480, 'ORIGINAL'),
            yield:       2600,
            compatibility:      ['HL-L2300D', 'HL-L2305W', 'HL-L2320D', 'HL-L2340DW', 'HL-L2360DW', 'MFC-L2700DW', 'MFC-L2720DW', 'DCP-L2520DW'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.45,
        },
        {
            _providerCode: 'BOP',
            sku:         'TN-660-C',
            name:        'Tóner Compatible Brother TN-660 Negro Alta Capacidad ToneBOX',
            brand:       'Brother',
            category:    'Toner',
            productType: 'COMPATIBLE',
            ...calcPrices(160, 'COMPATIBLE'),
            yield:       2600,
            compatibility:      ['TN-660', 'TN660', 'HL-L2300D', 'HL-L2305W', 'HL-L2320D', 'HL-L2340DW', 'HL-L2360DW', 'MFC-L2700DW', 'DCP-L2520DW'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.43,
        },
        {
            _providerCode: 'DEMO',
            sku:         'TN-630',
            name:        'Tóner Brother TN-630 Original Negro Estándar 1200 págs',
            brand:       'Brother',
            category:    'Toner',
            productType: 'ORIGINAL',
            ...calcPrices(380, 'ORIGINAL'),
            yield:       1200,
            compatibility:      ['HL-L2300D', 'HL-L2305W', 'HL-L2320D', 'HL-L2340DW', 'MFC-L2700DW', 'DCP-L2520DW'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.35,
        },
        {
            _providerCode: 'DEMO',
            sku:         'TN-760',
            name:        'Tóner Brother TN-760 Original Negro Alta Capacidad 3000 págs',
            brand:       'Brother',
            category:    'Toner',
            productType: 'ORIGINAL',
            ...calcPrices(550, 'ORIGINAL'),
            yield:       3000,
            compatibility:      ['HL-L2350DW', 'HL-L2370DW', 'HL-L2390DW', 'MFC-L2710DW', 'MFC-L2750DW', 'DCP-L2550DW'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.50,
        },
        {
            _providerCode: 'BOP',
            sku:         'TN-760-C',
            name:        'Tóner Compatible Brother TN-760 Negro Alta Capacidad ToneBOX',
            brand:       'Brother',
            category:    'Toner',
            productType: 'COMPATIBLE',
            ...calcPrices(180, 'COMPATIBLE'),
            yield:       3000,
            compatibility:      ['TN-760', 'TN760', 'HL-L2350DW', 'HL-L2370DW', 'MFC-L2710DW', 'MFC-L2750DW', 'DCP-L2550DW'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.48,
        },
    ];

    // ── Mapa de providers para asignación por waterfall ─────────────────────
    const provMap = { DEMO: provDEMO, BOP: provBOP, CADTONER: provCAD };

    console.log('  SKU             PROV    TIPO         PÚBLICO    SPEI       YIELD');
    console.log('  ' + '─'.repeat(72));

    for (const { _providerCode = 'DEMO', ...p } of CATALOG) {
        const pid = (provMap[_providerCode] ?? provDEMO).id;
        await prisma.product.upsert({
            where:  { sku: p.sku },
            update: { ...p, providerId: pid },
            create: { ...p, providerId: pid },
        });
        console.log(
            `  ${p.sku.padEnd(16)}${_providerCode.padEnd(8)}${p.productType.padEnd(13)}` +
            `$${String(p.publicPrice).padEnd(11)}$${String(p.speiPrice).padEnd(11)}${p.yield ?? '-'} págs`
        );
    }

    console.log(`\n🎯 ${CATALOG.length} productos insertados. Fábrica lista para pruebas.`);
    console.log('\nPrueba rápida:');
    console.log('  HP 85A       → GET /api/products/search?brand=hp&q=85a');
    console.log('  HP CE285A    → GET /api/products/search?q=ce285a');
    console.log('  Samsung 111  → GET /api/products/search?brand=samsung&q=111');
    console.log('  Brother tn660→ GET /api/products/search?brand=brother&q=tn660');
}

main()
    .catch(e => { console.error('❌ Seed error:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());

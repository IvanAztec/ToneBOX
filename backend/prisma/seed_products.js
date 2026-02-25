/**
 * seed_products.js — ToneBOX Catálogo Demo
 * Inserta productos Samsung y Brother para pruebas del buscador.
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

    // ── Proveedor demo (sin Fixie/CT para pruebas locales) ─────────────────
    const provider = await prisma.provider.upsert({
        where:  { code: 'DEMO' },
        update: { name: 'Proveedor Demo', active: true },
        create: {
            name:         'Proveedor Demo',
            code:         'DEMO',
            dispatchType: 'DIRECT',
            active:       true,
        },
    });
    console.log(`✅ Provider: ${provider.name} (${provider.code})\n`);

    // ── Productos ──────────────────────────────────────────────────────────
    const CATALOG = [
        // ─── Samsung ─────────────────────────────────────────────────────
        {
            sku:         'MLT-D111S',
            name:        'Tóner Samsung MLT-D111S Original Negro 1000 págs',
            brand:       'Samsung',
            category:    'Toner',
            productType: 'ORIGINAL',
            ...calcPrices(350, 'ORIGINAL'),
            compatibility:      ['M2020', 'M2020W', 'M2022', 'M2022W', 'M2070', 'M2070W', 'M2070F', 'M2071'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.30,
        },
        {
            sku:         'MLT-D111S-C',
            name:        'Tóner Compatible Samsung MLT-D111S Negro ToneBOX',
            brand:       'Samsung',
            category:    'Toner',
            productType: 'COMPATIBLE',
            ...calcPrices(130, 'COMPATIBLE'),
            // Incluye el SKU original en compatibility para emparejar en pairProducts()
            compatibility:      ['MLT-D111S', 'M2020', 'M2020W', 'M2022', 'M2022W', 'M2070', 'M2070W', 'M2070F'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.28,
        },
        {
            sku:         'MLT-D101S',
            name:        'Tóner Samsung MLT-D101S Original Negro 1500 págs',
            brand:       'Samsung',
            category:    'Toner',
            productType: 'ORIGINAL',
            ...calcPrices(310, 'ORIGINAL'),
            compatibility:      ['ML-2160', 'ML-2165', 'ML-2165W', 'SCX-3400', 'SCX-3401', 'SCX-3405', 'SCX-3406W'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.30,
        },
        {
            sku:         'MLT-D101S-C',
            name:        'Tóner Compatible Samsung MLT-D101S Negro ToneBOX',
            brand:       'Samsung',
            category:    'Toner',
            productType: 'COMPATIBLE',
            ...calcPrices(120, 'COMPATIBLE'),
            compatibility:      ['MLT-D101S', 'ML-2160', 'ML-2165', 'SCX-3400', 'SCX-3405'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.28,
        },

        // ─── Brother ─────────────────────────────────────────────────────
        {
            sku:         'TN-660',
            name:        'Tóner Brother TN-660 Original Negro Alta Capacidad 2600 págs',
            brand:       'Brother',
            category:    'Toner',
            productType: 'ORIGINAL',
            ...calcPrices(480, 'ORIGINAL'),
            compatibility:      ['HL-L2300D', 'HL-L2305W', 'HL-L2320D', 'HL-L2340DW', 'HL-L2360DW', 'MFC-L2700DW', 'MFC-L2720DW', 'DCP-L2520DW'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.45,
        },
        {
            sku:         'TN-660-C',
            name:        'Tóner Compatible Brother TN-660 Negro Alta Capacidad ToneBOX',
            brand:       'Brother',
            category:    'Toner',
            productType: 'COMPATIBLE',
            ...calcPrices(160, 'COMPATIBLE'),
            // TN-660 y TN660 (sin guión) para que pairProducts() encuentre el match
            compatibility:      ['TN-660', 'TN660', 'HL-L2300D', 'HL-L2305W', 'HL-L2320D', 'HL-L2340DW', 'HL-L2360DW', 'MFC-L2700DW', 'DCP-L2520DW'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.43,
        },
        {
            sku:         'TN-630',
            name:        'Tóner Brother TN-630 Original Negro Estándar 1200 págs',
            brand:       'Brother',
            category:    'Toner',
            productType: 'ORIGINAL',
            ...calcPrices(380, 'ORIGINAL'),
            compatibility:      ['HL-L2300D', 'HL-L2305W', 'HL-L2320D', 'HL-L2340DW', 'MFC-L2700DW', 'DCP-L2520DW'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.35,
        },
        {
            sku:         'TN-760',
            name:        'Tóner Brother TN-760 Original Negro Alta Capacidad 3000 págs',
            brand:       'Brother',
            category:    'Toner',
            productType: 'ORIGINAL',
            ...calcPrices(550, 'ORIGINAL'),
            compatibility:      ['HL-L2350DW', 'HL-L2370DW', 'HL-L2390DW', 'MFC-L2710DW', 'MFC-L2750DW', 'DCP-L2550DW'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.50,
        },
        {
            sku:         'TN-760-C',
            name:        'Tóner Compatible Brother TN-760 Negro Alta Capacidad ToneBOX',
            brand:       'Brother',
            category:    'Toner',
            productType: 'COMPATIBLE',
            ...calcPrices(180, 'COMPATIBLE'),
            compatibility:      ['TN-760', 'TN760', 'HL-L2350DW', 'HL-L2370DW', 'MFC-L2710DW', 'MFC-L2750DW', 'DCP-L2550DW'],
            availabilityStatus: 'IN_STOCK',
            weightKg:           0.48,
        },
    ];

    console.log('  SKU             MARCA      TIPO         PÚBLICO    SPEI');
    console.log('  ' + '─'.repeat(62));

    for (const p of CATALOG) {
        await prisma.product.upsert({
            where:  { sku: p.sku },
            update: { ...p, providerId: provider.id },
            create: { ...p, providerId: provider.id },
        });
        console.log(
            `  ${p.sku.padEnd(16)}${p.brand.padEnd(11)}${p.productType.padEnd(13)}` +
            `$${String(p.publicPrice).padEnd(11)}$${p.speiPrice}`
        );
    }

    console.log(`\n🎯 ${CATALOG.length} productos insertados. Fábrica lista para pruebas.`);
    console.log('\nPrueba rápida:');
    console.log('  Samsung 111  → GET /api/products/search?brand=samsung&q=111');
    console.log('  Brother tn660 → GET /api/products/search?brand=brother&q=tn660');
}

main()
    .catch(e => { console.error('❌ Seed error:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());

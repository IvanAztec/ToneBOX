import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding ToneBOX market intelligence data...');

    // 1. Create a Default Provider (BOP)
    const provider = await prisma.provider.upsert({
        where: { code: 'BOP-MX' },
        update: {},
        create: {
            name: 'BOP Internacional México',
            code: 'BOP-MX',
            dispatchType: 'DIRECT',
            active: true,
        },
    });

    // 2. Real Duo Packs / Matches (Brother, Canon, Samsung)

    // --- BROTHER TN660 SERIES ---
    const tonerTN660 = await prisma.product.upsert({
        where: { sku: 'TN660-COMP' },
        update: {},
        create: {
            sku: 'TN660-COMP',
            name: 'Tóner Brother TN660 Compatible Alta Capacidad',
            brand: 'Brother',
            category: 'Toner',
            color: 'Black',
            yield: 2600,
            compatibility: ['DCP-L2540DW', 'HL-L2360DW', 'MFC-L2700DW'],
            providerId: provider.id,
            weightKg: 0.6,
        },
    });

    const drumDR630 = await prisma.product.upsert({
        where: { sku: 'DR630-COMP' },
        update: {},
        create: {
            sku: 'DR630-COMP',
            name: 'Tambor Brother DR630 Compatible',
            brand: 'Brother',
            category: 'Drum',
            color: 'N/A',
            yield: 12000,
            compatibility: ['DCP-L2540DW', 'HL-L2360DW', 'MFC-L2700DW'],
            providerId: provider.id,
            weightKg: 0.8,
        },
    });

    await prisma.productBundle.create({
        data: {
            name: 'Duo Pack Brother L2540 (TN660 + DR630)',
            description: 'Combo de ahorro total para oficina. Tóner + Unidad de Imagen.',
            tonerId: tonerTN660.id,
            drumId: drumDR630.id,
            price: 549,
        }
    });

    // --- BROTHER TN760 SERIES ---
    const tonerTN760 = await prisma.product.upsert({
        where: { sku: 'TN760-COMP' },
        update: {},
        create: {
            sku: 'TN760-COMP',
            name: 'Tóner Brother TN760 Compatible con Chip',
            brand: 'Brother',
            category: 'Toner',
            color: 'Black',
            yield: 3000,
            compatibility: ['HL-L2350DW', 'HL-L2370DW', 'HL-L2390DW', 'MFC-L2710DW'],
            providerId: provider.id,
            weightKg: 0.6,
        },
    });

    const drumDR730 = await prisma.product.upsert({
        where: { sku: 'DR730-COMP' },
        update: {},
        create: {
            sku: 'DR730-COMP',
            name: 'Tambor Brother DR730 Compatible',
            brand: 'Brother',
            category: 'Drum',
            color: 'N/A',
            yield: 12000,
            compatibility: ['HL-L2350DW', 'HL-L2370DW', 'MFC-L2710DW'],
            providerId: provider.id,
            weightKg: 0.8,
        },
    });

    await prisma.productBundle.create({
        data: {
            name: 'Duo Pack Brother L2350 (TN760 + DR730)',
            description: 'El match perfecto para la serie L2300. Máximo rendimiento.',
            tonerId: tonerTN760.id,
            drumId: drumDR730.id,
            price: 689,
        }
    });

    // --- CANON G SERIES (Inks) ---
    await prisma.product.upsert({
        where: { sku: 'GI-190-BK' },
        update: {},
        create: {
            sku: 'GI-190-BK',
            name: 'Botella de Tinta Canon GI-190 Black Compatible',
            brand: 'Canon',
            category: 'Ink',
            color: 'Black',
            yield: 6000,
            compatibility: ['Pixma G2100', 'G3100', 'G3110', 'G4100'],
            providerId: provider.id,
            weightKg: 0.15,
        },
    });

    // --- SAMSUNG MLT ---
    await prisma.product.upsert({
        where: { sku: 'MLT-D111S-COMP' },
        update: {},
        create: {
            sku: 'MLT-D111S-COMP',
            name: 'Tóner Samsung MLT-D111S Compatible',
            brand: 'Samsung',
            category: 'Toner',
            color: 'Black',
            yield: 1000,
            compatibility: ['Xpress M2020', 'M2020W', 'M2070', 'M2070W'],
            providerId: provider.id,
            weightKg: 0.7,
        },
    });

    // --- KYOCERA TK ---
    await prisma.product.upsert({
        where: { sku: 'TK-1170-COMP' },
        update: {},
        create: {
            sku: 'TK-1170-COMP',
            name: 'Tóner Kyocera TK-1170 Compatible',
            brand: 'Kyocera',
            category: 'Toner',
            color: 'Black',
            yield: 7200,
            compatibility: ['M2040dn', 'M2640idw'],
            providerId: provider.id,
            weightKg: 0.5,
        },
    });

    // --- NICHO 1: RESTAURANTES (Tickets / Térmico) ---
    await prisma.product.upsert({
        where: { sku: 'ROLL-80MM-X50' },
        update: {},
        create: {
            sku: 'ROLL-80MM-X50',
            name: 'Caja 50 Rollos Papel Térmico 80mm Premium',
            brand: 'Generic-POS',
            category: 'Paper',
            color: 'White',
            yield: 50, // 50 rollos
            compatibility: ['Epson TM-T88', 'Star Micronics', 'Bixolon'],
            providerId: provider.id,
            weightKg: 12.0,
        },
    });

    // --- NICHO 2: ESCUELAS (Alto Volumen) ---
    const tonerHP58A = await prisma.product.upsert({
        where: { sku: 'CF258A-COMP' },
        update: {},
        create: {
            sku: 'CF258A-COMP',
            name: 'Tóner HP 58A (CF258A) Compatible sin Chip',
            brand: 'HP',
            category: 'Toner',
            color: 'Black',
            yield: 3000,
            compatibility: ['LaserJet Pro M404n', 'M404dw', 'M428fdw'],
            providerId: provider.id,
            weightKg: 0.8,
        },
    });

    await prisma.product.upsert({
        where: { sku: 'TN920XL-COMP' },
        update: {},
        create: {
            sku: 'TN920XL-COMP',
            name: 'Tóner Brother TN920XL Compatible Ultra Capacidad',
            brand: 'Brother',
            category: 'Toner',
            color: 'Black',
            yield: 11000,
            compatibility: ['MFC-L5915DW', 'HL-L5210DW', 'HL-L6415DW'],
            providerId: provider.id,
            weightKg: 1.2,
        },
    });

    // --- NICHO 3: SALUD / LABORATORIOS (Etiquetas) ---
    await prisma.product.upsert({
        where: { sku: 'LABEL-4X6-ROLL' },
        update: {},
        create: {
            sku: 'LABEL-4X6-ROLL',
            name: 'Rollo Etiquetas Térmicas 4x6 (500 etiquetas)',
            brand: 'Zebra-Ready',
            category: 'Label',
            color: 'White',
            yield: 500,
            compatibility: ['Zebra ZT411', 'ZT230', 'GK420d'],
            providerId: provider.id,
            weightKg: 1.5,
        },
    });

    // 3. Simulated "Oportunidades Perdidas" LOGS
    await prisma.searchLog.createMany({
        data: [
            { query: 'Ricoh MP 301 toner', resultsCount: 0, isPotentialProduct: true, metadata: { brand: 'RICOH', type: 'toner' } },
            { query: 'Canon Serie G Maintenance Box', resultsCount: 0, isPotentialProduct: true, metadata: { brand: 'CANON', type: 'accessory' } },
            { query: 'Samsung MLT-D116L', resultsCount: 0, isPotentialProduct: true, metadata: { brand: 'SAMSUNG', type: 'toner' } },
        ]
    });

    console.log('✅ Seeding completed! Real matches and market logs are ready.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

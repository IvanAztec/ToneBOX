import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Actualizando precios base con margen de plataforma (+4%)...');

    // Brother L2540 Duo Pack
    await prisma.productBundle.updateMany({
        where: { name: { contains: 'L2540' } },
        data: { price: 571.0 } // 549 * 1.04
    });

    // Brother L2350 Duo Pack
    await prisma.productBundle.updateMany({
        where: { name: { contains: 'L2350' } },
        data: { price: 716.5 } // 689 * 1.04
    });

    console.log('✅ Precios de lista actualizados.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

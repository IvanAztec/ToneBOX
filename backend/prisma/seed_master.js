import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
const prisma = new PrismaClient();

async function main() {
    console.log('🏗️ Configurando Orquestador Maestro Multi-SaaS...');

    // 1. Crear el Proyecto Maestro: ToneBOX
    const tonebox = await prisma.saasProject.upsert({
        where: { id: 'tonebox-official' },
        update: {},
        create: {
            id: 'tonebox-official',
            name: 'ToneBOX',
            description: 'Inteligencia en Consumibles y Suscripciones',
            brandColor: '#10b981', // Emerald 500
        }
    });

    // 2. Vincular todos los Workspaces existentes a ToneBOX
    await prisma.workspace.updateMany({
        where: { projectId: null },
        data: { projectId: tonebox.id }
    });

    // 3. Configurar Marketing (IDs de seguimiento)
    await prisma.marketingConfig.upsert({
        where: { projectId: tonebox.id },
        update: {},
        create: {
            projectId: tonebox.id,
            googleAdsId: 'AW-123456789',
            fbPixelId: 'FB-987654321',
            tagManagerId: 'GTM-T0NEB0X'
        }
    });

    console.log('✅ Orquestador Maestro listo. ToneBOX vinculado con éxito.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

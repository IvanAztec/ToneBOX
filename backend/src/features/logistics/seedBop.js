import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Upsert BOP provider
  const bop = await prisma.provider.upsert({
    where: { code: 'BOP' },
    update: {
      name: 'BOP',
      dispatchType: 'DIRECT',
      defaultWeightLimitKg: 5,
      defaultShippingCost: 174,
      active: true,
    },
    create: {
      name: 'BOP',
      code: 'BOP',
      dispatchType: 'DIRECT',
      defaultWeightLimitKg: 5,
      defaultShippingCost: 174,
      active: true,
    },
  });

  // Remove existing rules for BOP to avoid duplicates
  await prisma.providerShippingRule.deleteMany({
    where: {
      providerId: bop.id,
    },
  });

  // Create default rule: $174 MXN up to 5kg, direct dispatch
  await prisma.providerShippingRule.create({
    data: {
      providerId: bop.id,
      minWeightKg: 0,
      maxWeightKg: 5,
      shippingCost: 174,
      dispatchTypeOverride: 'DIRECT',
      isDefault: true,
    },
  });

  console.log('✅ Seed BOP provider and shipping rule completed');
}

main()
  .catch((error) => {
    console.error('❌ Seed BOP failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


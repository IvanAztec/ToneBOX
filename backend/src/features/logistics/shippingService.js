import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate shipping cost for a provider given the total weight (kg).
 * If no rule matches (e.g. weight > configured ranges), throws an error
 * indicating that manual quotation is required.
 *
 * @param {string} providerId
 * @param {number} totalWeightKg
 * @returns {Promise<{ providerId: string; totalWeightKg: number; shippingCost: number; dispatchType: string; ruleId: string }>}
 */
export async function getShippingCost(providerId, totalWeightKg) {
  if (!providerId) {
    throw new Error('providerId is required');
  }

  if (typeof totalWeightKg !== 'number' || Number.isNaN(totalWeightKg) || totalWeightKg <= 0) {
    throw new Error('totalWeightKg must be a positive number');
  }

  const rules = await prisma.providerShippingRule.findMany({
    where: {
      providerId,
      minWeightKg: {
        lte: totalWeightKg,
      },
      OR: [
        {
          maxWeightKg: null,
        },
        {
          maxWeightKg: {
            gte: totalWeightKg,
          },
        },
      ],
    },
    orderBy: [
      { minWeightKg: 'asc' },
      { maxWeightKg: 'asc' },
    ],
    take: 1,
    include: {
      provider: true,
    },
  });

  const rule = rules[0];

  if (!rule) {
    throw new Error('Cotización Manual');
  }

  const dispatchType = rule.dispatchTypeOverride ?? rule.provider.dispatchType;

  return {
    providerId,
    totalWeightKg,
    shippingCost: rule.shippingCost,
    dispatchType,
    ruleId: rule.id,
  };
}


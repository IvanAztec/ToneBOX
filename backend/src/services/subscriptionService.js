import { PrismaClient } from '@prisma/client';
import { addDays, differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Service to manage consumable replenishment subscriptions.
 * Calculations are based on yield and estimated consumption rate.
 */
export const subscriptionService = {
    /**
     * Calculates the next reminder date based on yield and consumption rate.
     * Formula: (Yield / ConsumptionRate) - 7 days buffer.
     */
    calculateNextReminder(yieldAmount, consumptionRate, fromDate = new Date()) {
        if (!consumptionRate || consumptionRate <= 0) return addDays(fromDate, 30); // Default fallback

        const daysToDepletion = Math.floor(yieldAmount / consumptionRate);
        const reminderDays = Math.max(0, daysToDepletion - 7); // 7 days before it runs out

        return addDays(fromDate, reminderDays);
    },

    /**
     * Creates a new replenishment subscription for a user.
     */
    async createSubscription({ userId, productId, yieldAmount, consumptionRate, printerModel }) {
        const nextReminderDate = this.calculateNextReminder(yieldAmount, consumptionRate);

        return await prisma.replenishmentSubscription.create({
            data: {
                userId,
                productId,
                yield: yieldAmount,
                consumptionRate,
                printerModel,
                nextReminderDate,
            }
        });
    },

    /**
     * Gets all subscriptions that need a reminder in the next X days.
     */
    async getUpcomingRenewals(daysWindow = 7) {
        const today = new Date();
        const windowEnd = addDays(today, daysWindow);

        return await prisma.replenishmentSubscription.findMany({
            where: {
                status: 'active',
                nextReminderDate: {
                    gte: today,
                    lte: windowEnd
                }
            },
            include: {
                // We'll need to link User and Product but they are not linked in the Prisma schema yet
                // For now, returning raw data to be handled by the controller
            },
            orderBy: {
                nextReminderDate: 'asc'
            }
        });
    }
};

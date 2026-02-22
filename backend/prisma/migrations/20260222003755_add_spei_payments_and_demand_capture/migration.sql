-- AlterTable
ALTER TABLE "product_bundles" ADD COLUMN     "availabilityStatus" TEXT NOT NULL DEFAULT 'IN_STOCK';

-- CreateTable
CREATE TABLE "spei_payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "productName" TEXT,
    "trackingKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VALIDATION',
    "clientContact" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spei_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_capture_leads" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "name" TEXT,
    "contact" TEXT NOT NULL,
    "contactType" TEXT NOT NULL DEFAULT 'whatsapp',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_capture_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spei_payments_status_idx" ON "spei_payments"("status");

-- CreateIndex
CREATE INDEX "spei_payments_orderId_idx" ON "spei_payments"("orderId");

-- CreateIndex
CREATE INDEX "demand_capture_leads_query_idx" ON "demand_capture_leads"("query");

-- CreateIndex
CREATE INDEX "demand_capture_leads_status_idx" ON "demand_capture_leads"("status");

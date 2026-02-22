-- CreateTable
CREATE TABLE "catalog_alerts" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 1,
    "detectedBrand" TEXT,
    "detectedType" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_drafts" (
    "id" TEXT NOT NULL,
    "suggestedSku" TEXT NOT NULL,
    "suggestedName" TEXT NOT NULL,
    "brand" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "sourceAlertId" TEXT,
    "demandScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "catalog_alerts_query_key" ON "catalog_alerts"("query");

-- CreateIndex
CREATE INDEX "catalog_alerts_status_priority_idx" ON "catalog_alerts"("status", "priority");

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "saas_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brandColor" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "metadata" JSONB,
    "projectId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_configs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "googleAdsId" TEXT,
    "fbPixelId" TEXT,
    "tagManagerId" TEXT,
    "tiktokPixelId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_projectId_type_idx" ON "analytics_events"("projectId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_configs_projectId_key" ON "marketing_configs"("projectId");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "saas_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "saas_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_configs" ADD CONSTRAINT "marketing_configs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "saas_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

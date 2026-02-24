-- TriPack Structure Migration
-- Adds comboType, toner2Id, hardwareId to product_bundles
-- Enables: DUO_PACK (toner+drum), TRIPACK (2 toners+drum), BUSINESS_START (hardware+2 toners+drum)

ALTER TABLE "product_bundles" ADD COLUMN IF NOT EXISTS "comboType"  TEXT NOT NULL DEFAULT 'DUO_PACK';
ALTER TABLE "product_bundles" ADD COLUMN IF NOT EXISTS "toner2Id"   TEXT;
ALTER TABLE "product_bundles" ADD COLUMN IF NOT EXISTS "hardwareId" TEXT;

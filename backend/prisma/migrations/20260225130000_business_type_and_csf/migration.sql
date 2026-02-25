-- Migration: businessType on users + csfUrl on catalog_orders
-- 2026-02-25

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "businessType" TEXT NOT NULL DEFAULT 'POR_CLASIFICAR';

ALTER TABLE "catalog_orders"
  ADD COLUMN IF NOT EXISTS "csfUrl" TEXT;

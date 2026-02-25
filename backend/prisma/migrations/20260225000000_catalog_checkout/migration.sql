-- Migration: 20260225000000_catalog_checkout
-- Add shipping + billing fields to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shippingStreet" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shippingColonia" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shippingCity" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shippingState" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shippingZip" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "requiresInvoice" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rfc" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "razonSocial" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "regimenFiscal" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "usoCFDI" TEXT;

-- Create catalog_orders table
CREATE TABLE IF NOT EXISTS "catalog_orders" (
  "id"             TEXT             NOT NULL,
  "folio"          TEXT             NOT NULL,
  "userId"         TEXT,
  "clientName"     TEXT,
  "clientEmail"    TEXT,
  "clientPhone"    TEXT,
  "items"          JSONB            NOT NULL DEFAULT '[]',
  "subtotal"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "speiTotal"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "shippingStreet" TEXT,
  "shippingColonia"TEXT,
  "shippingCity"   TEXT,
  "shippingState"  TEXT,
  "shippingZip"    TEXT,
  "requiresInvoice"BOOLEAN          NOT NULL DEFAULT false,
  "rfc"            TEXT,
  "razonSocial"    TEXT,
  "regimenFiscal"  TEXT,
  "usoCFDI"        TEXT,
  "status"         TEXT             NOT NULL DEFAULT 'PENDING_PAYMENT_VALIDATION',
  "createdAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "catalog_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "catalog_orders_folio_key" ON "catalog_orders"("folio");
CREATE INDEX IF NOT EXISTS "catalog_orders_status_idx" ON "catalog_orders"("status");

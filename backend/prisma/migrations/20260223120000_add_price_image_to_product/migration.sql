-- AlterTable: añade precio MXN e imagen al catálogo de productos CT
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "priceMXN" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image" TEXT;

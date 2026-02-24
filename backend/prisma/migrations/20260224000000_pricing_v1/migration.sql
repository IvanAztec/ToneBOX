-- ============================================================
-- [v3.0] Pricing Intelligence — ToneBOX
-- Separa costPrice (privado) de publicPrice y speiPrice (calculados)
-- ============================================================

-- 1. Renombrar priceMXN → costPrice en la tabla de productos
ALTER TABLE "products" RENAME COLUMN "priceMXN" TO "costPrice";

-- 2. Agregar columnas de precios calculados
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "publicPrice" DOUBLE PRECISION;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "speiPrice"   DOUBLE PRECISION;

-- 3. Calcular precios públicos desde el costPrice existente
--    Márgenes: COMPATIBLE×2.0, HARDWARE×1.20, ORIGINAL/default×1.35  ×  1.04 (fee operativo)
UPDATE "products"
SET
  "publicPrice" = CASE
    WHEN "productType" = 'COMPATIBLE' THEN ROUND(CAST("costPrice" * 2.0  * 1.04 AS NUMERIC), 2)
    WHEN "productType" = 'HARDWARE'   THEN ROUND(CAST("costPrice" * 1.20 * 1.04 AS NUMERIC), 2)
    ELSE                                   ROUND(CAST("costPrice" * 1.35 * 1.04 AS NUMERIC), 2)
  END,
  "speiPrice" = CASE
    WHEN "productType" = 'COMPATIBLE' THEN ROUND(CAST("costPrice" * 2.0  AS NUMERIC), 2)
    WHEN "productType" = 'HARDWARE'   THEN ROUND(CAST("costPrice" * 1.20 AS NUMERIC), 2)
    ELSE                                   ROUND(CAST("costPrice" * 1.35 AS NUMERIC), 2)
  END
WHERE "costPrice" IS NOT NULL AND "costPrice" > 0;

-- 4. Agregar campos a product_bundles
ALTER TABLE "product_bundles" ADD COLUMN IF NOT EXISTS "speiPrice"    DOUBLE PRECISION;
ALTER TABLE "product_bundles" ADD COLUMN IF NOT EXISTS "freeShipping" BOOLEAN NOT NULL DEFAULT false;

-- 5. Computar speiPrice de bundles existentes (precio / 1.04 = precio sin comisión)
UPDATE "product_bundles"
SET "speiPrice" = ROUND(CAST("price" / 1.04 AS NUMERIC), 2)
WHERE "price" IS NOT NULL AND "price" > 0;

-- 6. Marcar todos los Duo Packs existentes con envío gratis
--    (combo tóner + tambor = 2 consumibles = envío gratis)
UPDATE "product_bundles" SET "freeShipping" = true WHERE "price" IS NOT NULL;

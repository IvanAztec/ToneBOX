-- =====================================================================
-- BLINDAJE v2.1: Tablas faltantes + ON_DEMAND + Folios TB-1000
-- =====================================================================

-- [1] Columna customerNumber en users (autoincrement único por cliente)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "customerNumber" SERIAL;

CREATE UNIQUE INDEX IF NOT EXISTS "users_customerNumber_key"
  ON "users"("customerNumber");

-- [2] Tabla orders con secuencia desde 1000 (folios TB-1000, TB-1001...)
CREATE SEQUENCE IF NOT EXISTS "orders_orderNumber_seq" START 1000;

CREATE TABLE IF NOT EXISTS "orders" (
  "id"            TEXT              NOT NULL,
  "orderNumber"   INTEGER           NOT NULL DEFAULT nextval('"orders_orderNumber_seq"'),
  "folio"         TEXT              NOT NULL,
  "userId"        TEXT,
  "productName"   TEXT              NOT NULL,
  "amount"        DOUBLE PRECISION  NOT NULL,
  "currency"      TEXT              NOT NULL DEFAULT 'MXN',
  "status"        TEXT              NOT NULL DEFAULT 'PENDING',
  "paymentMethod" TEXT              NOT NULL DEFAULT 'PENDING',
  "clientName"    TEXT,
  "clientContact" TEXT,
  "createdAt"     TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_key" ON "orders"("orderNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_folio_key"       ON "orders"("folio");
CREATE INDEX        IF NOT EXISTS "orders_status_idx"      ON "orders"("status");
CREATE INDEX        IF NOT EXISTS "orders_folio_idx"       ON "orders"("folio");

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- [3] Tabla processed_stripe_events (idempotencia de webhooks Stripe)
CREATE TABLE IF NOT EXISTS "processed_stripe_events" (
  "id"          TEXT         NOT NULL,
  "type"        TEXT         NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "processed_stripe_events_pkey" PRIMARY KEY ("id")
);

-- [4] Columna availabilityStatus en products (IN_STOCK | ON_DEMAND | OUT_OF_STOCK)
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "availabilityStatus" TEXT NOT NULL DEFAULT 'IN_STOCK';

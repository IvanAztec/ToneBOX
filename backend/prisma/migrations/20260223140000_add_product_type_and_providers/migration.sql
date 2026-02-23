-- Añade productType a productos: ORIGINAL | COMPATIBLE | HARDWARE
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "productType" TEXT NOT NULL DEFAULT 'ORIGINAL';

-- Seed proveedores estratégicos (upsert por code)
INSERT INTO "providers" ("id","name","code","dispatchType","defaultWeightLimitKg","defaultShippingCost","active","createdAt","updatedAt")
VALUES
  ('prov_bop0000000000000000000','BOP Internacional','BOP','DIRECT',0,0,true,NOW(),NOW()),
  ('prov_cadtoner00000000000000','CADTONER México','CADTONER','DIRECT',0,0,true,NOW(),NOW()),
  ('prov_unicom0000000000000000','UNICOM Monterrey','UNICOM','DIRECT',0,0,true,NOW(),NOW())
ON CONFLICT ("code") DO UPDATE SET "active" = true, "updatedAt" = NOW();

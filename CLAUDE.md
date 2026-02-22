# ToneBOX - SaaS Factory OS v3

## Golden Path
- Framework: Next.js 14 (App Router)
- Backend: Express.js (Railway: tonebox-production.up.railway.app)
- Auth/Database: Supabase (PostgreSQL)
- Styling: Tailwind CSS
- Proxy: Fixie (Static IPs for CT Internacional)

## Estructura de Archivos (Feature-First)
- /frontend/features/[feature-name]/
- /frontend/components/shared/
- /frontend/lib/supabase/
- /backend/src/features/

## Reglas de Oro
1. No inventar ruedas: Usar el Golden Path.
2. Archivos < 500 líneas.
3. Typescript estricto (No 'any').
4. Antes de codear una feature compleja, crear un PRP.
5. Colocalización de features en /frontend/features.

---

## Blindaje Implementado

### [v2.1] Folios de Orden — Secuencia desde #1000
- **Folio format:** `TB-[orderNumber]` (ej. TB-1000, TB-1024)
- **Servicio:** `backend/src/services/orderService.js` — `generateFolio(orderNumber)`
- **Flujo:** BD asigna `orderNumber` via autoincrement → `createOrder()` genera folio real en 2 pasos (TB-TEMP → TB-XXXX)
- **Migración:** `20260222010000_folio_sequence_and_product_on_demand/migration.sql`
  - Ejecuta `setval(pg_get_serial_sequence('"orders"', '"orderNumber"'), 999, true)` condicionado a que no existan órdenes previas
  - Primer folio generado: **TB-1000**
- **ERROR ENCONTRADO:** El `orderService.js` tenía el comentario "ver migration SQL" pero ninguna migración previa establecía el `setval`. La migración `20260222010000` corrige esto.

### [v2.1] Estado ON_DEMAND para Productos
- **Campo añadido:** `availabilityStatus String @default("IN_STOCK")` en modelo `Product` (schema.prisma)
- **Valores válidos:** `IN_STOCK` | `ON_DEMAND` | `OUT_OF_STOCK`
- **Migración:** `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "availabilityStatus" TEXT NOT NULL DEFAULT 'IN_STOCK'`
- **Frontend:** `PaymentGateway.tsx` acepta prop `availabilityStatus?: 'IN_STOCK' | 'ON_DEMAND' | 'OUT_OF_STOCK'`
  - Si `ON_DEMAND`: muestra banner amarillo informando que el producto es por encargo y NO bloquea el checkout
  - `ProductBundle` ya tenía el campo `availabilityStatus` desde migración anterior

### [v2.1] Flujo SPEI — Leyenda Obligatoria
- **Leyenda exacta implementada:**
  > "Para procesar tu pedido, es obligatorio incluir el número de folio de tu orden en el concepto de tu transferencia."
- **Ubicaciones en `PaymentGateway.tsx`:**
  1. **Step 1 (info):** Banner amarillo antes del botón "Ya Transferí — Subir Comprobante"
  2. **Step 2 (upload):** Dentro del bloque de folio `TB-####`, refuerza la obligación antes de que el usuario confirme
- **CLABE:** 012180004567890123 (BBVA Bancomer — ToneBOX México S.A. de C.V.)
- **Descuento VIP SPEI:** 4% sobre precio de lista

### [v2.0] SPEI Service
- Archivo: `backend/src/services/speiService.js`
- Crea `SpeiPayment` con status `PENDING_VALIDATION` → `APPROVED` (admin)
- Email a admin con asunto: `[TB-XXXX] - Nueva Orden de [Cliente]`
- Webhook Stripe con idempotencia (`ProcessedStripeEvent` table)

### [v2.0] Auto-Blindaje Catálogo
- `CatalogAlert` → `ProductDraft` → `Product` pipeline
- Threshold: 3 búsquedas fallidas → alerta automática
- Servicio: `backend/src/services/catalogIntelligence.js`

---

## Errores Documentados Durante Blindaje v2.1
1. **Secuencia #1000 sin migration:** `orderService.js` referenciaba "ver migration SQL" que no existía. Corregido con migración `20260222010000`.
2. **ON_DEMAND solo en ProductBundle:** El modelo `Product` no tenía `availabilityStatus`. Corregido en schema + migración.
3. **Leyenda SPEI incompleta:** El Step 2 decía "Usa este folio como concepto" de forma informal. Corregido con el texto oficial obligatorio en ambos steps.

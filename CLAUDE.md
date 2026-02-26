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

## Blindaje Chasis v3.0 — Sistema de Auditoría + UX Checkout

### [v3.0] Validación Automática SPEI — Banxico CEP
- **Servicio:** `backend/src/services/speiValidator.js`
  - `queryCEP({ claveRastreo, fechaOperacion, monto, emisor, receptor, cuenta })` → Banxico CEP API
  - `validateSpeiPayment({ claveRastreo, fechaOperacion, montoEsperado, clabeEsperada })` → `{ valid, cep, error }`
  - Tolerancia de ±1 peso para redondeos
  - Campos extraídos: `bancoEmisor`, `rfcOrdenante`, `horaCertificacion`, `estado`
- **Endpoint admin:** `POST /api/payments/spei/validate-cep` (auth admin)
  - Requiere: `claveRastreo`, `fechaOperacion`, `monto`
  - Si válido: marca orden como PAID automáticamente, crea/actualiza `PaymentLog`

### [v3.0] Tabla PaymentLog — Auditoría de Ingresos
- **Migración:** `20260226000000_payment_logs`
- **Campos clave:** `method`, `amount`, `status`, `claveRastreo`, `cepData (JSON)`, `cepBancoEmisor`, `cepRfcOrdenante`, `cepHoraCert`, `cepEstado`, `validatedBy`, `validatedAt`
- **Creación automática:** `/spei/confirm` (PENDING), `/spei/validate-cep` (update), Stripe webhook (COMPLETED)
- **Aprobación manual:** `POST /api/payments/spei/:id/approve` → validatedBy = "ADMIN_MANUAL"

### [v3.0] Módulo de Auditoría — Registro de Ingresos
- **Página admin:** `/admin/ingresos` — `frontend/app/admin/ingresos/page.tsx`
- **Endpoint:** `GET /api/admin/ingresos` → CatalogOrders + PaymentLogs + stats por status
- **Endpoint recibo:** `GET /api/admin/ingresos/:id/receipt` → JSON con CEP data + fiscales + emisor ToneBOX
- **Botón "Ver Comprobante"** → modal con: Banco Emisor, RFC Ordenante, Hora Certificación, Clave Rastreo, Estado CEP
- **"Descargar Recibo Interno"** → descarga JSON directamente en browser
- **Sidebar:** "Registro de Ingresos" añadido a `DashboardLayout.tsx` (adminOnly, icono ReceiptText)

### [v3.0] Pre-Folio SPEI — Folio Real al Seleccionar Método
- **Endpoint:** `POST /api/payments/pre-folio` → crea orden `PRE_RESERVED`, devuelve folio TB-XXXX
- **Flujo:** Al seleccionar SPEI en `PaymentGateway.tsx`, llama `/pre-folio` inmediatamente
- **UX:** Folio visible con loading spinner antes de que usuario confirme transferencia

### [v3.0] QuickRegisterModal — Registro Obligatorio en Checkout
- **Ubicación:** `CheckoutDrawer.tsx` — Modal aparece cuando usuario no está logueado y avanza del carrito a datos
- **Campos mínimos:** Nombre (≥2 chars) + WhatsApp (≥8 chars)
- **Skip disponible:** "Continuar sin registrar" — avanza sin bloquear
- **Pre-fill:** Datos capturados se inyectan en el Form antes de avanzar al DataStep

### [v3.0] UI Fixes — Legibilidad + UX
- **Inputs checkout:** `text-slate-900 bg-white placeholder:text-gray-400` en `Field` component y `PaymentGateway.tsx`
- **Selección método pago:** `border-emerald-500` (2px) + ícono `Check` relleno verde al seleccionar SPEI/Tarjeta
- **CombosSection:** Nombres únicos en STATIC_COMBOS — "TriPack L2540 — Ahorro Total" y "TriPack L2350 — Ahorro Total"
- **Datos bancarios:** Removido `BANK_INFO` hardcodeado en `PaymentGateway.tsx` → fetch dinámico desde `/api/company-settings`

### [v3.0] Sistema de Alertas de Reposición
- **Job:** `backend/src/jobs/replenishmentAlertJob.js` — cron diario 9am CDMX
- **Niveles:** MEDIUM (30-44d), HIGH (45-59d), CRITICAL (60+d) desde última compra
- **Telegram digest:** Resumen diario → bot @ToneBoxBot
- **Endpoint:** `GET /api/admin/clients/alerts`
- **CRM page:** Panel colapsable con tabs por nivel + botones WA "Reactivar"

---

## Errores Documentados Durante Blindaje v2.1
1. **Secuencia #1000 sin migration:** `orderService.js` referenciaba "ver migration SQL" que no existía. Corregido con migración `20260222010000`.
2. **ON_DEMAND solo en ProductBundle:** El modelo `Product` no tenía `availabilityStatus`. Corregido en schema + migración.
3. **Leyenda SPEI incompleta:** El Step 2 decía "Usa este folio como concepto" de forma informal. Corregido con el texto oficial obligatorio en ambos steps.

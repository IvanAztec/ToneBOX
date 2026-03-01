# ToneBOX System Logs & Configuration

## 📧 Zoho SMTP Configuration
The system uses Zoho Mail for automated logistics and notifications.

- **Host**: `smtp.zoho.com`
- **Port**: `465` (SSL) / `587` (TLS)
- **User**: `ivan@tonebox.mx`
- **Password**: `Q3N!fAxqB2bnJ3Y`
- **From Name**: `ToneBOX Logistics System`

---

## 🏗️ Supabase Database Schema (Prisma)

### Core Models

#### `User`
- Central identity for customers and admins.
- Includes profile data (RFC, city, state) and shipping/billing info.
- Roles: `user`, `admin`.

#### `Order`
- Tracks payments for bundles/combos via PaymentGateway.
- Folio format: `TB-####`.

#### `CatalogOrder`
- Tracks multi-item purchases from the public catalog.
- Statuses: `PENDING_PAYMENT_VALIDATION`, `COMPLETED`, etc.

#### `Provider`
- Logistics vendors (CT, etc.).
- Includes Dropshipping info: `emailPedidos`, `instruccionesDropshipping`, `ejecutivo`.

#### `Product` & `ProductBundle`
- Inventory items and specific combinations (Duo Pack, Business Start).
- Linked to `Provider`.

#### `SpeiPayment`
- Records manual transfers for validation.
- Fields: `trackingKey`, `status` (`PENDING_VALIDATION`, `APPROVED`).

#### `PaymentLog`
- Audit trail for all financial transactions (Stripe/SPEI).
- Stores Banxico CEP data for automated verification.

#### `DemandCaptureLead`
- Stores contact info from the modal when a product is `OUT_OF_STOCK` or `ON_DEMAND`.

---

## 🛡️ Blindaje v3.0 — Fiscal & Logístico (SAT 4.0)

### ☁️ Cloud Storage (Supabase)
El sistema utiliza un bucket privado llamado `documents` para almacenar archivos sensibles.
- **StorageService**: (`backend/src/services/storageService.js`)
- **Seguridad**: Se utilizan **Signed URLs** (URLs Firmadas) con una vigencia de 7 días. Esto asegura que los archivos (como la CSF) no sean públicos, pero que Iván y los proveedores puedan verlos desde el correo.
- **Flujo**: `Frontend -> Backend (Buffer) -> Supabase Storage -> Signed URL -> Email`.

### 🏦 Validación SPEI — Banxico CEP
Proceso automatizado para eliminar el error humano en conciliaciones bancarias.
1. **Captura**: El cliente ingresa su clave de rastreo en el checkout (opcional) o sube su comprobante.
2. **Auditoría (Admin)**: Iván abre el `CepModal` en el Panel de Ingresos e ingresa/confirma la Clave de Rastreo.
3. **Validación**: El sistema consulta el API del Banco de México.
4. **Activación**: Si el estatus es `LIQUIDADO`, el sistema marca la orden como `PAID_SPEI` y dispara el gatillo de dropshipping.

### 📦 Logística Proactiva (Dropshipping)
- **Gatillo**: Se dispara en `orderService.js` inmediatamente tras detectar el pago.
- **Correo Blindado**: El correo a proveedores (`testPiloto`) usa un template HTML con jerarquía visual crítica para resaltar instrucciones de "Remitente Ciego".
- **Instrucciones**: Queda estrictamente prohibido incluir publicidad o facturas del proveedor.

---

## 🛠️ Infrastructure
- **Frontend**: Next.js (App Router) en Vercel.
- **Backend**: Express.js en Railway.
- **Database**: PostgreSQL en Supabase.
- **Storage**: Supabase Storage (Bucket: `documents`).

# ToneBOX — Operations Manual
> Última actualización: 2026-02-23

## Stack de Producción

| Capa | Servicio | URL |
|------|----------|-----|
| Frontend | Vercel | https://tonebox.mx |
| Backend | Railway | https://tonebox-production.up.railway.app |
| Base de datos | Supabase | https://xlfbdxyzlfzjqykznnob.supabase.co |
| Repositorio | GitHub | https://github.com/IvanAztec/ToneBOX |

---

## 1. Desplegar Cambios

### Frontend (Vercel)
El deploy es **automático**. Cada push a `master` en GitHub dispara un redeploy en Vercel.

```bash
git add .
git commit -m "feat: descripción del cambio"
git push origin master
```

Verifica el deploy en: https://vercel.com/dashboard → proyecto `ToneBOX`

### Backend (Railway)
El deploy también es **automático** al hacer push a `master`.

Railway ejecuta:
1. `npm run build` → `prisma generate`
2. `node src/index.js`

Verifica el deploy en: https://railway.app/dashboard → servicio `backend`

### Verificar que el deploy fue exitoso
```bash
# Health check del backend
curl https://tonebox-production.up.railway.app/health

# Respuesta esperada:
# {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

---

## 2. Variables de Entorno

### Railway (Backend)
Acceso: Railway → tu servicio → pestaña **Variables**

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Supabase pooler (puerto 6543, PgBouncer) |
| `DIRECT_URL` | Supabase directo (puerto 5432) |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Secreto para tokens JWT |
| `CORS_ORIGIN` | `https://tonebox.mx` |
| `ADMIN_EMAIL` | Gmail desde donde se envían alertas SPEI |
| `ADMIN_EMAIL_PASSWORD` | Contraseña de aplicación Gmail (16 chars) |
| `ADMIN_PERSONAL_EMAIL` | Correo donde llegan las alertas |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` del dashboard de Stripe |
| `STRIPE_SECRET_KEY` | `sk_live_...` del dashboard de Stripe |

> **Importante:** Al cambiar la contraseña de Supabase, actualizar `DATABASE_URL` y `DIRECT_URL`
> en Railway Y en los archivos `.env` locales (`backend/.env` y `.env` en la raíz).
> Railway redeploya automáticamente al guardar las variables.

### Vercel (Frontend)
Acceso: Vercel → proyecto → **Settings → Environment Variables**

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `/api` |
| `NEXT_PUBLIC_APP_URL` | `https://tonebox.mx` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xlfbdxyzlfzjqykznnob.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon de Supabase |

> Después de cambiar variables en Vercel, hacer **Redeploy manual** desde el dashboard.

---

## 3. Logs y Diagnóstico

### Logs del Backend (Railway)
1. Ir a https://railway.app/dashboard
2. Seleccionar servicio `backend`
3. Pestaña **Logs**

Errores comunes:
- `P1000` / `P1002` — Fallo de autenticación o timeout con Supabase → verificar `DATABASE_URL`
- `Cannot find module` — Dependencia faltante en `backend/package.json`
- `Healthcheck failed` — El proceso no levantó a tiempo; revisar logs de arranque

### Logs del Frontend (Vercel)
1. Ir a https://vercel.com/dashboard
2. Seleccionar el deployment más reciente
3. Pestaña **Functions** o **Runtime Logs**

### Logs de Base de Datos (Supabase)
1. Ir a https://supabase.com/dashboard/project/xlfbdxyzlfzjqykznnob
2. Menú izquierdo → **Logs** → seleccionar tipo:
   - **Postgres** — queries lentas, errores de schema, bloqueos
   - **API** — peticiones a PostgREST
   - **Auth** — intentos de login fallidos

Para ver queries en tiempo real:
- Ir a **Database → Query Performance** para detectar queries lentas
- Ir a **SQL Editor** para ejecutar diagnósticos manuales

---

## 4. Migraciones de Base de Datos

> **Problema conocido:** `prisma migrate deploy` falla con advisory lock timeout en Supabase
> porque ambas URLs apuntan a PgBouncer. La solución es aplicar el SQL manualmente.

### Procedimiento para aplicar una migración
1. Generar el SQL con: `prisma migrate diff` o escribirlo manualmente
2. Ir a Supabase → **SQL Editor**
3. Pegar el SQL y ejecutar
4. Marcar la migración como aplicada localmente si es necesario

### Verificar tablas existentes
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## 5. Endpoints Críticos Auditados

| Método | Endpoint | Estado | Descripción |
|--------|----------|--------|-------------|
| `GET` | `/health` | ✅ | Health check. Responde sin tocar la DB |
| `POST` | `/api/auth/register` | ✅ | Registro de usuario. Requiere `name`, `email`, `password` |
| `POST` | `/api/auth/login` | ✅ | Login. Devuelve JWT |
| `GET` | `/api/catalog/alerts` | ✅ | Alertas de demanda. Devuelve `[]` si la tabla no existe aún |
| `POST` | `/api/catalog/alerts/:id/promote` | ✅ | Convierte alerta en ProductDraft |
| `POST` | `/api/payments/spei/initiate` | ✅ | Inicia flujo SPEI, genera folio TB-XXXX |
| `POST` | `/api/payments/spei/confirm` | ✅ | Confirma comprobante SPEI subido |
| `POST` | `/api/payments/stripe/webhook` | ✅ | Webhook Stripe (requiere `STRIPE_WEBHOOK_SECRET`) |

### Blindajes activos
- **Folios SPEI:** Secuencia desde TB-1000 (`orders_orderNumber_seq START 1000`)
- **ON_DEMAND:** Productos con `availabilityStatus = ON_DEMAND` no bloquean el checkout
- **SPEI Legend:** Texto obligatorio en Step 1 y Step 2 del PaymentGateway
- **Catalog Alerts:** Devuelve 200 con array vacío si la tabla aún no existe (P2021 handled)
- **Stripe Idempotency:** `processed_stripe_events` previene cargos duplicados

---

## 6. Procedimiento de Emergencia

Si tonebox.mx deja de responder:

1. **Verificar DNS:** `nslookup tonebox.mx` — debe apuntar a Vercel
2. **Verificar frontend:** https://tone-box-two.vercel.app (URL directa de Vercel, sin DNS)
3. **Verificar backend:** `curl https://tonebox-production.up.railway.app/health`
4. **Verificar DB:** Supabase Dashboard → **Database → Health**
5. Si Railway está caído: ir al dashboard → forzar **Redeploy**
6. Si Supabase está caído: revisar https://status.supabase.com

---

*Generado por Claude Code — SaaS Factory OS v3*

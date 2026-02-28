# 📜 Bitácora de Configuración Técnica (ToneBOX)

Este archivo sirve como memoria técnica para el mantenimiento del sistema de Dropshipping y Automatización de Pedidos.

## 📧 Configuración de Correo (Zoho SMTP)

Para el envío de órdenes automáticas a proveedores, se utiliza el servidor SMTP de Zoho Pro.

**Variables en `.env` (Backend):**
*   `SMTP_HOST`: `smtppro.zoho.com`
*   `SMTP_PORT`: `465` (SSL)
*   `SMTP_SECURE`: `true`
*   `SMTP_USER`: `pedidos@tonebox.com.mx`
*   `SMTP_PASS`: Configurada el 2026-02-28 (Zoho App Password).

**Lógica de Envío:**
*   **Remitente:** `ToneBOX Pedidos Automáticos <pedidos@tonebox.com.mx>`
*   **Copia (CC):** Siempre a `hola@tonebox.com.mx`.
*   **Destinatario:** Dinámico basado en el campo `emailPedidos` de la tabla `providers`.

## 🗄️ Esquema de Base de Datos (Supabase / Prisma)

Se añadieron campos específicos para la gestión de Dropshipping en la tabla `providers`.

**SQL Manual ejecutado el 2026-02-28:**
```sql
ALTER TABLE providers ADD COLUMN IF NOT EXISTS ejecutivo TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS "emailPedidos" TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS "instruccionesDropshipping" TEXT;
```

**Modelo Prisma (`schema.prisma`):**
```prisma
model Provider {
  id                   String                  @id @default(cuid())
  name                 String
  ejecutivo            String?
  whatsapp             String?
  emailPedidos         String?
  instruccionesDropshipping String?
  active               Boolean                 @default(true)
  // ... otros campos logísticos
}
```

## 🛠️ Procedimiento de Recuperación (Quick Fix)

1.  **Si el correo no sale:** Verificar que la contraseña en `.env` no haya expirado o haya sido revocada en el panel de Zoho.
2.  **Si falla el guardado de proveedores:** Asegurarse de que el Prisma Client esté generado (`npx prisma generate`) y que las columnas SQL existan en la tabla física de Supabase.
3.  **Logs de Servidor:** Revisar la consola del backend para errores de Nodemailer (ej. `EAUTH` credenciales inválidas).

---
*Última Actualización: 2026-02-28 por Antigravity / ToneBOX Force.*

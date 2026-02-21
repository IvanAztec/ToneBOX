# 📦 ToneBOX Operations Manual (v2.0)

Este documento es la hoja de ruta para **Iván** en la gestión diaria del modelo de suscripción inteligente.

## 1. El Core Estratégico
ToneBOX no es una tienda; es un servicio híbrido:
*   **Asesor de Ahorro**: Identifica la mejor combinación Tóner/Tambor (Duo Pack) para maximizar el margen del cliente.
*   **Asistente Logístico**: Monitorea el consumo y previene pausas operativas mediante WhatsApp.

---

## 2. Gestión de Leads y Marketing

### A. Widget: Oportunidades Perdidas (Market Intelligence)
*   **Acción**: Revisa el endpoint `GET /api/products/lost-opportunities` o el widget en el Admin Panel.
*   **Qué buscar**: Consultas con `confidence: High`. Si 5+ personas buscan un modelo que no tienes (ej. Ricoh MP 301), es una orden directa para el Asistente de Compras.
*   **Estrategia**: Una vez añadido al catálogo, contacta manualmente (vía WhatsApp capturado) a quienes buscaron ese modelo: *"Iván de ToneBOX aquí. Ya tenemos el Asesor de Ahorro para tu Ricoh, ¿te mandamos la ficha?"*

### B. Captura de WhatsApp (Atención VIP)
*   **Prioridad**: Cada registro sin WhatsApp es una oportunidad de suscripción perdida.
*   **Fidelización**: El botón "Activar Asistencia VIP" en el Hero es tu principal motor de captura de base de datos proactiva.

---

## 3. El Algoritmo de Anticipación (T-7)

### ¿Cómo funciona?
1. El cliente compra un **Duo Pack**.
2. El sistema asigna un `Yield` (ej. 2,600 págs) y un `ConsumptionRate` (ej. 25 págs/día).
3. **Trigger de Alerta**: 7 días antes del agotamiento estimado, el Asistente de WhatsApp dispara:
   > *"Hola [Nombre], soy tu asistente de ToneBOX.mx. Notamos que tu impresora [Modelo] está por requerir su siguiente tóner. Por ser uno de nuestros clientes VIP, hoy tenemos para ti una oferta especial en el Duo Pack para que ahorres más. ¿Te lo mandamos hoy mismo para que lo tengas con tiempo y tu oficina nunca se detenga? 🚀"*

### Acción de Iván:
*   Revisa `GET /api/subscriptions/upcoming-renewals` diariamente.
*   Valida que los mensajes automáticos salgan. Si un cliente ignora la alerta, puedes intervenir manualmente como **Asesor**.

---

## 4. Gestión de Pagos y Beneficio VIP

### Lógica de Precios de Lista
*   El precio mostrado en la tienda ya incluye el margen de pasarelas (+4%). 
*   **Margen Protegido**: Si el cliente paga con Tarjeta, ToneBOX cubre la comisión con ese excedente.

### El Beneficio VIP (Descuento SPEI)
*   **Incentivo**: Ofrecemos un ahorro del 4% inmediato si el cliente elige Transferencia SPEI.
*   **Acción del Asistente**: Al elegir SPEI, el sistema muestra: *"Has activado tu beneficio de Cliente VIP. Ahorras $XX.XX"*.
*   **Validación Manual**: Iván debe estar atento al WhatsApp oficial. El cliente enviará su comprobante para **Despacho Inmediato**. 
*   **Ventaja**: Dinero directo a cuenta, sin comisiones de intermediarios y mayor flujo de caja para la fábrica.

---

## 5. Nichos de Mercado (Base de Datos Poblada)

*   **Restaurantes**: Enfoque en ahorro de rollos térmicos (Tickets).
*   **Escuelas**: Enfoque en alto volumen (Tóners XL de 11k páginas).
*   **Salud**: Enfoque en precisión (Etiquetas Zebra).

---

## 6. Mantenimiento Técnico
*   **URL Oficial**: `https://tonebox.mx`
*   **API**: `https://api.tonebox.mx/v1`
*   **SSL**: Activo y monitoreado por Vercel.

**"Tú solo imprime, nosotros nos encargamos del resto."**

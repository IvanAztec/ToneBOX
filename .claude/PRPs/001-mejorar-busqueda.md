# PRP-001: ToneBOX - Modelo de Suscripción de Consumibles Inteligente

**Estado**: 🚀 Implementación en Curso (Upgrade de Inteligencia)
**Autor**: Antigravity
**Fecha**: 2026-02-21

## 1. Contexto y Evolución
ToneBOX ha evolucionado de ser un e-commerce literal a un sistema de **Suscripción de Reposición Anticipada**. En lugar de esperar a que el cliente se quede sin tinta, el sistema predice el agotamiento y actúa de forma proactiva.

## 2. Pilares de la Nueva Inteligencia

### A. Heurística de Demanda (Tasa de Consumo)
- Implementación de `EstimatedConsumptionRate` en el perfil de usuario.
- Algoritmo de predicción: `(Rendimiento del Cartucho / Tasa de Consumo) - 7 días = Alerta`.

### B. Bundles Estratégicos (Duo Packs)
- Relación vinculante entre Tóners y Drums (Tambores) mediante `ProductBundle`.
- Lógica de Upsell automático: Ofrecer el Drum cuando el sistema detecta que es el tercer cambio de Tóner del cliente.

### C. Captura de Leads (WhatsApp First)
- Priorización de WhatsApp en Checkout para re-marketing directo.
- Preparación de mensajes de "Sin Pausas": "Tu Duo Pack para la [Modelo] está listo".

## 3. Propuesta Técnica Implementada

### Backend
- **ProductValidator**: Refinado para el mercado mexicano (Canon G, Samsung MLT, Kyocera TK, Ricoh MP).
- **SubscriptionService**: Lógica de cálculo de fechas de recordatorio.
- **NotificationScheduler**: Estructura para envío de mensajes personalizados vía WhatsApp.
- **Endpoints de Administración**:
    - `GET /api/products/lost-opportunities`: Widget para capturar búsquedas fallidas pero reales.
    - `GET /api/subscriptions/upcoming-renewals`: Vista de clientes a 7 días de agotar su stock.

### Base de Datos (Prisma)
- Nuevos modelos: `ProductBundle`, `ReplenishmentSubscription`.
- Campos enriquecidos en `User` y `Product`.

## 4. Próximos Pasos
1. **Frontend**: Implementar los widgets en el Dashboard de Iván usando los nuevos endpoints.
2. **Integración**: Conectar `NotificationScheduler` con una API de WhatsApp (ej. Twilio).
3. **Escalabilidad**: Aplicar este mismo Blueprint a los siguientes 4 nichos detectados.

---
**ToneBOX ya no solo vende productos; asegura la continuidad operativa de sus clientes.**

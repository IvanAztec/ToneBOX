# PRP-002: Admin Master Panel & Multi-SaaS Orchestrator

## 1. Objetivo Operativo
Transformar la infraestructura actual de ToneBOX en un orquestador capaz de gestionar 5 SaaS independientes bajo un mismo panel de control maestro. El administrador (Iván) debe poder monitorear conversiones, campañas de marketing y la salud del CRM (Client VIP) de forma centralizada.

## 2. Arquitectura de Datos (Modelos Sugeridos)

### A. Capa de Orquestación (Multi-SaaS)
*   **SaaSProject**: Representa cada aplicación (ej. ToneBOX, SaaS #2, etc.).
    *   Campos: `id`, `name`, `brandColor`, `mainDomain`.
*   **Workspace**: Se vincula a un `SaaSProject` para segmentar datos.

### B. Capa de Métricas (Conversion & Marketing)
*   **AnalyticsEvent**: Registro ligero de hits para funnel de ventas.
    *   Campos: `type` (VISIT, CLICK), `category` (WHATSAPP, CHECKOUT, HERO), `saasProjectId`.
*   **CampaignMeta**: Almacenamiento de IDs de seguimiento por proyecto.
    *   Campos: `googleAdsId`, `fbPixelId`, `tagManagerId`.

### C. Capa CRM (VIP Lifecycle)
*   **CRM_View (Virtual/Query)**: Una vista consolidada que une `User` + `ReplenishmentSubscription` para monitorear el ciclo T-7 de forma global.

## 3. Componentes del Master Panel

1.  **Dashboard Overview**:
    *   Selector de Proyecto (ToneBOX, SaaS 2, etc.)
    *   Gráfica de Funnel: "Visitas Web vs. Clicks WhatsApp VIP".
2.  **Marketing Config**:
    *   Formulario simple para actualizar IDs de rastreo sin tocar código.
3.  **Client VIP Monitor**:
    *   Tabla con filtros por fecha de agotamiento (`nextReminderDate`).
    *   Estatus de alertas enviadas.

## 4. Estratégia de Implementación
1.  **Update Prisma Schema**: Introducir los modelos de orquestación y analíticas.
2.  **Service Analytics**: Crear un servicio en el backend para ingerir eventos de conversión.
3.  **Master UI**: Desarrollar una ruta protegida `/admin/master` con el nuevo Dashboard.

---
*"El orquestador permite que ToneBOX sea solo el inicio de una red de servicios inteligentes."*

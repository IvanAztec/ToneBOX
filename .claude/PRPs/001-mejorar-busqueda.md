# PRP-001: Mejora del Sistema de Búsqueda de Consumibles

**Estado**: 📝 Borrador (Esperando Aprobación)
**Autor**: Antigravity
**Fecha**: 2026-02-21

## 1. Contexto y Problema
Actualmente, ToneBOX cuenta con un modelo de `Product` muy básico que solo incluye SKU y Nombre. Para un e-commerce especializado en consumibles (tintas y tóneres), los usuarios necesitan encontrar productos basándose en:
- El modelo de su impresora (ej. "Brother HL-L2350DW").
- El modelo del cartucho (ej. "TN760").
- Atributos específicos (Color, Rendimiento, Marca).

La búsqueda actual (si la hubiera) sería puramente literal por nombre, lo cual es ineficiente y propenso a errores de dedo.

## 2. Objetivos de la Mejora
- **Velocidad**: Encontrar el tóner correcto en menos de 3 pasos.
- **Precisión**: Implementar búsqueda difusa (Fuzzy Search) para tolerar errores ortográficos.
- **Relacionalidad**: Vincular productos con modelos de impresoras compatibles.

## 3. Propuesta Técnica

### A. Refinamiento del Modelo de Datos (Prisma)
Añadir metadatos esenciales al modelo `Product` en `schema.prisma`:
- `brand`: Marca (HP, Brother, Epson, etc.)
- `category`: Tipo (Toner, Ink, Drum, Waste Box).
- `color`: Color del consumible.
- `yield`: Rendimiento estimado (nº de páginas).
- `compatibility`: Un campo de tipo `String[]` o una tabla relacionada para modelos de impresoras.

### B. Backend (Express + Prisma)
- Crear un endpoint `GET /api/products/search`.
- Configurar el soporte de Full-Text Search de PostgreSQL mediante Prisma.
- Implementar filtros por marca y categoría.

### C. Frontend (Feature-First)
- Crear la feature `/frontend/features/search`.
- **Componente SearchBar**: Con sugerencias automáticas (debounced search).
- **Componente CompatibilityChecker**: Una herramienta donde el usuario selecciona su impresora y se le muestran los consumibles compatibles.

## 4. Plan de Implementación
1. **Paso 1**: Actualizar `schema.prisma` y ejecutar migración.
2. **Paso 2**: Crear el Service de Búsqueda en el backend con soporte para búsqueda difusa.
3. **Paso 3**: Desarrollar la UI en el frontend siguiendo la estructura de "Features" de `CLAUDE.md`.
4. **Paso 4**: Poblar la base de datos con datos de prueba reales (ej. Brother TN760, HP 58A).

## 5. Riesgos
- Complejidad en la normalización de nombres de impresoras (muchas variantes para un mismo modelo).
- Rendimiento de la búsqueda si el catálogo escala a miles de SKUs (se mitigará con índices GIN/GiST).

---
**¿Aprobado para proceder?**

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
# PROSPECTA RTM v4.1.1 — Ajuste UI móvil

## Correcciones
- Filtros de fecha corregidos globalmente para iPhone/Safari: ya no invaden Región, Locación u otros campos.
- Selector de fecha visual controlado y táctil, manteniendo el date picker nativo al tocarlo.
- Aplicado en Supervisor (Seguimiento Operativo y Validación de Visitas), Administrador, Desarrollador y cualquier pantalla que use filtros de avance.
- Filtros Desde/Hasta de Bases de Datos del Administrador también corregidos.
- Títulos de KPI en una sola línea en todos los roles, incluyendo Productividad, Prospectores, Clientes visitados, Bonos entregados, Notas de crédito, Objetivo validación y Adherencia subcanal.
- Iconos y tipografías KPI reajustados para pantallas pequeñas.

## Backend / Supabase
No requiere SQL adicional. Si ya ejecutaste `09_v4_1_mobile_validacion.sql`, no vuelvas a ejecutarlo.

## Deploy
1. Conserva/copía tu `.env` en esta carpeta.
2. `npm.cmd install`
3. `npm.cmd run build`
4. `netlify.cmd link` -> seleccionar `prospecta-rtm` (solo si la carpeta aún no está vinculada).
5. `netlify.cmd deploy --build --prod`

El enlace de producción sigue siendo `https://prospecta-rtm.netlify.app`.

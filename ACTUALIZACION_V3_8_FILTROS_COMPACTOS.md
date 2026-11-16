# Actualización v3.8 — Filtros compactos y mensaje motivacional

Esta versión no modifica Supabase ni requiere una migración SQL adicional.

## Cambios
- Los filtros de Avance (Año, Mes, Fecha, Región y Locación) se compactaron visualmente para reducir altura y mejorar la estética Mobile First.
- La lógica de los filtros se mantiene intacta, incluyendo locaciones activas desde Supabase y exclusión permanente de La Molina.
- El mensaje motivacional de Productividad se mantiene en Supervisor y Desarrollador.
- El mensaje motivacional se elimina únicamente del Dashboard Administrador. El Administrador conserva el KPI y semáforo de Productividad y el detalle por prospector.

## Despliegue
Si ya utilizas v3.7, no ejecutes ningún SQL. Solo reemplaza el frontend y vuelve a desplegar en Netlify.

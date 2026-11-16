# PROSPECTA | RTM v4.3.3

## Corrección Supervisor — Avance de Prospectores

La tabla y los KPIs del Supervisor ahora consideran exclusivamente usuarios que cumplan simultáneamente:

- ROL = Prospector
- STATUS = ACTIVO
- EN_PLANTILLA_VIGENTE = true
- REGIÓN = región asignada al Supervisor

Los Prospectores inactivos o ausentes de la última plantilla de usuarios dejan de mostrarse y dejan de sumar en Prospectores, Asistencia, Visitas, Altas y Productividad.

También se actualiza `get_active_dashboard_scope_options()` para que los filtros Región/Locación se construyan únicamente con Prospectores activos y vigentes.

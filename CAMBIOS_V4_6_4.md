# PROSPECTA RTM v4.6.4
- Eliminada la tarjeta residual de Avances de altas del inicio del Validador. La sección ya no figura en navegación ni rutas.
- Avance de prospectores: filtros Año, Mes, Fecha desde, Fecha hasta, Región (selección múltiple), Locación (selección múltiple).
- Región y Locación se aplican con consultas IN en Supabase; sin selección equivale a Todas.
- El rango de fechas tiene prioridad sobre Año/Mes; al cambiar Año/Mes se limpian las fechas.
- Se conserva el resto de las funcionalidades de v4.6.3.
- No requiere nuevo script SQL.

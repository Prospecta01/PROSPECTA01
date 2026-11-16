# PROSPECTA │ RTM — v3.4 · Filtros de Avance

Se agregan filtros superiores a los indicadores de **Supervisor, Desarrollador y Administrador**:

- Año
- Mes
- Fecha
- Región
- Locación

## Reglas de filtrado

1. **Fecha** tiene prioridad. Si se selecciona una fecha, los KPIs muestran ese día.
2. Si Fecha está vacía y se seleccionan **Año + Mes**, se consolida el mes completo.
3. Si Mes está vacío y hay **Año**, se consolida el año completo.
4. **Región** actualiza las locaciones disponibles.
5. **Locación** permite bajar al detalle local.
6. Supervisor permanece restringido a su ámbito autorizado; Desarrollador y Administrador pueden visualizar el alcance permitido por su rol.

## KPIs recalculados

- Prospectores
- Asistencia %
- Visitas
- Altas
- Conversión %

Para mes/año, las Visitas y Altas se acumulan dentro del período. La Asistencia se calcula como porcentaje del período disponible.

## Supabase

### Instalación nueva
Ejecutar únicamente:

`supabase/01_schema_y_seguridad.sql`

Ya contiene la función actualizada.

### Si ya tienes v3.3
Ejecutar únicamente:

`supabase/05_filtros_avance.sql`

No borra las tablas operativas ni los registros existentes.

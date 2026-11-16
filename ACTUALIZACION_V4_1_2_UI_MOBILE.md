# PROSPECTA RTM v4.1.2 — corrección UI móvil definitiva

Esta versión parte de v4.1.1 y corrige específicamente los problemas observados en iPhone/Safari.

## Filtros
- El campo **Fecha** ya no usa el input nativo como elemento visible del layout.
- El selector nativo queda desacoplado del layout y se abre desde un botón visual controlado.
- Fecha, Región, Locación, Año y Mes respetan exactamente el ancho de su celda.
- Se agregaron grids con `minmax(0, 1fr)` para evitar que cualquier control expanda su columna.
- Aplica a Supervisor, Validación de visitas, Administrador y cualquier pantalla que use `MobileDateInput`.

## Indicadores
- Los títulos KPI no pueden partir palabras en dos líneas.
- Se usa tamaño de letra adaptativo según longitud del título.
- Se redujo ligeramente el ícono en KPI para dar más espacio al texto.
- Aplica a títulos como Prospectores, Productividad, Clientes visitados, Bonos entregados, Objetivo validación y Adherencia subcanal.

## Despliegue
No requiere cambios en Supabase ni volver a ejecutar SQL.

1. Copiar el `.env` de la versión actual a esta carpeta.
2. Ejecutar `npm.cmd install`.
3. Ejecutar `npm.cmd run build`.
4. Ejecutar `netlify.cmd link` y seleccionar `prospecta-rtm`.
5. Ejecutar `netlify.cmd deploy --build --prod`.

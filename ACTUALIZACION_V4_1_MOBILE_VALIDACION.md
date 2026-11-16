# PROSPECTA | RTM v4.1 — Mobile + Validación de visitas

## Migración
Para una instalación que ya está en v4.0, ejecutar una sola vez:

`supabase/09_v4_1_mobile_validacion.sql`

Después desplegar el frontend y Netlify Functions con:

`npm.cmd run build`

`netlify.cmd deploy --build --prod`

## Cambios principales
- Filtros mobile corregidos: los campos ya no se superponen.
- Tabla de Supervisor compactada y columna Meta = 5.
- Prospector Home: Productividad compacta.
- Prospector: catálogo de 7 subcanales y 2 evidencias fotográficas (fachada + interior).
- Prospector Avance: se elimina Actividad por franja; últimas visitas muestran DNI, subcanal y fachada.
- Se elimina Contactos del rol Prospector.
- Supervisor incorpora sección Validación de visitas con KPI de objetivo diario y adherencia al subcanal.
- Nueva base Supabase BBDD_VALIDACION_VISITA_SUPERVISOR.
- Administrador muestra únicamente 3 bases: Jornada consolidada, Visitas y Validación supervisor.
- Fachadas pasan a tener URL directa para poder abrirlas desde el navegador y exportarlas en Excel.

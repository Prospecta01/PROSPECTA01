# PROSPECTA | RTM v4.2.2.6 — Fix Rutas por Locación

## Problema corregido
Al confirmar una nueva base de Rutas por Locación, Supabase devolvía:

`DELETE requires a WHERE clause`

La función `replace_rutas_locacion` realizaba un borrado total sin cláusula `WHERE`, bloqueado por la protección de seguridad del proyecto.

## Solución
Ejecutar en Supabase SQL Editor:

`supabase/13_v4_2_2_6_rutas_replace_safe.sql`

No requiere cambios de frontend para esta corrección. Después de ejecutar el SQL, volver a confirmar la carga de Rutas.

# PROSPECTA RTM v3.7 — Usuarios y locaciones activas

## Nuevo usuario
El Administrador registra: **Usuario, Contraseña, Nombres, Apellido, Region, Locación, Rol y Status**.

La importación masiva sigue usando la hoja **Usuario&Contraseña** y conserva los encabezados originales del Excel: `Usuario, Contraseña, Nombre, Apellido, Región, Locación, Rol, Status`. El campo visual **Nombres** se guarda en la columna `NOMBRE`.

## Filtros de Avance
Los filtros de Supervisor, Desarrollador y Administrador ya no se alimentan del resultado del dashboard. Se obtienen desde `USUARIOS` en Supabase:

- solo usuarios con `STATUS = ACTIVO`;
- `La Molina` se excluye siempre del selector de Locación;
- Supervisor recibe únicamente locaciones activas de su Región;
- Desarrollador y Administrador reciben todas las locaciones activas disponibles.

Si se crea un usuario ACTIVO en una nueva locación, esa locación aparecerá automáticamente en el filtro. Si todos los usuarios de una locación pasan a INACTIVO, la locación dejará de aparecer.

## Migración
Si ya tienes v3.6 instalada, ejecuta en Supabase SQL Editor:

`supabase/07_locaciones_activas_filtros.sql`

# PROSPECTA RTM v4.2.1 — Supervisor por Región + filtro Locación

Esta versión corrige la lógica del Supervisor sobre la base de v4.2.0.

## Regla definitiva
- Al crear o editar un usuario **Supervisor**, el Administrador selecciona **Región**, pero **Locación no aparece ni se guarda**.
- El Supervisor tiene alcance sobre todos los Prospectores de su Región.
- En **Seguimiento operativo** sí aparece el filtro **Locación**, limitado a las locaciones activas de su Región.
- En **Validación de visitas** también aparece el filtro **Locación**, limitado a las locaciones activas de su Región.
- Elegir una Locación filtra realmente Prospectores, jornadas, visitas, altas, productividad y validaciones.
- Coordinador Regional conserva la misma regla administrativa sin Locación.

## Importación de usuarios
La hoja `Usuario&Contraseña` conserva las columnas actuales. Para filas con Rol = Supervisor o Coordinador Regional, la columna Locación puede quedar vacía y cualquier valor presente se ignora al guardar.

## Actualización de Supabase
Ejecutar una sola vez, después de haber aplicado v4.2.0:

`supabase/11_v4_2_1_supervisor_region_locacion.sql`

El script permite Locación nula en `USUARIOS` y limpia la Locación de Supervisores/Coordinadores existentes. No elimina la Locación de Prospectores.

## Actualización de Netlify
Después de ejecutar el SQL, mantener el `.env` actual y desplegar el proyecto completo (no solo `dist`) porque `netlify/functions/admin-users.mjs` también cambió.

```powershell
npm.cmd install
npm.cmd run build
netlify.cmd link
netlify.cmd deploy --build --prod
```

## Validación rápida
1. Administrador > Gestión de Usuarios > Nuevo usuario > Rol Supervisor: debe desaparecer Locación.
2. Guardar Supervisor: debe quedar Región informada y Locación vacía/nula.
3. Ingresar como Supervisor: Seguimiento operativo debe mostrar Locación.
4. Cambiar Locación: KPIs y tabla deben cambiar según la selección.
5. Validación de visitas: debe mostrar Fecha, Región y Locación y filtrar correctamente.

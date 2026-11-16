# PROSPECTA RTM v4.2.0

Aplicación mobile-first para Prospección en Perú.

## Roles activos
- Prospector
- Supervisor
- Coordinador Regional
- Validador
- Administrador

## Novedades v4.2
Ver `ACTUALIZACION_V4_2_ALTA_360_VALIDADOR.md`.

## Actualizar desde v4.1.2
1. Copiar el `.env` de la carpeta v4.1.2 a esta carpeta.
2. En Supabase SQL Editor ejecutar **solo** `supabase/10_v4_2_alta_360_validador.sql`.
3. Ejecutar `npm.cmd install` y `npm.cmd run build`.
4. Ejecutar `netlify.cmd link` y elegir el proyecto existente `prospecta-rtm`.
5. Publicar con `netlify.cmd deploy --build --prod`.

No volver a ejecutar los scripts 01–09 si el proyecto ya está en v4.1.2.

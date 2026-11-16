# Arquitectura PROSPECTA RTM v4.2

- Frontend: React + Vite + Tailwind CSS.
- Backend: Supabase Auth + PostgreSQL + Storage + RLS.
- Hosting y función administrativa: Netlify.
- Prospector registra Alta 360 en `BBDD_VISITAS`.
- `RUTAS_LOCACION` es el maestro administrable de Locación Comercial / Ruta.
- Evidencias del Alta 360 se almacenan en `documentos-prospecta`; Foto de local usa el bucket de fachadas.
- Supervisor opera a nivel de Región.
- Validador consulta altas efectivas, marca `¿Registrado?` en `BBDD_REGISTRO_VALIDADOR` y conserva jornada en las tablas históricas de jornada del antiguo rol Desarrollador para no perder datos.

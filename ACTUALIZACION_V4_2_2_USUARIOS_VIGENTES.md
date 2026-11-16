# PROSPECTA | RTM v4.2.2

## Cambios
- Gestión de Usuarios muestra únicamente usuarios de la plantilla vigente.
- Una nueva importación oculta de la visual a usuarios ausentes sin borrar su historial operativo.
- Nueva columna obligatoria Celular en plantilla, formulario y tabla.
- Edición individual disponible desde la tabla/tarjeta de cada usuario.
- Carga de bases muestra y permite descargar únicamente el último Excel vigente de Usuarios y Rutas por Locación.
- Hotfix Registro de Visitas: un fallo del catálogo de rutas ya no deja el spinner infinito.

## Actualización
1. Ejecutar `supabase/12_v4_2_2_usuarios_vigentes_archivos.sql`.
2. Conservar `.env`.
3. `npm.cmd install`
4. `npm.cmd run build`
5. `netlify.cmd deploy --prod`

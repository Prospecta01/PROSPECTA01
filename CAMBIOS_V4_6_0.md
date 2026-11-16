# PROSPECTA │ RTM v4.6.0
Base: v4.4.4, sin módulos de archivado ni depuración.

1. Administrador > Carga de bases > Subcanales: plantilla, carga, vista previa, confirmación y descarga del último archivo. El catálogo de Prospectores se obtiene de Supabase al entrar a registrar una visita.
2. Administrador > Bases de Datos > Visitas exitosas: exportación y tabla con 19 campos solicitados, incluyendo estados, fechas, Código Enlace y Validador asignado por región.
3. Validador > Avance de Prospectores: Código Enlace editable junto a Código SAP.
4. Validador > Avances de altas: tres tablas de recuentos desde 03/11/2026; se excluyen rechazadas de la primera, se muestran únicamente geolocalizadas en la segunda y completadas en la regional.

## Instalación
- Ejecutar `supabase/21_v4_6_0_subcanales_enlace.sql` en SQL Editor de Supabase.
- Revisar que la política RLS existente de BBDD_REGISTRO_VALIDADOR permita al Validador actualizar CODIGO_ENLACE.
- `npm install` y `npm run build`.
- Desplegar en Netlify conservando variables de entorno existentes.

## Consideraciones
- La sustitución del catálogo es atómica en PostgreSQL. Si falla la carga del Excel a Storage después de actualizar el catálogo, la aplicación informa el error y debe reintentarse la carga del archivo; el catálogo ya habrá cambiado.
- No se borran subcanales históricos: los que salen de la plantilla quedan inactivos para nuevas visitas.
- La tabla de WhatsApp cuenta únicamente registros marcados como geolocalizados.
- Las fechas se agrupan por la fecha local de Perú del envío de la visita.
- La asignación Validador 1 / Validador 2 se deriva de la región, no del usuario que efectivamente validó.

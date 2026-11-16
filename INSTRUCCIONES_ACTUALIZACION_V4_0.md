# PROSPECTA | RTM v4.0 — Actualización

## Orden recomendado
1. Haz una copia de seguridad de tu carpeta actual `PROSPECTA_RTM`.
2. En Supabase > SQL Editor, ejecuta completo `supabase/08_v4_0_coordinador_mapas_salidas.sql`.
3. Copia los archivos de esta versión sobre tu proyecto actual, conservando tu `.env`.
4. En Windows, dentro de la carpeta del proyecto, ejecuta `npm install` si es necesario.
5. Prueba localmente con `npm run dev`.
6. Cuando valides, despliega nuevamente en Netlify.

## Cambios incluidos
- Supervisor: eliminado gráfico Actividad del período.
- Supervisor: tabla con primera columna inmovilizada, ingreso/status/GPS, visitas, altas, productividad, salida/status/GPS.
- Supervisor: mapas grupales de Inicio y Fin de jornada.
- Inicio y Fin de jornada: captura GPS.
- Salida: Anticipada antes de 17:00, Puntual 17:00–17:15, Tardía después de 17:15.
- Prospector: catálogo completo de Subcanal con búsqueda mediante selector editable.
- Prospector: eliminada Dirección Cliente.
- Prospector: motivo libre cuando se selecciona Otro.
- Administrador: tabla de avance equivalente a Supervisor pero sin ubicaciones.
- Administrador: botón Eliminar usuario; elimina acceso Auth y archiva perfil para conservar historia.
- Bases: columnas reordenadas según especificación y Nombre y apellido incorporado.
- Nuevo rol Coordinador Regional: sin Locación al crear usuario; visual tipo Supervisor para toda su Región.
- RLS: Supervisor limitado a su locación; Coordinador Regional limitado a su región.

## Mapas
Los mapas usan Leaflet + OpenStreetMap cargados desde CDN. Requieren conexión a Internet en el dispositivo para cargar el mapa base.

## Nota sobre datos históricos
Los registros anteriores a v4.0 no tienen GPS de Inicio/Fin porque esa información no se capturaba. Aparecerán como `Sin GPS`. A partir del despliegue v4.0, los nuevos registros sí guardarán coordenadas.

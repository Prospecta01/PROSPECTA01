# PROSPECTA | RTM v4.4.0

## Prospector
- `Foto de local` pasa a llamarse **Foto de Fachada**.
- Se agrega **Foto interior** como evidencia obligatoria.

## Validador · Base de altas de Prospectores
- Estado Registro: Pendiente / Completado / Rechazado.
- KPI Rechazadas.
- Productividad registro = (Completadas + Rechazadas) / Altas totales.
- Nueva columna ¿Geolocalizado? con check editable.
- Nueva columna Fecha Prospector: fecha y hora de `FIN_ISO` de la visita efectiva.
- Nueva columna Fecha Aprobador editable.
- Exportación Excel incorpora los nuevos campos.
- Código cliente SAP se mantiene.

## Supabase
Ejecutar `supabase/19_v4_4_0_validador_estados_fotos.sql`.

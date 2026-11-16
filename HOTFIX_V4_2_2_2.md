# PROSPECTA | RTM v4.2.2.2 — Snapshot de usuarios

Corrección: la importación de usuarios ahora procesa y reemplaza la plantilla vigente en una sola operación de Netlify Function.

- Los usuarios presentes en el último Excel quedan con EN_PLANTILLA_VIGENTE = true.
- Los usuarios ausentes quedan con EN_PLANTILLA_VIGENTE = false.
- No se elimina su historial operativo ni sus registros históricos.
- Gestión de Usuarios y sus KPIs siguen consultando solo EN_PLANTILLA_VIGENTE = true.

Después de desplegar esta versión, vuelve a importar la plantilla vigente una vez para reconstruir correctamente la foto actual de usuarios.

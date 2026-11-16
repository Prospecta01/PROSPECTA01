# PROSPECTA | RTM v4.3.3 — Hotfix usuarios eliminados

- Eliminar usuario ahora deja STATUS=INACTIVO y EN_PLANTILLA_VIGENTE=false.
- El SQL limpia usuarios eliminados históricamente (sin UID_AUTH ni EMAIL_AUTH) que quedaron vigentes.
- Supervisor/Coordinador mantienen filtro exclusivo de Prospectores ACTIVO + vigente.

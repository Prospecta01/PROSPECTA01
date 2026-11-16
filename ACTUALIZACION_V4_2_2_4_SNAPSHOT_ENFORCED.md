# PROSPECTA | RTM v4.2.2.4 — Snapshot Enforced

- Nueva función Netlify `admin-users-snapshot` para evitar reutilizar una función antigua en producción.
- La importación de usuarios marca primero toda la base como no vigente y luego reactiva exclusivamente los usuarios del último Excel.
- Verificación posterior obligatoria: si queda visible algún usuario que no está en la plantilla, se fuerza su ocultamiento y se vuelve a verificar.
- Gestión de Usuarios continúa consultando exclusivamente `EN_PLANTILLA_VIGENTE = true`.
- Conserva favicon P blanca sobre fondo rojo.
- No borra historial operativo ni elimina usuarios históricos de Supabase.

Después de desplegar esta versión, se debe volver a importar una vez la plantilla vigente para recalcular la foto actual.

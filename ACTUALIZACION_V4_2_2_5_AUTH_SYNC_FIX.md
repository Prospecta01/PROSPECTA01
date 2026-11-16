# PROSPECTA | RTM v4.2.2.5 — Auth Sync Fix

- Renueva automáticamente la sesión Supabase antes de ejecutar funciones administrativas.
- Reintenta una vez ante HTTP 401.
- La función `admin-users-snapshot` usa `VITE_SUPABASE_URL` como URL canónica cuando está disponible.
- Verifica que el token del navegador pertenezca al mismo proyecto Supabase configurado en Netlify.
- Si la clave privada pertenece a otro proyecto, devuelve un mensaje explícito de configuración.
- Conserva Snapshot Enforced, Celular, edición individual, últimos archivos vigentes y favicon P rojo.

## Variables requeridas en Netlify
Todas deben pertenecer al MISMO proyecto Supabase:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_URL (puede ser igual a VITE_SUPABASE_URL)
- SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY
- VITE_DEMO_MODE=false

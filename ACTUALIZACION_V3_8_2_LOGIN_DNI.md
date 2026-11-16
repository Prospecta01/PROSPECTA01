# v3.8.2 — Login DNI / Usuario

- El demo permite escribir DNI/Usuario y Contraseña.
- Valida los usuarios de demostración basados en la hoja `Usuario&Contraseña`.
- Los usuarios creados desde Administrador > Nuevo usuario pueden iniciar sesión en el mismo demo con sus credenciales.
- Se valida STATUS ACTIVO y el rol determina automáticamente la navegación.
- La aplicación productiva mantiene Supabase Auth; no requiere cambios SQL.

# PROSPECTA RTM v3.8.1 — Reparación del demo Gestión de Usuarios

Esta versión corrige exclusivamente la interacción del demo HTML offline en Administrador > Gestión de Usuarios.

## Correcciones
- `+ Nuevo usuario` ahora abre un formulario interactivo.
- Campos: Usuario, Contraseña, Nombres, Apellido, Region, Locación, Rol y Status.
- Validación de campos obligatorios y contraseña mínima de 6 caracteres.
- Al guardar, el usuario aparece inmediatamente en la lista del demo.
- Los usuarios ACTIVO alimentan las locaciones del filtro de Avance y La Molina se excluye.
- `Importar Excel` incluye una simulación visual en el demo.

No requiere cambios de SQL ni migraciones en Supabase. La aplicación React productiva ya contenía el flujo funcional; esta versión alinea el demo offline con dicho comportamiento.

# PROSPECTA RTM v4.6.6 — Fotografías

- Enlace firmado de Supabase para vista de fachada (no URL pública inválida).
- Vista del Validador muestra «No disponible» en vez de miniatura rota cuando falla la carga.
- Exportaciones de Validador y Administrador: URL completa, copiable y con hipervínculo Excel.
- Fotos ausentes o rutas incorrectas no bloquean la exportación; se deja celda vacía.
- Enlaces temporales con vigencia solicitada de 7 días, sujeto a configuración del servicio.
- No requiere cambios SQL ni políticas públicas de Storage.
- Se conserva el .env del archivo aportado. No compartir ese archivo públicamente.

## Despliegue
Ejecutar comandos desde la carpeta que contiene package.json y netlify.toml:
`npm.cmd install`
`npm.cmd run build`
`netlify.cmd link` (si no está vinculado)
`netlify.cmd deploy --no-build --dir=dist`
Comprobar primero la URL draft y después publicar en producción.

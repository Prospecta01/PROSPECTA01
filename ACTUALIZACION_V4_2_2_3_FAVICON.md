# PROSPECTA | RTM v4.2.2.3

## Cambio incluido
- Favicon del navegador reemplazado por una P blanca sobre fondo rojo.
- Conserva todos los cambios de v4.2.2.2, incluido el snapshot de usuarios vigentes.

## Despliegue
No requiere SQL adicional.

1. Conservar el archivo `.env` actual.
2. `npm.cmd install`
3. `npm.cmd run build`
4. Vincular la carpeta al sitio existente si es necesario con `netlify.cmd link`.
5. `netlify.cmd deploy --build --prod`
6. En el navegador usar `Ctrl + F5` para limpiar la caché del favicon.

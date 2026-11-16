# v4.6.5 — Enlaces de fotografías en Excel

- Validador > Avance de prospectores: Foto de Fachada y Foto interior exportan URLs firmadas completas.
- Administrador > Visitas exitosas: se agregan las dos columnas y se exportan URLs firmadas completas.
- Exportación conjunta de las tres bases: misma corrección.
- Vigencia de URLs: 7 días desde la descarga. Al vencer, volver a exportar.
- Las fotos continúan en bucket privado. No se modifican bases ni políticas de Supabase.
- No requiere SQL nuevo.
- SheetJS CE escribe las URLs como texto completo (copiables al navegador); no se garantiza hipervínculo con texto «Ver foto».
- No se incluye .env por seguridad. Mantener el .env local original al compilar, o configurar variables de entorno en Netlify.

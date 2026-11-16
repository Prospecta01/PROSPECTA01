# PROSPECTA RTM v4.2.0 — Alta 360 + Validador

Esta versión parte de **v4.1.2 UI Mobile Fix** y mantiene el resto de la operación vigente.

## Prospector — visita exitosa
La visita exitosa se organiza en cuatro acordeones dentro de la misma pantalla:

1. **Cliente (8 campos):** Canal Principal = Tradicional, Subcanal*, RUC, DNI Cliente*, Razón Social*, Correo electrónico, Teléfono Celular 1*, Teléfono Celular 2.
2. **Dirección (12 campos):** Vía Tipo, Dirección*, Número, Manzana, Lote, Sección, Interior, Departamento, Provincia, Distrito, Ubigeo, Ubicación/referencia.
3. **Ubicación (8 datos):** Locación Comercial, Ruta dependiente, Segmento, Representante Legal, Nombre del vendedor, Código de vendedor, Segmento ACD, ubicación GPS con dirección + latitud + longitud.
4. **Documentos (6):** DNI/CE frente*, DNI/CE atrás*, RUC, Recibo Servicios/Contrato de Renta*, Ficha de Caracterización, Foto de local*.

Los campos con `*` son obligatorios. Razón Social también se valida como obligatoria por requerimiento funcional.

## Administrador — Carga de bases
Nuevo módulo **Carga de bases**:
- **Usuarios:** conserva los encabezados Usuario, Contraseña, Nombre, Apellido, Región, Locación, Rol, Status.
- **Rutas por Locación:** columnas `Locación Comercial` y `Ruta`. La carga reemplaza el maestro vigente y alimenta los desplegables del Prospector.
- Se incluye `data/Rutas_por_Locacion.xlsx` como maestro inicial y `public/Rutas_por_Locacion.xlsx` para Demo Mode.

## Supervisor
- Ya no se filtra por Locación.
- El alcance operativo y de Validación de visitas es toda la **Región** asignada al Supervisor.

## Validador
El rol **Desarrollador** cambia de nombre a **Validador**.
- Se mantienen Inicio de Jornada y Fin de Jornada.
- Se elimina Registro de Visitas del rol.
- Avance de Prospectores mantiene filtros y muestra: Prospectores, Altas, Altas registradas, Altas pendientes y Productividad de registro.
- Productividad de registro = Altas registradas / Altas × 100.
- Se eliminan Actividad de Prospectores y Avance por prospector.
- Debajo de KPIs aparece una tabla con Nombre Prospector, Región, Locación, los **34 datos** del alta y `¿Registrado?`.
- Las evidencias muestran miniatura cuando son imágenes y se abren en grande mediante URL firmada; la foto de local usa URL pública.

## Supabase
Ejecutar una sola vez:

`supabase/10_v4_2_alta_360_validador.sql`

Este SQL:
- migra usuarios `Desarrollador` a `Validador`;
- agrega los campos del Alta 360 a `BBDD_VISITAS`;
- crea `RUTAS_LOCACION` y carga el maestro inicial;
- crea bucket privado `documentos-prospecta`;
- crea `BBDD_REGISTRO_VALIDADOR`;
- actualiza RLS para Supervisor por Región y Validador sobre altas de Prospectores.

## Netlify
Después de ejecutar SQL y copiar el `.env` de v4.1.2, usar:

```powershell
npm.cmd install
npm.cmd run build
netlify.cmd link
netlify.cmd deploy --build --prod
```

Vincular al proyecto existente `prospecta-rtm`.

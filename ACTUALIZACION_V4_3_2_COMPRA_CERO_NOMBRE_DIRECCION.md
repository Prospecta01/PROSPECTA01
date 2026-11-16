# PROSPECTA | RTM v4.3.2

## Cambios
- Supervisor > Gestión compra cero agrega las columnas **Nombre del cliente** y **Dirección**.
- Orden de tabla: Código SAP, Nombre del cliente, Dirección, Locación, Visita, ¿Realizó compra?, Cantidad vendida, Comentarios.
- Administrador > Carga de bases > Clientes Compra Cero usa plantilla con: Código SAP, Nombre del cliente, Dirección, Región, Locación.
- Nombre del cliente se guarda en `CLIENTE` y dirección en `DIRECCION` dentro de `CLIENTES_COMPRA_CERO`.

## Migración
Ejecutar `supabase/16_v4_3_2_compra_cero_nombre_direccion.sql` después de las migraciones v4.3.0 y v4.3.1.

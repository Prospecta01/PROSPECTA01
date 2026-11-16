# PROSPECTA | RTM v4.3.0

## Cambios funcionales

### Coordinador Regional
- Nueva opción **Base de Altas**.
- Muestra únicamente visitas exitosas (altas) permitidas por su Región.
- Filtros: Desde, Hasta, Región y Locación.
- Exportación Excel.
- Incluye **Código cliente SAP** registrado por el Validador.

### Supervisor
- Nueva sección **Gestión de compra cero**.
- Alcance estricto a la Región del Supervisor.
- KPIs:
  - Clientes compra cero.
  - % compra cero = clientes compra cero / visitas exitosas de la Región.
  - % gestión compra cero = clientes con ¿Realizó compra? marcado / clientes compra cero.
- Tabla editable:
  - Cliente compra cero.
  - Visita física.
  - ¿Realizó compra?.
  - Cantidad vendida.
  - Comentarios.

### Validador
- Nueva columna editable **Código cliente SAP** al costado de ¿Registrado?.
- El valor queda asociado a la visita/alta.

### Administrador
- En **Carga de bases** se agrega **Clientes Compra Cero**.
- Plantilla: Código Cliente, Cliente, Región, Locación.
- Se conserva solo el último archivo como vigente y descargable.
- La nueva carga reemplaza el maestro vigente sin borrar gestiones históricas.
- En **Bases de Datos > Visitas exitosas** se muestran únicamente altas y se agrega Código cliente SAP.

## Supabase
Ejecutar:

`supabase/14_v4_3_0_compra_cero_codigo_sap.sql`

Este script:
- agrega Código cliente SAP al registro del Validador;
- habilita lectura regional del dato SAP para Coordinador;
- crea CLIENTES_COMPRA_CERO;
- crea BBDD_GESTION_COMPRA_CERO;
- crea la función replace_clientes_compra_cero;
- configura RLS regional para Supervisor.

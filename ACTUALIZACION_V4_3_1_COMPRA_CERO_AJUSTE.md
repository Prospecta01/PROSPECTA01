# PROSPECTA | RTM v4.3.1

## Ajustes Compra Cero
- Supervisor > Gestión compra cero: tabla con Código SAP, Locación, Visita, ¿Realizó compra?, Cantidad vendida y Comentarios.
- % Gestión compra cero = checks en ¿Realizó compra? / clientes compra cero de la Región del Supervisor.
- Administrador > Carga de bases > Compra Cero: plantilla exacta con Código SAP, Región y Locación.
- La carga reemplaza el maestro vigente sin eliminar gestiones históricas.

## SQL
Ejecutar `supabase/15_v4_3_1_compra_cero_codigo_sap.sql` después de la migración v4.3.0.

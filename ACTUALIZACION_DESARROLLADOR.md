# Actualización v3.3 - Rol DESARROLLADOR

Se agregó un cuarto rol: `Desarrollador`.

- Inicio de jornada independiente.
- Visitas por Código de cliente.
- Pregunta obligatoria ¿Se entregó bono?
- Bono = NO: no solicita foto ni nota de crédito, pero exige comentario/motivo obligatorio.
- Bono = SI + Dinero efectivo: foto obligatoria.
- Bono = SI + Nota de crédito: código de nota obligatorio.
- Nuevas tablas Supabase:
  - BBDD_INICIO_JORNADA_DESARROLLADOR
  - BBDD_VISITAS_DESARROLLADOR
- Nuevo bucket privado: bonos-desarrollador.
- Gestión de Usuarios permite crear/importar Rol = Desarrollador.
- Administrador puede visualizar y exportar las 6 bases.

Si tu Supabase anterior todavía no tenía Desarrollador, ejecuta:
`supabase/02_agregar_rol_desarrollador.sql`

Si ya tenías la v3.1 con Desarrollador, ejecuta:
`supabase/03_comentario_no_bono_desarrollador.sql`


## Regla adicional v3.2 — bono NO entregado

Si `BONO_ENTREGADO = NO`, el campo `COMENTARIO_NO_BONO` es obligatorio. Debe registrar brevemente el motivo por el cual no se entregó el bono. Si el bono fue entregado (`SI`), este campo queda vacío.

## Regla adicional v3.3 — Fin y Avance
- Nueva base `BBDD_FIN_JORNADA_DESARROLLADOR`.
- Nuevo módulo Avance de Prospectores para Desarrollador.
- Si ya tienes v3.2, ejecuta `supabase/04_fin_jornada_y_avance_desarrollador.sql`.

# PROSPECTA │ RTM — Actualización v3.2 DESARROLLADOR

## Nuevo cuarto rol

El aplicativo maneja cuatro roles: **Prospector, Desarrollador, Supervisor y Administrador**.

## Flujo del Desarrollador

1. Registra **Inicio de Jornada** con fecha, hora y clasificación de ingreso.
2. Para iniciar una visita debe tener la jornada del día registrada.
3. Al iniciar visita se registra hora y GPS.
4. Registra **Código de cliente**.
5. Responde **¿Se entregó bono?**
   - **SÍ → Dinero efectivo:** foto de entrega obligatoria.
   - **SÍ → Nota de crédito:** código de nota obligatorio.
   - **NO:** comentario/motivo de no entrega obligatorio.
6. Finaliza la visita; se calcula duración y se guarda en Supabase.

## Bases nuevas

- `BBDD_INICIO_JORNADA_DESARROLLADOR`
- `BBDD_VISITAS_DESARROLLADOR`

La segunda incluye `CODIGO_CLIENTE`, `BONO_ENTREGADO`, `TIPO_BONO`, `FOTO_ENTREGA_DINERO`, `CODIGO_NOTA_CREDITO` y `COMENTARIO_NO_BONO`, además de hora, duración, GPS, región y locación.

## Administrador

Pilar puede crear/importar usuarios con rol **Desarrollador**, consultar las dos bases nuevas y exportarlas a Excel. La exportación consolidada contiene **5 hojas**.

## Supabase existente

- Si vienes de una versión anterior sin Desarrollador: ejecuta `supabase/02_agregar_rol_desarrollador.sql`.
- Si ya tenías v3.1 con Desarrollador: ejecuta `supabase/03_comentario_no_bono_desarrollador.sql`.

> La migración conserva registros históricos con bono NO. Si fueron creados antes de v3.2 y no tenían motivo, se completa automáticamente con “Registro previo a v3.2: motivo no registrado”.

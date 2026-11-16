# PROSPECTA │ RTM — Actualización v3.3

Esta versión amplía el rol **DESARROLLADOR** con dos funcionalidades:

## 1. Fin de Jornada del Desarrollador

El Desarrollador ahora dispone de:

`Inicio → Jornada → Visitas → Avance → Fin`

Para cerrar el día:
- Debe haber registrado Inicio de Jornada.
- No puede existir una visita en curso.
- Se registra una sola vez por día.

Nueva tabla Supabase:

`BBDD_FIN_JORNADA_DESARROLLADOR`

Campos:
- FECHA
- USUARIO
- HORA_INICIO
- HORA_FIN
- DURACION_JORNADA
- REGION
- LOCACION

El Administrador puede visualizar y exportar esta tabla.

## 2. Avance total de Prospectores

El rol Desarrollador incorpora **Avance de Prospectores**, con los mismos indicadores principales del Supervisor:

- Prospectores activos
- Asistencia %
- Visitas
- Altas
- Conversión %

También muestra el detalle por Prospector:
- Usuario
- Nombre
- Región / Locación
- Hora de ingreso
- Clasificación de asistencia
- Visitas
- Altas
- Conversión

La vista es un **consolidado nacional**.

Para no abrir las tablas operativas de Prospectores directamente al rol Desarrollador, Supabase entrega este avance mediante la función segura:

`get_developer_prospector_progress`

## Bases visibles al Administrador

Ahora son **6 bases**:

1. BBDD_INICIO_JORNADA
2. BBDD_VISITAS
3. BBDD_FIN_JORNADA
4. BBDD_INICIO_JORNADA_DESARROLLADOR
5. BBDD_VISITAS_DESARROLLADOR
6. BBDD_FIN_JORNADA_DESARROLLADOR

La exportación consolidada genera un Excel con seis hojas.

## Cómo actualizar una instalación v3.2

No borres ninguna tabla.

En Supabase → SQL Editor ejecuta:

`supabase/04_fin_jornada_y_avance_desarrollador.sql`

Luego vuelve a desplegar esta versión en Netlify.

## Instalación nueva

Si todavía no has creado las tablas, ejecuta solamente:

`supabase/01_schema_y_seguridad.sql`

El esquema principal de v3.3 ya contiene todo.

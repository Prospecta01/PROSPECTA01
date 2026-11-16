# PROSPECTA │ RTM — v3.5 · Productividad diaria

## Regla de Productividad
- Meta diaria por Prospector: **5 altas = 100%**.
- Fórmula diaria: `Altas / 5 × 100`.
- El porcentaje no se limita a 100%. Ejemplo: 6 altas = 120%.
- Semáforo:
  - **VERDE:** >= 100%
  - **ÁMBAR:** 60% a 99%
  - **ROJO:** < 60%

## Prospector
En Avance del Día se reemplaza Conversión por Productividad. Se muestra Visitas, Altas / 5, Productividad y Duración Promedio. Si la productividad es menor a 100%, aparece un mensaje motivacional indicando que falta poco para alcanzar la meta. Al llegar o superar 100%, aparece un reconocimiento positivo.

## Supervisor
En Avance de Prospectores se reemplaza Conversión por Productividad. Se muestra el KPI consolidado de Productividad y, en el detalle por Prospector, el porcentaje individual con semáforo. Se conserva el filtro superior: Año, Mes, Fecha, Región y Locación.

## Desarrollador
En Avance de Prospectores se reemplaza Conversión por Productividad y se muestra el porcentaje individual por Prospector con semáforo. Mantiene los filtros de Año, Mes, Fecha, Región y Locación.

## Administrador
En Dashboard se reemplaza Conversión por Productividad. También se añade detalle de Productividad por Prospector y una nueva base administrativa: `BBDD_PRODUCTIVIDAD_PROSPECTOR`.

## Persistencia diaria en Supabase
La nueva tabla guarda un registro por Fecha + Prospector:
- FECHA
- USUARIO
- META_ALTAS
- ALTAS
- PRODUCTIVIDAD_PCT
- SEMAFORO
- MENSAJE_MOTIVACIONAL
- REGION
- LOCACION

Triggers de Supabase actualizan automáticamente la productividad cuando se registra/actualiza una visita, inicio de jornada o fin de jornada.

## Actualización desde v3.4
Ejecutar en Supabase SQL Editor:
`supabase/06_productividad_diaria.sql`

Luego volver a desplegar el frontend en Netlify.

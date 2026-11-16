# NOTA v4.2.1

Para actualizar desde v4.2.0, primero ejecuta `supabase/11_v4_2_1_supervisor_region_locacion.sql` y despliega el proyecto completo con Netlify CLI porque cambió la función `admin-users`. Consulta `PASO_A_PASO_ACTUALIZACION_V4_2_1.txt`.

---

# PROSPECTA RTM v4.2.0 — Actualización Supabase + Netlify

Esta guía es para actualizar la app actualmente publicada desde **v4.1.2** a **v4.2.0**.

## Orden correcto

1. Copiar `.env` de tu carpeta v4.1.2 a la carpeta v4.2.
2. Actualizar **Supabase**.
3. Instalar dependencias y validar el build.
4. Vincular la carpeta al proyecto Netlify existente `prospecta-rtm`.
5. Publicar en producción.

El enlace público seguirá siendo:

`https://prospecta-rtm.netlify.app`

---

## 1. Copiar el .env

Desde tu carpeta anterior copia únicamente el archivo `.env` a la raíz de esta carpeta v4.2.

Debe mantener estas variables:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_DEMO_MODE=false
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
```

No compartas `SUPABASE_SECRET_KEY`.

---

## 2. Supabase — ejecutar SOLO la migración v4.2

En Supabase abre:

**SQL Editor → New query**

Abre el archivo:

`supabase/10_v4_2_alta_360_validador.sql`

Copia todo su contenido, pégalo y presiona **Run**.

Si vienes de v4.1.2, **NO vuelvas a ejecutar 01–09**.

La migración v4.2:

- cambia el rol `Desarrollador` a `Validador` preservando los usuarios existentes;
- agrega los campos del Alta 360 a `BBDD_VISITAS`;
- crea `RUTAS_LOCACION` y carga las 1,568 relaciones del Excel adjunto;
- crea el bucket privado `documentos-prospecta`;
- crea `BBDD_REGISTRO_VALIDADOR`;
- actualiza RLS para que Supervisor vea toda su Región;
- habilita al Validador para consultar altas de Prospectores y marcar `¿Registrado?`.

Al terminar debe aparecer `Success`.

---

## 3. Netlify — preparar la carpeta v4.2

Abre PowerShell dentro de esta carpeta y ejecuta:

```powershell
npm.cmd install
npm.cmd run build
```

El build correcto termina con:

`✓ built in ...`

---

## 4. Vincular al mismo proyecto Netlify

Ejecuta:

```powershell
netlify.cmd link
```

Elige:

`Choose from a list of your recently updated projects`

Luego selecciona:

`prospecta-rtm`

Debe aparecer `Directory Linked`.

---

## 5. Publicar v4.2

Ejecuta:

```powershell
netlify.cmd deploy --build --prod
```

Al final debe indicar:

`Production deploy is live`

La URL seguirá siendo:

`https://prospecta-rtm.netlify.app`

---

## 6. Pruebas mínimas después del deploy

### Prospector
- Iniciar jornada.
- Iniciar una visita y marcar `SÍ` en visita exitosa.
- Abrir los 4 acordeones: Cliente, Dirección, Ubicación y Documentos.
- Verificar obligatorios: Subcanal, DNI Cliente, Razón Social, Teléfono Celular 1, Dirección, DNI/CE frente, DNI/CE atrás, Recibo/Contrato y Foto de local.
- Verificar Locación Comercial → Ruta dependiente.
- Marcar ubicación y comprobar dirección + latitud + longitud.
- Finalizar visita.

### Administrador
- Entrar a `Carga de bases`.
- Verificar carga Excel de Usuarios.
- Verificar carga Excel de Rutas por Locación.
- Confirmar que la carga de Rutas reemplaza el maestro y actualiza los desplegables de Prospector.

### Supervisor
- Verificar que Seguimiento y Validación ya no muestran filtro de Locación.
- Confirmar que visualiza Prospectores de toda su Región.

### Validador
- Verificar menú: Inicio de Jornada, Fin de Jornada, Avance de Prospectores.
- Confirmar que no existe Registro de Visitas.
- Revisar KPIs: Prospectores, Altas, Altas registradas, Altas pendientes y Productividad de registro.
- Marcar y desmarcar `¿Registrado?` y verificar que los KPIs se actualizan.
- Abrir documentos/evidencias desde las miniaturas.

---

## Actualizaciones futuras

Para cambios solamente de frontend, normalmente bastará con volver a compilar y desplegar Netlify.

Si una futura versión incluye un nuevo archivo SQL de migración, primero se ejecutará esa migración en Supabase y después se publicará el frontend en Netlify.

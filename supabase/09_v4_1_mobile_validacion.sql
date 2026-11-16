-- PROSPECTA | RTM v4.1
-- Ejecutar una sola vez DESPUÉS de 08_v4_0_coordinador_mapas_salidas.sql.
-- Mobile-first, doble evidencia de alta y validación de visitas por Supervisor.

-- 1) Segunda evidencia del Prospector: interior del punto de venta.
alter table public."BBDD_VISITAS"
  add column if not exists "FOTO_INTERIOR" text not null default '';

-- 2) Fachadas con URL directa para la base del Administrador.
-- Los nombres de archivo siguen siendo no predecibles y las escrituras continúan protegidas por RLS.
update storage.buckets
set public=true,
    file_size_limit=10485760,
    allowed_mime_types=array['image/jpeg','image/png','image/webp']
where id='fachadas';

-- 3) Validación de visita en campo realizada por Supervisor.
create table if not exists public."BBDD_VALIDACION_VISITA_SUPERVISOR" (
  id uuid primary key default gen_random_uuid(),
  "FECHA" date not null,
  "VISITA_ID" uuid not null unique references public."BBDD_VISITAS"(id) on delete cascade,
  "SUPERVISOR_USUARIO" text not null references public."USUARIOS"("USUARIO"),
  "PROSPECTOR_USUARIO" text not null references public."USUARIOS"("USUARIO"),
  "DNI_CLIENTE" text not null,
  "SUBCANAL" text not null,
  "FOTO_FACHADA" text not null default '',
  "VALIDACION_DNI" text not null default '' check ("VALIDACION_DNI" in ('','SI','NO')),
  "FOTO_DNI" text not null default '',
  "UBICACION_MARCADA" boolean not null default false,
  "SUPERVISOR_LAT" double precision,
  "SUPERVISOR_LONG" double precision,
  "DISTANCIA_M" numeric(10,2),
  "UBICACION_CORRECTA" text not null default '' check ("UBICACION_CORRECTA" in ('','SI','NO')),
  "SUBCANAL_CORRECTO" text not null default '' check ("SUBCANAL_CORRECTO" in ('','SI','NO')),
  "REGION" text not null,
  "LOCACION" text not null,
  "CREATED_AT" timestamptz not null default now(),
  "UPDATED_AT" timestamptz not null default now()
);

create index if not exists idx_validacion_sup_fecha_locacion on public."BBDD_VALIDACION_VISITA_SUPERVISOR"("FECHA","REGION","LOCACION");
create index if not exists idx_validacion_sup_supervisor_fecha on public."BBDD_VALIDACION_VISITA_SUPERVISOR"("SUPERVISOR_USUARIO","FECHA");

grant select, insert, update on public."BBDD_VALIDACION_VISITA_SUPERVISOR" to authenticated;
alter table public."BBDD_VALIDACION_VISITA_SUPERVISOR" enable row level security;

drop policy if exists validacion_sup_select on public."BBDD_VALIDACION_VISITA_SUPERVISOR";
create policy validacion_sup_select on public."BBDD_VALIDACION_VISITA_SUPERVISOR" for select to authenticated
using (
  public.current_app_role()='Administrador'
  or (
    public.current_app_role()='Supervisor'
    and "REGION"=public.current_app_region()
    and "LOCACION"=public.current_app_location()
  )
);

drop policy if exists validacion_sup_insert on public."BBDD_VALIDACION_VISITA_SUPERVISOR";
create policy validacion_sup_insert on public."BBDD_VALIDACION_VISITA_SUPERVISOR" for insert to authenticated
with check (
  public.current_app_role()='Supervisor'
  and "SUPERVISOR_USUARIO"=public.current_app_usuario()
  and "REGION"=public.current_app_region()
  and "LOCACION"=public.current_app_location()
);

drop policy if exists validacion_sup_update on public."BBDD_VALIDACION_VISITA_SUPERVISOR";
create policy validacion_sup_update on public."BBDD_VALIDACION_VISITA_SUPERVISOR" for update to authenticated
using (
  public.current_app_role()='Supervisor'
  and "SUPERVISOR_USUARIO"=public.current_app_usuario()
  and "REGION"=public.current_app_region()
  and "LOCACION"=public.current_app_location()
)
with check (
  public.current_app_role()='Supervisor'
  and "SUPERVISOR_USUARIO"=public.current_app_usuario()
  and "REGION"=public.current_app_region()
  and "LOCACION"=public.current_app_location()
);

-- 4) Foto de DNI validada en campo: bucket privado.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('dni-supervisor','dni-supervisor',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists dni_supervisor_insert on storage.objects;
create policy dni_supervisor_insert on storage.objects for insert to authenticated
with check (
  bucket_id='dni-supervisor'
  and public.current_app_role()='Supervisor'
  and (storage.foldername(name))[1]=public.current_app_usuario()
);

drop policy if exists dni_supervisor_select on storage.objects;
create policy dni_supervisor_select on storage.objects for select to authenticated
using (
  bucket_id='dni-supervisor'
  and (
    public.current_app_role()='Administrador'
    or (public.current_app_role()='Supervisor' and (storage.foldername(name))[1]=public.current_app_usuario())
  )
);

drop policy if exists dni_supervisor_update on storage.objects;
create policy dni_supervisor_update on storage.objects for update to authenticated
using (bucket_id='dni-supervisor' and public.current_app_role()='Supervisor' and (storage.foldername(name))[1]=public.current_app_usuario())
with check (bucket_id='dni-supervisor' and public.current_app_role()='Supervisor' and (storage.foldername(name))[1]=public.current_app_usuario());

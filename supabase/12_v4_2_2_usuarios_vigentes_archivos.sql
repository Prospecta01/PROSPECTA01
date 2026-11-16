-- PROSPECTA | RTM v4.2.2
-- Usuarios vigentes por última plantilla + Celular + último archivo descargable.
-- Ejecutar una sola vez DESPUÉS de 11_v4_2_1_supervisor_region_locacion.sql.

alter table public."USUARIOS"
  add column if not exists "CELULAR" text not null default '',
  add column if not exists "EN_PLANTILLA_VIGENTE" boolean not null default true;

create index if not exists idx_usuarios_plantilla_vigente on public."USUARIOS"("EN_PLANTILLA_VIGENTE","STATUS","ROL");

create table if not exists public."ADMIN_BASE_FILES" (
  "BASE_KEY" text primary key,
  "FILE_NAME" text not null,
  "STORAGE_PATH" text not null,
  "UPDATED_AT" timestamptz not null default now()
);

grant select,insert,update on public."ADMIN_BASE_FILES" to authenticated;
alter table public."ADMIN_BASE_FILES" enable row level security;
drop policy if exists admin_base_files_admin on public."ADMIN_BASE_FILES";
create policy admin_base_files_admin on public."ADMIN_BASE_FILES" for all to authenticated
using (public.current_app_role()='Administrador')
with check (public.current_app_role()='Administrador');

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('admin-maestros','admin-maestros',false,10485760,array['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists admin_maestros_select on storage.objects;
create policy admin_maestros_select on storage.objects for select to authenticated
using (bucket_id='admin-maestros' and public.current_app_role()='Administrador');
drop policy if exists admin_maestros_insert on storage.objects;
create policy admin_maestros_insert on storage.objects for insert to authenticated
with check (bucket_id='admin-maestros' and public.current_app_role()='Administrador');
drop policy if exists admin_maestros_update on storage.objects;
create policy admin_maestros_update on storage.objects for update to authenticated
using (bucket_id='admin-maestros' and public.current_app_role()='Administrador')
with check (bucket_id='admin-maestros' and public.current_app_role()='Administrador');
drop policy if exists admin_maestros_delete on storage.objects;
create policy admin_maestros_delete on storage.objects for delete to authenticated
using (bucket_id='admin-maestros' and public.current_app_role()='Administrador');

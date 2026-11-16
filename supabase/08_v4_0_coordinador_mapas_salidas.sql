-- PROSPECTA | RTM v4.0
-- Ejecutar una sola vez en Supabase > SQL Editor ANTES de desplegar el frontend v4.0.

-- 1) Nuevo rol y Coordinador Regional sin locación obligatoria.
alter table public."USUARIOS" alter column "LOCACION" drop not null;

do $$
declare c_name text;
begin
  select c.conname into c_name
  from pg_constraint c
  join pg_class t on t.oid=c.conrelid
  join pg_namespace n on n.oid=t.relnamespace
  where n.nspname='public' and t.relname='USUARIOS' and c.contype='c'
    and pg_get_constraintdef(c.oid) ilike '%ROL%'
  limit 1;
  if c_name is not null then execute format('alter table public."USUARIOS" drop constraint %I', c_name); end if;
end $$;
alter table public."USUARIOS" add constraint "USUARIOS_ROL_check"
check ("ROL" in ('Prospector','Supervisor','Coordinador Regional','Administrador','Desarrollador'));

-- Mantener el perfil histórico cuando se elimina el usuario de Supabase Auth.
do $$
declare c_name text;
begin
  select c.conname into c_name
  from pg_constraint c
  join pg_class t on t.oid=c.conrelid
  join pg_namespace n on n.oid=t.relnamespace
  where n.nspname='public' and t.relname='USUARIOS' and c.contype='f'
    and pg_get_constraintdef(c.oid) ilike '%UID_AUTH%'
  limit 1;
  if c_name is not null then execute format('alter table public."USUARIOS" drop constraint %I', c_name); end if;
end $$;
alter table public."USUARIOS" add constraint "USUARIOS_UID_AUTH_fkey"
foreign key ("UID_AUTH") references auth.users(id) on delete set null;

-- 2) GPS de Inicio / Fin de jornada y clasificación de salida.
alter table public."BBDD_INICIO_JORNADA"
  add column if not exists "LATITUD" double precision,
  add column if not exists "LONGITUD" double precision,
  add column if not exists "ACCURACY_M" integer,
  add column if not exists "STATUS_UBICACION" text;

alter table public."BBDD_FIN_JORNADA"
  add column if not exists "CLASIFICACION_FIN" text not null default '',
  add column if not exists "LATITUD" double precision,
  add column if not exists "LONGITUD" double precision,
  add column if not exists "ACCURACY_M" integer,
  add column if not exists "STATUS_UBICACION" text;

update public."BBDD_FIN_JORNADA"
set "CLASIFICACION_FIN" = case
  when "HORA_FIN" < time '17:00' then 'Salida Anticipada'
  when "HORA_FIN" <= time '17:15' then 'Salida Puntual'
  else 'Salida Tardía'
end
where btrim(coalesce("CLASIFICACION_FIN",''))='';

-- 3) Scope seguro: Supervisor = su locación; Coordinador Regional = su región.
create or replace function public.current_app_location() returns text
language sql stable security definer set search_path=public as $$
  select "LOCACION" from public."USUARIOS"
  where "UID_AUTH" = auth.uid() and "STATUS" = 'ACTIVO' limit 1
$$;
revoke all on function public.current_app_location() from public;
grant execute on function public.current_app_location() to authenticated;

create or replace function public.can_read_usuario(target_usuario text) returns boolean
language sql stable security definer set search_path=public as $$
  select case
    when public.current_app_role() = 'Administrador' then true
    when public.current_app_usuario() = target_usuario then true
    when public.current_app_role() = 'Supervisor' then exists (
      select 1 from public."USUARIOS" u
      where u."USUARIO" = target_usuario
        and u."REGION" = public.current_app_region()
        and u."LOCACION" = public.current_app_location()
        and u."ROL" = 'Prospector'
    )
    when public.current_app_role() = 'Coordinador Regional' then exists (
      select 1 from public."USUARIOS" u
      where u."USUARIO" = target_usuario
        and u."REGION" = public.current_app_region()
        and u."ROL" = 'Prospector'
    )
    else false end
$$;
revoke all on function public.can_read_usuario(text) from public;
grant execute on function public.can_read_usuario(text) to authenticated;

drop policy if exists usuarios_select on public."USUARIOS";
create policy usuarios_select on public."USUARIOS" for select to authenticated
using (
  public.current_app_usuario() = "USUARIO"
  or public.current_app_role() = 'Administrador'
  or (public.current_app_role() = 'Supervisor' and "REGION" = public.current_app_region() and "LOCACION" = public.current_app_location() and "ROL" = 'Prospector')
  or (public.current_app_role() = 'Coordinador Regional' and "REGION" = public.current_app_region() and "ROL" = 'Prospector')
);

-- 4) Opciones de filtros: Supervisor su locación; Coordinador toda su región.
create or replace function public.get_active_dashboard_scope_options()
returns table(region text, locacion text)
language plpgsql stable security definer set search_path=public as $$
declare caller_role text; caller_region text; caller_location text;
begin
  caller_role := public.current_app_role();
  caller_region := public.current_app_region();
  caller_location := public.current_app_location();
  if caller_role not in ('Supervisor','Coordinador Regional','Desarrollador','Administrador') then raise exception 'No autorizado'; end if;
  return query
  select distinct btrim(u."REGION")::text, btrim(u."LOCACION")::text
  from public."USUARIOS" u
  where u."STATUS"='ACTIVO'
    and nullif(btrim(u."REGION"),'') is not null
    and nullif(btrim(u."LOCACION"),'') is not null
    and lower(btrim(u."LOCACION")) <> lower('La Molina')
    and (caller_role not in ('Supervisor','Coordinador Regional') or u."REGION"=caller_region)
    and (caller_role <> 'Supervisor' or u."LOCACION"=caller_location)
  order by 1,2;
end;
$$;
revoke all on function public.get_active_dashboard_scope_options() from public;
grant execute on function public.get_active_dashboard_scope_options() to authenticated;

-- 5) Grants de las nuevas columnas se heredan de los grants de tabla existentes.

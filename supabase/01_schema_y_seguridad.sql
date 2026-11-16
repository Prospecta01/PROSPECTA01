-- PROSPECTA | RTM - Supabase
-- Ejecutar COMPLETO en: Supabase > SQL Editor > New query > Run

create extension if not exists pgcrypto;

create table if not exists public."USUARIOS" (
  "USUARIO" text primary key,
  "UID_AUTH" uuid unique references auth.users(id) on delete cascade,
  "NOMBRE" text not null,
  "APELLIDO" text not null,
  "REGION" text not null,
  "LOCACION" text not null,
  "ROL" text not null check ("ROL" in ('Prospector','Supervisor','Administrador','Desarrollador')),
  "STATUS" text not null default 'ACTIVO' check ("STATUS" in ('ACTIVO','INACTIVO')),
  "EMAIL_AUTH" text,
  "CREATED_AT" timestamptz not null default now(),
  "UPDATED_AT" timestamptz not null default now()
);


-- Si el esquema ya existía antes de incorporar el rol Desarrollador, actualiza el CHECK de ROL.
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
  if c_name is not null then
    execute format('alter table public."USUARIOS" drop constraint %I', c_name);
  end if;
end $$;
alter table public."USUARIOS" add constraint "USUARIOS_ROL_check" check ("ROL" in ('Prospector','Supervisor','Administrador','Desarrollador'));

create table if not exists public."BBDD_INICIO_JORNADA" (
  id uuid primary key default gen_random_uuid(),
  "FECHA" date not null,
  "USUARIO" text not null references public."USUARIOS"("USUARIO"),
  "HORA_INICIO" time not null,
  "CLASIFICACION_INGRESO" text not null,
  "REGION" text not null,
  "LOCACION" text not null,
  "CREATED_AT" timestamptz not null default now(),
  unique ("FECHA", "USUARIO")
);

create table if not exists public."BBDD_VISITAS" (
  id uuid primary key default gen_random_uuid(),
  "FECHA" date not null,
  "USUARIO" text not null references public."USUARIOS"("USUARIO"),
  "HORA_INICIO_VISITA" time not null,
  "HORA_FIN_VISITA" time,
  "INICIO_ISO" timestamptz not null,
  "FIN_ISO" timestamptz,
  "UBICACION_GPS" text,
  "LATITUD" double precision,
  "LONGITUD" double precision,
  "ACCURACY_M" integer,
  "CLIENTE_EXITOSO" text not null default '',
  "MOTIVO" text not null default '',
  "DNI_CLIENTE" text not null default '',
  "SUBCANAL" text not null default '',
  "DIRECCION_CLIENTE" text not null default '',
  "FOTO_FACHADA" text not null default '',
  "DURACION_VISITA" integer,
  "STATUS_UBICACION" text,
  "ESTADO" text not null default 'EN_CURSO' check ("ESTADO" in ('EN_CURSO','FINALIZADA')),
  "REGION" text not null,
  "LOCACION" text not null,
  "CREATED_AT" timestamptz not null default now(),
  "UPDATED_AT" timestamptz
);

create table if not exists public."BBDD_FIN_JORNADA" (
  id uuid primary key default gen_random_uuid(),
  "FECHA" date not null,
  "USUARIO" text not null references public."USUARIOS"("USUARIO"),
  "HORA_FIN" time not null,
  "REGION" text not null,
  "LOCACION" text not null,
  "CREATED_AT" timestamptz not null default now(),
  unique ("FECHA", "USUARIO")
);


create table if not exists public."BBDD_INICIO_JORNADA_DESARROLLADOR" (
  id uuid primary key default gen_random_uuid(),
  "FECHA" date not null,
  "USUARIO" text not null references public."USUARIOS"("USUARIO"),
  "HORA_INICIO" time not null,
  "CLASIFICACION_INGRESO" text not null,
  "REGION" text not null,
  "LOCACION" text not null,
  "CREATED_AT" timestamptz not null default now(),
  unique ("FECHA", "USUARIO")
);

create table if not exists public."BBDD_VISITAS_DESARROLLADOR" (
  id uuid primary key default gen_random_uuid(),
  "FECHA" date not null,
  "USUARIO_DESARROLLADOR" text not null references public."USUARIOS"("USUARIO"),
  "HORA_INICIO_VISITA" time not null,
  "HORA_FIN_VISITA" time,
  "INICIO_ISO" timestamptz not null,
  "FIN_ISO" timestamptz,
  "UBICACION_GPS" text,
  "LATITUD" double precision,
  "LONGITUD" double precision,
  "ACCURACY_M" integer,
  "STATUS_UBICACION" text,
  "CODIGO_CLIENTE" text not null default '',
  "BONO_ENTREGADO" text not null default '' check ("BONO_ENTREGADO" in ('','SI','NO')),
  "TIPO_BONO" text not null default '' check ("TIPO_BONO" in ('','DINERO_EFECTIVO','NOTA_CREDITO')),
  "FOTO_ENTREGA_DINERO" text not null default '',
  "CODIGO_NOTA_CREDITO" text not null default '',
  "COMENTARIO_NO_BONO" text not null default '',
  "DURACION_VISITA" integer,
  "ESTADO" text not null default 'EN_CURSO' check ("ESTADO" in ('EN_CURSO','FINALIZADA')),
  "REGION" text not null,
  "LOCACION" text not null,
  "CREATED_AT" timestamptz not null default now(),
  "UPDATED_AT" timestamptz
);


create table if not exists public."BBDD_FIN_JORNADA_DESARROLLADOR" (
  id uuid primary key default gen_random_uuid(),
  "FECHA" date not null,
  "USUARIO" text not null references public."USUARIOS"("USUARIO"),
  "HORA_INICIO" time not null,
  "HORA_FIN" time not null,
  "DURACION_JORNADA" integer not null default 0,
  "REGION" text not null,
  "LOCACION" text not null,
  "CREATED_AT" timestamptz not null default now(),
  unique ("FECHA", "USUARIO")
);

create table if not exists public."CONTACTOS" (
  id uuid primary key default gen_random_uuid(),
  "NOMBRE" text not null,
  "CARGO" text,
  "TELEFONO" text,
  "EMAIL" text,
  "REGION" text,
  "LOCACION" text,
  "ORDEN" integer not null default 100,
  "ACTIVO" boolean not null default true,
  "CREATED_AT" timestamptz not null default now()
);


-- Compatibilidad: si la tabla ya existía, incorpora el comentario sin borrar datos.
alter table public."BBDD_VISITAS_DESARROLLADOR"
  add column if not exists "COMENTARIO_NO_BONO" text not null default '';

-- Permisos de API; RLS sigue siendo la capa que decide qué filas puede ver cada sesión.
grant usage on schema public to authenticated;
grant select on public."USUARIOS" to authenticated;
grant select, insert on public."BBDD_INICIO_JORNADA" to authenticated;
grant select, insert, update on public."BBDD_VISITAS" to authenticated;
grant select, insert on public."BBDD_FIN_JORNADA" to authenticated;

-- Regla condicional de cierre de visita del Desarrollador.
-- NO => comentario obligatorio. SI + efectivo => foto. SI + nota => código de nota.
-- Preserva registros históricos de versiones previas que no tenían este campo.
update public."BBDD_VISITAS_DESARROLLADOR"
set "COMENTARIO_NO_BONO"='Registro previo a v3.2: motivo no registrado'
where "ESTADO"='FINALIZADA' and "BONO_ENTREGADO"='NO' and btrim(coalesce("COMENTARIO_NO_BONO",''))='';

alter table public."BBDD_VISITAS_DESARROLLADOR" drop constraint if exists "DEV_VISITA_FINALIZADA_check";
alter table public."BBDD_VISITAS_DESARROLLADOR" add constraint "DEV_VISITA_FINALIZADA_check" check (
  "ESTADO"='EN_CURSO' or (
    btrim("CODIGO_CLIENTE")<>'' and
    (
      ("BONO_ENTREGADO"='NO' and "TIPO_BONO"='' and "FOTO_ENTREGA_DINERO"='' and "CODIGO_NOTA_CREDITO"='' and btrim("COMENTARIO_NO_BONO")<>'') or
      ("BONO_ENTREGADO"='SI' and "TIPO_BONO"='DINERO_EFECTIVO' and btrim("FOTO_ENTREGA_DINERO")<>'' and "CODIGO_NOTA_CREDITO"='' and "COMENTARIO_NO_BONO"='') or
      ("BONO_ENTREGADO"='SI' and "TIPO_BONO"='NOTA_CREDITO' and "FOTO_ENTREGA_DINERO"='' and btrim("CODIGO_NOTA_CREDITO")<>'' and "COMENTARIO_NO_BONO"='')
    )
  )
);

grant select, insert on public."BBDD_INICIO_JORNADA_DESARROLLADOR" to authenticated;
grant select, insert, update on public."BBDD_VISITAS_DESARROLLADOR" to authenticated;
grant select, insert on public."BBDD_FIN_JORNADA_DESARROLLADOR" to authenticated;
grant select on public."CONTACTOS" to authenticated;

create index if not exists idx_inicio_fecha_usuario on public."BBDD_INICIO_JORNADA"("FECHA","USUARIO");
create index if not exists idx_inicio_region_fecha on public."BBDD_INICIO_JORNADA"("REGION","FECHA");
create index if not exists idx_visitas_fecha_usuario on public."BBDD_VISITAS"("FECHA","USUARIO");
create index if not exists idx_visitas_region_fecha on public."BBDD_VISITAS"("REGION","FECHA");
create index if not exists idx_visitas_estado_usuario on public."BBDD_VISITAS"("ESTADO","USUARIO");
create index if not exists idx_fin_fecha_usuario on public."BBDD_FIN_JORNADA"("FECHA","USUARIO");
create index if not exists idx_dev_inicio_fecha_usuario on public."BBDD_INICIO_JORNADA_DESARROLLADOR"("FECHA","USUARIO");
create index if not exists idx_dev_visitas_fecha_usuario on public."BBDD_VISITAS_DESARROLLADOR"("FECHA","USUARIO_DESARROLLADOR");
create index if not exists idx_dev_visitas_cliente_fecha on public."BBDD_VISITAS_DESARROLLADOR"("CODIGO_CLIENTE","FECHA");
create index if not exists idx_dev_visitas_estado_usuario on public."BBDD_VISITAS_DESARROLLADOR"("ESTADO","USUARIO_DESARROLLADOR");
create index if not exists idx_dev_fin_fecha_usuario on public."BBDD_FIN_JORNADA_DESARROLLADOR"("FECHA","USUARIO");

-- Helpers para RLS. SECURITY DEFINER evita recursión de políticas sobre USUARIOS.
create or replace function public.current_app_usuario() returns text
language sql stable security definer set search_path=public as $$
  select "USUARIO" from public."USUARIOS"
  where "UID_AUTH" = auth.uid() and "STATUS" = 'ACTIVO' limit 1
$$;

create or replace function public.current_app_role() returns text
language sql stable security definer set search_path=public as $$
  select "ROL" from public."USUARIOS"
  where "UID_AUTH" = auth.uid() and "STATUS" = 'ACTIVO' limit 1
$$;

create or replace function public.current_app_region() returns text
language sql stable security definer set search_path=public as $$
  select "REGION" from public."USUARIOS"
  where "UID_AUTH" = auth.uid() and "STATUS" = 'ACTIVO' limit 1
$$;

create or replace function public.can_read_usuario(target_usuario text) returns boolean
language sql stable security definer set search_path=public as $$
  select case
    when public.current_app_role() = 'Administrador' then true
    when public.current_app_usuario() = target_usuario then true
    when public.current_app_role() = 'Supervisor' then exists (
      select 1 from public."USUARIOS" u
      where u."USUARIO" = target_usuario
        and u."REGION" = public.current_app_region()
        and u."ROL" = 'Prospector'
    )
    else false end
$$;

revoke all on function public.current_app_usuario() from public;
revoke all on function public.current_app_role() from public;
revoke all on function public.current_app_region() from public;
revoke all on function public.can_read_usuario(text) from public;
grant execute on function public.current_app_usuario() to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.current_app_region() to authenticated;
grant execute on function public.can_read_usuario(text) to authenticated;

-- Dashboard nacional de Prospectores visible para el rol Desarrollador.
-- Se expone como RPC SECURITY DEFINER para entregar solo el consolidado necesario,
-- sin abrir acceso directo del Desarrollador a las tablas operativas de Prospectores.
create or replace function public.get_developer_prospector_progress(
  p_fecha_desde date default null,
  p_fecha_hasta date default null,
  p_region text default null,
  p_locacion text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  caller_role text;
  result jsonb;
  v_desde date := coalesce(p_fecha_desde, ((now() at time zone 'America/Lima')::date));
  v_hasta date := coalesce(p_fecha_hasta, coalesce(p_fecha_desde, ((now() at time zone 'America/Lima')::date)));
begin
  caller_role := public.current_app_role();
  if caller_role not in ('Desarrollador','Administrador') then
    raise exception 'No autorizado';
  end if;
  if v_hasta < v_desde then
    raise exception 'Rango de fechas inválido';
  end if;

  with prospectors as (
    select u."USUARIO",u."NOMBRE",u."APELLIDO",u."REGION",u."LOCACION"
    from public."USUARIOS" u
    where u."ROL"='Prospector' and u."STATUS"='ACTIVO'
      and (p_region is null or p_region='' or u."REGION"=p_region)
      and (p_locacion is null or p_locacion='' or u."LOCACION"=p_locacion)
  ),
  starts as (
    select s.*
    from public."BBDD_INICIO_JORNADA" s
    join prospectors p on p."USUARIO"=s."USUARIO"
    where s."FECHA" between v_desde and v_hasta
  ),
  visits as (
    select v.*
    from public."BBDD_VISITAS" v
    join prospectors p on p."USUARIO"=v."USUARIO"
    where v."FECHA" between v_desde and v_hasta and v."ESTADO"='FINALIZADA'
  ),
  active_days as (
    select case when v_desde=v_hasta then 1 else count(distinct fecha)::int end as days
    from (
      select "FECHA" as fecha from starts
      union
      select "FECHA" as fecha from visits
    ) d
  ),
  start_agg as (
    select s."USUARIO",
      count(distinct s."FECHA")::int as attendance_days,
      max(s."CLASIFICACION_INGRESO") filter (where s."FECHA"=v_desde) as exact_classification,
      min(s."HORA_INICIO") as first_time
    from starts s
    group by s."USUARIO"
  ),
  visit_agg as (
    select v."USUARIO",count(v.id)::int as visitas,
      count(v.id) filter (where v."CLIENTE_EXITOSO"='SI')::int as altas
    from visits v
    group by v."USUARIO"
  ),
  team_rows as (
    select p."USUARIO" as usuario,
      btrim(coalesce(p."NOMBRE",'')||' '||coalesce(p."APELLIDO",'')) as nombre,
      p."REGION" as region,p."LOCACION" as locacion,
      case
        when v_desde=v_hasta then coalesce(replace(sa.exact_classification,'Ingreso ',''),'Sin registro')
        when coalesce(ad.days,0)=0 then '0%'
        else concat(round((coalesce(sa.attendance_days,0)::numeric/ad.days::numeric)*100)::int,'%')
      end as asistencia,
      coalesce(to_char(sa.first_time,'HH24:MI'),'--:--') as "horaInicio",
      coalesce(va.visitas,0)::int as visitas,
      coalesce(va.altas,0)::int as altas,
      coalesce(sa.attendance_days,0)::int as attendance_days,
      coalesce(ad.days,0)::int as active_days
    from prospectors p
    cross join active_days ad
    left join start_agg sa on sa."USUARIO"=p."USUARIO"
    left join visit_agg va on va."USUARIO"=p."USUARIO"
  ),
  team_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'usuario',usuario,'nombre',nombre,'region',region,'locacion',locacion,
      'asistencia',asistencia,'horaInicio',"horaInicio",'visitas',visitas,'altas',altas,
      'conversion',case when visitas>0 then round((altas::numeric/visitas::numeric)*100)::int else 0 end
    ) order by nombre),'[]'::jsonb) as value
    from team_rows
  ),
  kpi as (
    select jsonb_build_object(
      'prospectores',count(*)::int,
      'asistenciaPct',case when count(*)>0 and max(active_days)>0 then least(100,round((sum(attendance_days)::numeric/(count(*)::numeric*max(active_days)::numeric))*100)::int) else 0 end,
      'visitas',coalesce(sum(visitas),0)::int,
      'altas',coalesce(sum(altas),0)::int,
      'conversion',case when coalesce(sum(visitas),0)>0 then round((sum(altas)::numeric/sum(visitas)::numeric)*100)::int else 0 end
    ) as value
    from team_rows
  ),
  days as (
    select d::date as fecha from generate_series(greatest(v_desde,v_hasta-13),v_hasta,interval '1 day') d
  ),
  week_rows as (
    select d.fecha,to_char(d.fecha,'DD/MM') as dia,
      count(v.id)::int as visitas,
      count(v.id) filter (where v."CLIENTE_EXITOSO"='SI')::int as altas
    from days d
    left join visits v on v."FECHA"=d.fecha
    group by d.fecha order by d.fecha
  ),
  week_json as (
    select coalesce(jsonb_agg(jsonb_build_object('dia',dia,'visitas',visitas,'altas',altas) order by fecha),'[]'::jsonb) as value
    from week_rows
  )
  select jsonb_build_object('kpis',kpi.value,'team',team_json.value,'week',week_json.value)
  into result from kpi,team_json,week_json;
  return result;
end;
$$;

revoke all on function public.get_developer_prospector_progress(date,date,text,text) from public;
grant execute on function public.get_developer_prospector_progress(date,date,text,text) to authenticated;

alter table public."USUARIOS" enable row level security;
alter table public."BBDD_INICIO_JORNADA" enable row level security;
alter table public."BBDD_VISITAS" enable row level security;
alter table public."BBDD_FIN_JORNADA" enable row level security;
alter table public."BBDD_INICIO_JORNADA_DESARROLLADOR" enable row level security;
alter table public."BBDD_VISITAS_DESARROLLADOR" enable row level security;
alter table public."BBDD_FIN_JORNADA_DESARROLLADOR" enable row level security;
alter table public."CONTACTOS" enable row level security;

-- Re-crear políticas de forma idempotente.
drop policy if exists usuarios_select on public."USUARIOS";
create policy usuarios_select on public."USUARIOS" for select to authenticated
using (
  public.current_app_usuario() = "USUARIO"
  or public.current_app_role() = 'Administrador'
  or (public.current_app_role() = 'Supervisor' and "REGION" = public.current_app_region() and "ROL" = 'Prospector')
);

drop policy if exists inicio_select on public."BBDD_INICIO_JORNADA";
create policy inicio_select on public."BBDD_INICIO_JORNADA" for select to authenticated
using (public.can_read_usuario("USUARIO"));
drop policy if exists inicio_insert on public."BBDD_INICIO_JORNADA";
create policy inicio_insert on public."BBDD_INICIO_JORNADA" for insert to authenticated
with check (public.current_app_usuario() = "USUARIO");

drop policy if exists visitas_select on public."BBDD_VISITAS";
create policy visitas_select on public."BBDD_VISITAS" for select to authenticated
using (public.can_read_usuario("USUARIO"));
drop policy if exists visitas_insert on public."BBDD_VISITAS";
create policy visitas_insert on public."BBDD_VISITAS" for insert to authenticated
with check (public.current_app_usuario() = "USUARIO");
drop policy if exists visitas_update on public."BBDD_VISITAS";
create policy visitas_update on public."BBDD_VISITAS" for update to authenticated
using (public.current_app_usuario() = "USUARIO")
with check (public.current_app_usuario() = "USUARIO");

drop policy if exists fin_select on public."BBDD_FIN_JORNADA";
create policy fin_select on public."BBDD_FIN_JORNADA" for select to authenticated
using (public.can_read_usuario("USUARIO"));
drop policy if exists fin_insert on public."BBDD_FIN_JORNADA";
create policy fin_insert on public."BBDD_FIN_JORNADA" for insert to authenticated
with check (public.current_app_usuario() = "USUARIO");



drop policy if exists dev_inicio_select on public."BBDD_INICIO_JORNADA_DESARROLLADOR";
create policy dev_inicio_select on public."BBDD_INICIO_JORNADA_DESARROLLADOR" for select to authenticated
using (public.current_app_role()='Administrador' or (public.current_app_role()='Desarrollador' and public.current_app_usuario()="USUARIO"));
drop policy if exists dev_inicio_insert on public."BBDD_INICIO_JORNADA_DESARROLLADOR";
create policy dev_inicio_insert on public."BBDD_INICIO_JORNADA_DESARROLLADOR" for insert to authenticated
with check (public.current_app_role()='Desarrollador' and public.current_app_usuario()="USUARIO");

drop policy if exists dev_visitas_select on public."BBDD_VISITAS_DESARROLLADOR";
create policy dev_visitas_select on public."BBDD_VISITAS_DESARROLLADOR" for select to authenticated
using (public.current_app_role()='Administrador' or (public.current_app_role()='Desarrollador' and public.current_app_usuario()="USUARIO_DESARROLLADOR"));
drop policy if exists dev_visitas_insert on public."BBDD_VISITAS_DESARROLLADOR";
create policy dev_visitas_insert on public."BBDD_VISITAS_DESARROLLADOR" for insert to authenticated
with check (public.current_app_role()='Desarrollador' and public.current_app_usuario()="USUARIO_DESARROLLADOR");
drop policy if exists dev_visitas_update on public."BBDD_VISITAS_DESARROLLADOR";
create policy dev_visitas_update on public."BBDD_VISITAS_DESARROLLADOR" for update to authenticated
using (public.current_app_role()='Desarrollador' and public.current_app_usuario()="USUARIO_DESARROLLADOR")
with check (public.current_app_role()='Desarrollador' and public.current_app_usuario()="USUARIO_DESARROLLADOR");

drop policy if exists dev_fin_select on public."BBDD_FIN_JORNADA_DESARROLLADOR";
create policy dev_fin_select on public."BBDD_FIN_JORNADA_DESARROLLADOR" for select to authenticated
using (public.current_app_role()='Administrador' or (public.current_app_role()='Desarrollador' and public.current_app_usuario()="USUARIO"));
drop policy if exists dev_fin_insert on public."BBDD_FIN_JORNADA_DESARROLLADOR";
create policy dev_fin_insert on public."BBDD_FIN_JORNADA_DESARROLLADOR" for insert to authenticated
with check (public.current_app_role()='Desarrollador' and public.current_app_usuario()="USUARIO");

drop policy if exists contactos_select on public."CONTACTOS";
create policy contactos_select on public."CONTACTOS" for select to authenticated
using (public.current_app_usuario() is not null and "ACTIVO" = true);

-- Storage privado para fachadas.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fachadas','fachadas',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=10485760,
allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists fachadas_insert on storage.objects;
create policy fachadas_insert on storage.objects for insert to authenticated
with check (bucket_id='fachadas' and (storage.foldername(name))[1] = public.current_app_usuario());

drop policy if exists fachadas_select on storage.objects;
create policy fachadas_select on storage.objects for select to authenticated
using (bucket_id='fachadas' and public.can_read_usuario((storage.foldername(name))[1]));

drop policy if exists fachadas_update on storage.objects;
create policy fachadas_update on storage.objects for update to authenticated
using (bucket_id='fachadas' and (storage.foldername(name))[1] = public.current_app_usuario())
with check (bucket_id='fachadas' and (storage.foldername(name))[1] = public.current_app_usuario());



-- Storage privado para evidencia de bonos en efectivo entregados por Desarrolladores.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bonos-desarrollador','bonos-desarrollador',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=10485760,
allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists bonos_desarrollador_insert on storage.objects;
create policy bonos_desarrollador_insert on storage.objects for insert to authenticated
with check (bucket_id='bonos-desarrollador' and public.current_app_role()='Desarrollador' and (storage.foldername(name))[1] = public.current_app_usuario());

drop policy if exists bonos_desarrollador_select on storage.objects;
create policy bonos_desarrollador_select on storage.objects for select to authenticated
using (bucket_id='bonos-desarrollador' and (public.current_app_role()='Administrador' or (storage.foldername(name))[1] = public.current_app_usuario()));

drop policy if exists bonos_desarrollador_update on storage.objects;
create policy bonos_desarrollador_update on storage.objects for update to authenticated
using (bucket_id='bonos-desarrollador' and public.current_app_role()='Desarrollador' and (storage.foldername(name))[1] = public.current_app_usuario())
with check (bucket_id='bonos-desarrollador' and public.current_app_role()='Desarrollador' and (storage.foldername(name))[1] = public.current_app_usuario());

-- Contactos de ejemplo opcionales. Puedes editarlos luego desde Table Editor.
insert into public."CONTACTOS" ("NOMBRE","CARGO","REGION","LOCACION","ORDEN")
select 'Supervisor de zona','Supervisor',null,null,10
where not exists (select 1 from public."CONTACTOS" where "NOMBRE"='Supervisor de zona');
insert into public."CONTACTOS" ("NOMBRE","CARGO","REGION","LOCACION","ORDEN")
select 'Soporte Tecnología','Soporte',null,null,20
where not exists (select 1 from public."CONTACTOS" where "NOMBRE"='Soporte Tecnología');


-- ================================================================
-- v3.5 PRODUCTIVIDAD DIARIA (incluido para instalaciones nuevas)
-- ================================================================

create table if not exists public."BBDD_PRODUCTIVIDAD_PROSPECTOR" (
  id uuid primary key default gen_random_uuid(),
  "FECHA" date not null,
  "USUARIO" text not null references public."USUARIOS"("USUARIO"),
  "META_ALTAS" integer not null default 5 check ("META_ALTAS" > 0),
  "ALTAS" integer not null default 0 check ("ALTAS" >= 0),
  "PRODUCTIVIDAD_PCT" numeric(8,2) not null default 0,
  "SEMAFORO" text not null default 'ROJO' check ("SEMAFORO" in ('VERDE','AMBAR','ROJO')),
  "MENSAJE_MOTIVACIONAL" text not null default '¡Tú puedes! Te falta poco para lograr el 100%.',
  "REGION" text not null,
  "LOCACION" text not null,
  "CREATED_AT" timestamptz not null default now(),
  "UPDATED_AT" timestamptz not null default now(),
  unique ("FECHA","USUARIO")
);

create index if not exists idx_productividad_fecha_usuario on public."BBDD_PRODUCTIVIDAD_PROSPECTOR"("FECHA","USUARIO");
create index if not exists idx_productividad_region_fecha on public."BBDD_PRODUCTIVIDAD_PROSPECTOR"("REGION","FECHA");

grant select on public."BBDD_PRODUCTIVIDAD_PROSPECTOR" to authenticated;
alter table public."BBDD_PRODUCTIVIDAD_PROSPECTOR" enable row level security;

drop policy if exists productividad_select on public."BBDD_PRODUCTIVIDAD_PROSPECTOR";
create policy productividad_select on public."BBDD_PRODUCTIVIDAD_PROSPECTOR" for select to authenticated
using (public.can_read_usuario("USUARIO"));

-- Calcula y persiste el snapshot diario de un Prospector.
create or replace function public.sync_productividad_prospector(p_usuario text,p_fecha date)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_altas integer := 0;
  v_pct numeric(8,2) := 0;
  v_region text;
  v_locacion text;
  v_rol text;
  v_status text;
  v_semaforo text;
  v_mensaje text;
begin
  select "REGION","LOCACION","ROL","STATUS"
  into v_region,v_locacion,v_rol,v_status
  from public."USUARIOS"
  where "USUARIO"=p_usuario;

  if v_rol is distinct from 'Prospector' or v_status is distinct from 'ACTIVO' then
    return;
  end if;

  select count(*)::int into v_altas
  from public."BBDD_VISITAS"
  where "USUARIO"=p_usuario
    and "FECHA"=p_fecha
    and "ESTADO"='FINALIZADA'
    and "CLIENTE_EXITOSO"='SI';

  v_pct := round((v_altas::numeric / 5::numeric) * 100,2);
  v_semaforo := case when v_pct >= 100 then 'VERDE' when v_pct >= 60 then 'AMBAR' else 'ROJO' end;
  v_mensaje := case
    when v_pct >= 100 then '¡Excelente trabajo! Lograste el 100% de productividad. Sigue así.'
    else '¡Tú puedes! Te falta poco para lograr el 100%.'
  end;

  insert into public."BBDD_PRODUCTIVIDAD_PROSPECTOR"
    ("FECHA","USUARIO","META_ALTAS","ALTAS","PRODUCTIVIDAD_PCT","SEMAFORO","MENSAJE_MOTIVACIONAL","REGION","LOCACION","UPDATED_AT")
  values
    (p_fecha,p_usuario,5,v_altas,v_pct,v_semaforo,v_mensaje,v_region,v_locacion,now())
  on conflict ("FECHA","USUARIO") do update set
    "META_ALTAS"=5,
    "ALTAS"=excluded."ALTAS",
    "PRODUCTIVIDAD_PCT"=excluded."PRODUCTIVIDAD_PCT",
    "SEMAFORO"=excluded."SEMAFORO",
    "MENSAJE_MOTIVACIONAL"=excluded."MENSAJE_MOTIVACIONAL",
    "REGION"=excluded."REGION",
    "LOCACION"=excluded."LOCACION",
    "UPDATED_AT"=now();
end;
$$;

-- En el primer movimiento de una región/día crea también el registro 0% de los
-- demás Prospectores activos de la región. Así un ausente no desaparece del KPI.
create or replace function public.ensure_productividad_dia(p_fecha date)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  -- Crea un snapshot diario para TODOS los Prospectores activos. Así, aunque
  -- un prospecto todavía tenga 0 altas, su Productividad del día queda registrada.
  insert into public."BBDD_PRODUCTIVIDAD_PROSPECTOR"
    ("FECHA","USUARIO","META_ALTAS","ALTAS","PRODUCTIVIDAD_PCT","SEMAFORO","MENSAJE_MOTIVACIONAL","REGION","LOCACION")
  select p_fecha,u."USUARIO",5,0,0,'ROJO','¡Tú puedes! Te falta poco para lograr el 100%.',u."REGION",u."LOCACION"
  from public."USUARIOS" u
  where u."ROL"='Prospector' and u."STATUS"='ACTIVO'
  on conflict ("FECHA","USUARIO") do nothing;
end;
$$;

create or replace function public.trg_productividad_inicio()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.ensure_productividad_dia(new."FECHA");
  perform public.sync_productividad_prospector(new."USUARIO",new."FECHA");
  return new;
end;
$$;

create or replace function public.trg_productividad_visita()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if tg_op='DELETE' then
    perform public.ensure_productividad_dia(old."FECHA");
    perform public.sync_productividad_prospector(old."USUARIO",old."FECHA");
    return old;
  end if;

  perform public.ensure_productividad_dia(new."FECHA");
  perform public.sync_productividad_prospector(new."USUARIO",new."FECHA");

  if tg_op='UPDATE' and (old."USUARIO" is distinct from new."USUARIO" or old."FECHA" is distinct from new."FECHA") then
    perform public.sync_productividad_prospector(old."USUARIO",old."FECHA");
  end if;
  return new;
end;
$$;

create or replace function public.trg_productividad_fin()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.ensure_productividad_dia(new."FECHA");
  perform public.sync_productividad_prospector(new."USUARIO",new."FECHA");
  return new;
end;
$$;

drop trigger if exists trg_productividad_inicio on public."BBDD_INICIO_JORNADA";
create trigger trg_productividad_inicio
after insert or update on public."BBDD_INICIO_JORNADA"
for each row execute function public.trg_productividad_inicio();

drop trigger if exists trg_productividad_visita on public."BBDD_VISITAS";
create trigger trg_productividad_visita
after insert or update or delete on public."BBDD_VISITAS"
for each row execute function public.trg_productividad_visita();

drop trigger if exists trg_productividad_fin on public."BBDD_FIN_JORNADA";
create trigger trg_productividad_fin
after insert or update on public."BBDD_FIN_JORNADA"
for each row execute function public.trg_productividad_fin();

revoke all on function public.sync_productividad_prospector(text,date) from public;
revoke all on function public.ensure_productividad_dia(date) from public;
revoke all on function public.trg_productividad_inicio() from public;
revoke all on function public.trg_productividad_visita() from public;
revoke all on function public.trg_productividad_fin() from public;

-- Backfill de fechas/usuarios que ya tenían actividad antes de v3.5.
insert into public."BBDD_PRODUCTIVIDAD_PROSPECTOR"
  ("FECHA","USUARIO","META_ALTAS","ALTAS","PRODUCTIVIDAD_PCT","SEMAFORO","MENSAJE_MOTIVACIONAL","REGION","LOCACION")
select distinct x."FECHA",x."USUARIO",5,0,0,'ROJO','¡Tú puedes! Te falta poco para lograr el 100%.',x."REGION",x."LOCACION"
from (
  select "FECHA","USUARIO","REGION","LOCACION" from public."BBDD_INICIO_JORNADA"
  union
  select "FECHA","USUARIO","REGION","LOCACION" from public."BBDD_VISITAS"
  union
  select "FECHA","USUARIO","REGION","LOCACION" from public."BBDD_FIN_JORNADA"
) x
join public."USUARIOS" u on u."USUARIO"=x."USUARIO" and u."ROL"='Prospector'
on conflict ("FECHA","USUARIO") do nothing;

with c as (
  select "FECHA","USUARIO",count(*)::int as altas
  from public."BBDD_VISITAS"
  where "ESTADO"='FINALIZADA' and "CLIENTE_EXITOSO"='SI'
  group by "FECHA","USUARIO"
)
update public."BBDD_PRODUCTIVIDAD_PROSPECTOR" p
set "ALTAS"=coalesce(c.altas,0),
    "PRODUCTIVIDAD_PCT"=round((coalesce(c.altas,0)::numeric/5::numeric)*100,2),
    "SEMAFORO"=case when coalesce(c.altas,0)>=5 then 'VERDE' when coalesce(c.altas,0)>=3 then 'AMBAR' else 'ROJO' end,
    "MENSAJE_MOTIVACIONAL"=case when coalesce(c.altas,0)>=5 then '¡Excelente trabajo! Lograste el 100% de productividad. Sigue así.' else '¡Tú puedes! Te falta poco para lograr el 100%.' end,
    "UPDATED_AT"=now()
from c
where p."FECHA"=c."FECHA" and p."USUARIO"=c."USUARIO";

-- RPC del Desarrollador/Admin: reemplaza Conversión por Productividad.
drop function if exists public.get_developer_prospector_progress(date,date,text,text);
create or replace function public.get_developer_prospector_progress(
  p_fecha_desde date default null,
  p_fecha_hasta date default null,
  p_region text default null,
  p_locacion text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  caller_role text;
  result jsonb;
  v_desde date := coalesce(p_fecha_desde, ((now() at time zone 'America/Lima')::date));
  v_hasta date := coalesce(p_fecha_hasta, coalesce(p_fecha_desde, ((now() at time zone 'America/Lima')::date)));
begin
  caller_role := public.current_app_role();
  if caller_role not in ('Desarrollador','Administrador') then raise exception 'No autorizado'; end if;
  if v_hasta < v_desde then raise exception 'Rango de fechas inválido'; end if;

  with prospectors as (
    select u."USUARIO",u."NOMBRE",u."APELLIDO",u."REGION",u."LOCACION"
    from public."USUARIOS" u
    where u."ROL"='Prospector' and u."STATUS"='ACTIVO'
      and (p_region is null or p_region='' or u."REGION"=p_region)
      and (p_locacion is null or p_locacion='' or u."LOCACION"=p_locacion)
  ),
  starts as (
    select s.* from public."BBDD_INICIO_JORNADA" s
    join prospectors p on p."USUARIO"=s."USUARIO"
    where s."FECHA" between v_desde and v_hasta
  ),
  visits as (
    select v.* from public."BBDD_VISITAS" v
    join prospectors p on p."USUARIO"=v."USUARIO"
    where v."FECHA" between v_desde and v_hasta and v."ESTADO"='FINALIZADA'
  ),
  productivity as (
    select pr.* from public."BBDD_PRODUCTIVIDAD_PROSPECTOR" pr
    join prospectors p on p."USUARIO"=pr."USUARIO"
    where pr."FECHA" between v_desde and v_hasta
  ),
  active_days as (
    select case when v_desde=v_hasta then 1 else count(distinct fecha)::int end as days
    from (select "FECHA" as fecha from starts union select "FECHA" as fecha from visits) d
  ),
  start_agg as (
    select s."USUARIO",count(distinct s."FECHA")::int as attendance_days,
      max(s."CLASIFICACION_INGRESO") filter (where s."FECHA"=v_desde) as exact_classification,
      min(s."HORA_INICIO") as first_time
    from starts s group by s."USUARIO"
  ),
  visit_agg as (
    select v."USUARIO",count(v.id)::int as visitas,
      count(v.id) filter (where v."CLIENTE_EXITOSO"='SI')::int as altas
    from visits v group by v."USUARIO"
  ),
  prod_agg as (
    select pr."USUARIO",coalesce(sum(pr."ALTAS"),0)::int as altas_productividad,
      coalesce(sum(pr."META_ALTAS"),0)::int as meta_altas
    from productivity pr group by pr."USUARIO"
  ),
  team_rows as (
    select p."USUARIO" as usuario,btrim(coalesce(p."NOMBRE",'')||' '||coalesce(p."APELLIDO",'')) as nombre,
      p."REGION" as region,p."LOCACION" as locacion,
      case when v_desde=v_hasta then coalesce(replace(sa.exact_classification,'Ingreso ',''),'Sin registro')
           when coalesce(ad.days,0)=0 then '0%'
           else concat(round((coalesce(sa.attendance_days,0)::numeric/ad.days::numeric)*100)::int,'%') end as asistencia,
      coalesce(to_char(sa.first_time,'HH24:MI'),'--:--') as "horaInicio",
      coalesce(va.visitas,0)::int as visitas,coalesce(va.altas,0)::int as altas,
      case when coalesce(pa.meta_altas,0)>0 then round((pa.altas_productividad::numeric/pa.meta_altas::numeric)*100)::int
           else case when coalesce(ad.days,0)>0 then round((coalesce(va.altas,0)::numeric/(5::numeric*ad.days::numeric))*100)::int else 0 end end as productividad,
      coalesce(pa.meta_altas,5*greatest(coalesce(ad.days,0),1))::int as meta_altas,
      coalesce(sa.attendance_days,0)::int as attendance_days,coalesce(ad.days,0)::int as active_days
    from prospectors p cross join active_days ad
    left join start_agg sa on sa."USUARIO"=p."USUARIO"
    left join visit_agg va on va."USUARIO"=p."USUARIO"
    left join prod_agg pa on pa."USUARIO"=p."USUARIO"
  ),
  team_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'usuario',usuario,'nombre',nombre,'region',region,'locacion',locacion,'asistencia',asistencia,
      'horaInicio',"horaInicio",'visitas',visitas,'altas',altas,'productividad',productividad,'metaAltas',meta_altas
    ) order by nombre),'[]'::jsonb) as value from team_rows
  ),
  kpi as (
    select jsonb_build_object(
      'prospectores',count(*)::int,
      'asistenciaPct',case when count(*)>0 and max(active_days)>0 then least(100,round((sum(attendance_days)::numeric/(count(*)::numeric*max(active_days)::numeric))*100)::int) else 0 end,
      'visitas',coalesce(sum(visitas),0)::int,'altas',coalesce(sum(altas),0)::int,
      'productividad',case when coalesce(sum(meta_altas),0)>0 then round((sum(altas)::numeric/sum(meta_altas)::numeric)*100)::int else 0 end,
      'metaAltas',coalesce(sum(meta_altas),0)::int,'diasOperativos',coalesce(max(active_days),0)::int
    ) as value from team_rows
  ),
  days as (select d::date as fecha from generate_series(greatest(v_desde,v_hasta-13),v_hasta,interval '1 day') d),
  week_rows as (
    select d.fecha,to_char(d.fecha,'DD/MM') as dia,count(v.id)::int as visitas,
      count(v.id) filter (where v."CLIENTE_EXITOSO"='SI')::int as altas
    from days d left join visits v on v."FECHA"=d.fecha group by d.fecha order by d.fecha
  ),
  week_json as (
    select coalesce(jsonb_agg(jsonb_build_object('dia',dia,'visitas',visitas,'altas',altas) order by fecha),'[]'::jsonb) as value from week_rows
  )
  select jsonb_build_object('kpis',kpi.value,'team',team_json.value,'week',week_json.value)
  into result from kpi,team_json,week_json;
  return result;
end;
$$;

revoke all on function public.get_developer_prospector_progress(date,date,text,text) from public;
grant execute on function public.get_developer_prospector_progress(date,date,text,text) to authenticated;



-- PROSPECTA RTM v3.7 - opciones dinámicas de Región / Locación para Avances
-- Fuente: USUARIOS con STATUS = ACTIVO. La Molina se excluye siempre del filtro.
-- Supervisor: solo opciones dentro de su región. Desarrollador y Administrador: todas las opciones activas.

create or replace function public.get_active_dashboard_scope_options()
returns table(region text, locacion text)
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  caller_role text;
  caller_region text;
begin
  caller_role := public.current_app_role();
  caller_region := public.current_app_region();

  if caller_role not in ('Supervisor','Desarrollador','Administrador') then
    raise exception 'No autorizado';
  end if;

  return query
  select distinct btrim(u."REGION")::text as region, btrim(u."LOCACION")::text as locacion
  from public."USUARIOS" u
  where u."STATUS"='ACTIVO'
    and nullif(btrim(u."REGION"),'') is not null
    and nullif(btrim(u."LOCACION"),'') is not null
    and lower(btrim(u."LOCACION")) <> lower('La Molina')
    and (caller_role <> 'Supervisor' or u."REGION" = caller_region)
  order by 1,2;
end;
$$;

revoke all on function public.get_active_dashboard_scope_options() from public;
grant execute on function public.get_active_dashboard_scope_options() to authenticated;

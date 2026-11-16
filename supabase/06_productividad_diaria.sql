-- PROSPECTA RTM v3.5
-- Productividad diaria de Prospectores
-- Meta fija: 5 altas por prospector por día = 100%
-- Ejecutar SOLO si ya tenías instalada la v3.4.

begin;

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

commit;

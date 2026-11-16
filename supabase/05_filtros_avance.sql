-- PROSPECTA RTM v3.4
-- Filtros de Avance: Año / Mes / Fecha / Región / Locación
-- Ejecutar SOLO si ya tenías instalada la v3.3.

begin;

drop function if exists public.get_developer_prospector_progress(date);
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

commit;

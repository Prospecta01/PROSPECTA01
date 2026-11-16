-- PROSPECTA | RTM v3.3
-- ACTUALIZACIÓN para instalaciones que ya tienen v3.2.
-- Agrega: FIN DE JORNADA DESARROLLADOR + AVANCE DE PROSPECTORES visible al Desarrollador.
-- Ejecutar COMPLETO en Supabase > SQL Editor > New query > Run.
-- No borra registros existentes.

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

grant select, insert on public."BBDD_FIN_JORNADA_DESARROLLADOR" to authenticated;
create index if not exists idx_dev_fin_fecha_usuario on public."BBDD_FIN_JORNADA_DESARROLLADOR"("FECHA","USUARIO");
alter table public."BBDD_FIN_JORNADA_DESARROLLADOR" enable row level security;

drop policy if exists dev_fin_select on public."BBDD_FIN_JORNADA_DESARROLLADOR";
create policy dev_fin_select on public."BBDD_FIN_JORNADA_DESARROLLADOR" for select to authenticated
using (
  public.current_app_role()='Administrador'
  or (public.current_app_role()='Desarrollador' and public.current_app_usuario()="USUARIO")
);

drop policy if exists dev_fin_insert on public."BBDD_FIN_JORNADA_DESARROLLADOR";
create policy dev_fin_insert on public."BBDD_FIN_JORNADA_DESARROLLADOR" for insert to authenticated
with check (
  public.current_app_role()='Desarrollador'
  and public.current_app_usuario()="USUARIO"
);

-- RPC seguro: el Desarrollador puede ver el avance consolidado de Prospectores
-- sin recibir acceso directo irrestricto a BBDD_INICIO_JORNADA / BBDD_VISITAS.
create or replace function public.get_developer_prospector_progress(p_fecha date default ((now() at time zone 'America/Lima')::date))
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  caller_role text;
  result jsonb;
begin
  caller_role := public.current_app_role();
  if caller_role not in ('Desarrollador','Administrador') then
    raise exception 'No autorizado';
  end if;

  with prospectors as (
    select u."USUARIO", u."NOMBRE", u."APELLIDO", u."REGION", u."LOCACION"
    from public."USUARIOS" u
    where u."ROL"='Prospector' and u."STATUS"='ACTIVO'
  ),
  starts as (
    select s.*
    from public."BBDD_INICIO_JORNADA" s
    where s."FECHA"=p_fecha
  ),
  visits as (
    select v.*
    from public."BBDD_VISITAS" v
    where v."FECHA"=p_fecha and v."ESTADO"='FINALIZADA'
  ),
  team_rows as (
    select
      p."USUARIO" as usuario,
      btrim(coalesce(p."NOMBRE",'') || ' ' || coalesce(p."APELLIDO",'')) as nombre,
      p."REGION" as region,
      p."LOCACION" as locacion,
      coalesce(replace(s."CLASIFICACION_INGRESO",'Ingreso ',''),'Sin registro') as asistencia,
      coalesce(to_char(s."HORA_INICIO",'HH24:MI'),'--:--') as "horaInicio",
      count(v.id)::int as visitas,
      count(v.id) filter (where v."CLIENTE_EXITOSO"='SI')::int as altas
    from prospectors p
    left join starts s on s."USUARIO"=p."USUARIO"
    left join visits v on v."USUARIO"=p."USUARIO"
    group by p."USUARIO",p."NOMBRE",p."APELLIDO",p."REGION",p."LOCACION",s."CLASIFICACION_INGRESO",s."HORA_INICIO"
  ),
  team_json as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'usuario',usuario,
      'nombre',nombre,
      'region',region,
      'locacion',locacion,
      'asistencia',asistencia,
      'horaInicio',"horaInicio",
      'visitas',visitas,
      'altas',altas,
      'conversion',case when visitas>0 then round((altas::numeric/visitas::numeric)*100)::int else 0 end
    ) order by nombre),'[]'::jsonb) as value
    from team_rows
  ),
  kpi as (
    select jsonb_build_object(
      'prospectores',count(*)::int,
      'asistenciaPct',case when count(*)>0 then round((count(*) filter (where asistencia<>'Sin registro')::numeric/count(*)::numeric)*100)::int else 0 end,
      'visitas',coalesce(sum(visitas),0)::int,
      'altas',coalesce(sum(altas),0)::int,
      'conversion',case when coalesce(sum(visitas),0)>0 then round((sum(altas)::numeric/sum(visitas)::numeric)*100)::int else 0 end
    ) as value
    from team_rows
  ),
  days as (
    select d::date as fecha
    from generate_series(p_fecha-5,p_fecha,interval '1 day') d
  ),
  week_rows as (
    select
      d.fecha,
      to_char(d.fecha,'Dy') as dia,
      count(v.id)::int as visitas,
      count(v.id) filter (where v."CLIENTE_EXITOSO"='SI')::int as altas
    from days d
    left join public."BBDD_VISITAS" v
      on v."FECHA"=d.fecha and v."ESTADO"='FINALIZADA'
    group by d.fecha
    order by d.fecha
  ),
  week_json as (
    select coalesce(jsonb_agg(jsonb_build_object('dia',dia,'visitas',visitas,'altas',altas) order by fecha),'[]'::jsonb) as value
    from week_rows
  )
  select jsonb_build_object('kpis',kpi.value,'team',team_json.value,'week',week_json.value)
  into result
  from kpi,team_json,week_json;

  return result;
end;
$$;

revoke all on function public.get_developer_prospector_progress(date) from public;
grant execute on function public.get_developer_prospector_progress(date) to authenticated;

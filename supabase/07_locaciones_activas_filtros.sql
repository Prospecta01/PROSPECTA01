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

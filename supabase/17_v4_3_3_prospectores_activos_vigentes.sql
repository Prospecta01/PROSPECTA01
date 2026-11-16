-- PROSPECTA | RTM v4.3.3
-- Supervisor / Coordinador / Admin: opciones de dashboard solo con Prospectores activos y vigentes.
create or replace function public.get_active_dashboard_scope_options()
returns table(region text, locacion text)
language plpgsql stable security definer set search_path=public as $$
declare caller_role text; caller_region text;
begin
  caller_role := public.current_app_role();
  caller_region := public.current_app_region();
  if caller_role not in ('Supervisor','Coordinador Regional','Validador','Administrador') then
    raise exception 'No autorizado';
  end if;

  return query
  select distinct btrim(u."REGION")::text, btrim(u."LOCACION")::text
  from public."USUARIOS" u
  where u."STATUS"='ACTIVO'
    and u."ROL"='Prospector'
    and coalesce(u."EN_PLANTILLA_VIGENTE",true)=true
    and nullif(btrim(u."REGION"),'') is not null
    and nullif(btrim(coalesce(u."LOCACION",'')),'') is not null
    and lower(btrim(u."LOCACION")) <> lower('La Molina')
    and (caller_role not in ('Supervisor','Coordinador Regional') or u."REGION"=caller_region)
  order by 1,2;
end;
$$;
revoke all on function public.get_active_dashboard_scope_options() from public;
grant execute on function public.get_active_dashboard_scope_options() to authenticated;

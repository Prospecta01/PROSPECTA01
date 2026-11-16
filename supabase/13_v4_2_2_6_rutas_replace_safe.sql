-- PROSPECTA | RTM v4.2.2.6
-- Corrige el reemplazo total de RUTAS_LOCACION cuando pg_safeupdate
-- rechaza DELETE sin WHERE.

create or replace function public.replace_rutas_locacion(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  n integer;
begin
  if public.current_app_role() <> 'Administrador' then
    raise exception 'No autorizado';
  end if;

  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Formato inválido';
  end if;

  -- WHERE explícito para cumplir con la protección de borrados masivos.
  delete from public."RUTAS_LOCACION"
  where id is not null;

  insert into public."RUTAS_LOCACION"(
    "LOCACION_COMERCIAL","RUTA","ACTIVO","UPDATED_AT"
  )
  select
    btrim(x->>'locacion'),
    btrim(x->>'ruta'),
    true,
    now()
  from jsonb_array_elements(p_rows) x
  where nullif(btrim(x->>'locacion'),'') is not null
    and nullif(btrim(x->>'ruta'),'') is not null
  on conflict ("LOCACION_COMERCIAL","RUTA")
  do update set
    "ACTIVO"=true,
    "UPDATED_AT"=now();

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.replace_rutas_locacion(jsonb) from public;
grant execute on function public.replace_rutas_locacion(jsonb) to authenticated;

-- PROSPECTA | RTM v4.3.1
-- Ajuste de Base Compra Cero: Código SAP + Región + Locación.
-- Ejecutar DESPUÉS de 14_v4_3_0_compra_cero_codigo_sap.sql.

alter table public."CLIENTES_COMPRA_CERO"
  add column if not exists "CODIGO_SAP" text not null default '';

update public."CLIENTES_COMPRA_CERO"
set "CODIGO_SAP" = "CODIGO_CLIENTE"
where nullif(btrim("CODIGO_SAP"),'') is null
  and nullif(btrim("CODIGO_CLIENTE"),'') is not null;

create index if not exists idx_compra_cero_codigo_sap
  on public."CLIENTES_COMPRA_CERO"("CODIGO_SAP");

create or replace function public.replace_clientes_compra_cero(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  n integer;
  v_carga_id uuid := gen_random_uuid();
begin
  if public.current_app_role() <> 'Administrador' then
    raise exception 'No autorizado';
  end if;
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Formato inválido';
  end if;

  update public."CLIENTES_COMPRA_CERO"
  set "ACTIVO"=false,"UPDATED_AT"=now()
  where "ACTIVO"=true;

  insert into public."CLIENTES_COMPRA_CERO"(
    "CARGA_ID","CODIGO_CLIENTE","CODIGO_SAP","CLIENTE","REGION","LOCACION","ACTIVO","UPDATED_AT"
  )
  select
    v_carga_id,
    btrim(x->>'codigoSap'),
    btrim(x->>'codigoSap'),
    '',
    btrim(x->>'region'),
    btrim(coalesce(x->>'locacion','')),
    true,
    now()
  from jsonb_array_elements(p_rows) x
  where nullif(btrim(x->>'codigoSap'),'') is not null
    and nullif(btrim(x->>'region'),'') is not null;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.replace_clientes_compra_cero(jsonb) from public;
grant execute on function public.replace_clientes_compra_cero(jsonb) to authenticated;

-- PROSPECTA | RTM v4.3.0
-- Código cliente SAP + Gestión Compra Cero + exportable Coordinador.
-- Ejecutar DESPUÉS de 13_v4_2_2_6_rutas_replace_safe.sql.

-- 1) Código cliente SAP capturado por Validador.
alter table public."BBDD_REGISTRO_VALIDADOR"
  add column if not exists "CODIGO_CLIENTE_SAP" text not null default '';

create index if not exists idx_registro_validador_codigo_sap
  on public."BBDD_REGISTRO_VALIDADOR"("CODIGO_CLIENTE_SAP");

-- Coordinador Regional puede leer el registro del Validador únicamente cuando
-- la visita vinculada pertenece a su propia Región.
drop policy if exists registro_validador_select on public."BBDD_REGISTRO_VALIDADOR";
create policy registro_validador_select on public."BBDD_REGISTRO_VALIDADOR"
for select to authenticated
using (
  public.current_app_role() in ('Administrador','Validador')
  or (
    public.current_app_role()='Coordinador Regional'
    and exists (
      select 1
      from public."BBDD_VISITAS" v
      where v.id="VISITA_ID"
        and v."REGION"=public.current_app_region()
    )
  )
);

-- 2) Maestro vigente de clientes Compra Cero.
create table if not exists public."CLIENTES_COMPRA_CERO" (
  id uuid primary key default gen_random_uuid(),
  "CARGA_ID" uuid not null,
  "CODIGO_CLIENTE" text not null,
  "CLIENTE" text not null default '',
  "REGION" text not null,
  "LOCACION" text not null default '',
  "ACTIVO" boolean not null default true,
  "CREATED_AT" timestamptz not null default now(),
  "UPDATED_AT" timestamptz not null default now(),
  unique ("CARGA_ID","CODIGO_CLIENTE")
);

create index if not exists idx_compra_cero_scope
  on public."CLIENTES_COMPRA_CERO"("ACTIVO","REGION","LOCACION");
create index if not exists idx_compra_cero_codigo
  on public."CLIENTES_COMPRA_CERO"("CODIGO_CLIENTE");

grant select on public."CLIENTES_COMPRA_CERO" to authenticated;
alter table public."CLIENTES_COMPRA_CERO" enable row level security;

drop policy if exists compra_cero_select on public."CLIENTES_COMPRA_CERO";
create policy compra_cero_select on public."CLIENTES_COMPRA_CERO"
for select to authenticated
using (
  public.current_app_role()='Administrador'
  or (
    public.current_app_role()='Supervisor'
    and "REGION"=public.current_app_region()
  )
);

-- 3) Gestión operativa de Compra Cero. Se separa del maestro para conservar historial.
create table if not exists public."BBDD_GESTION_COMPRA_CERO" (
  id uuid primary key default gen_random_uuid(),
  "CLIENTE_COMPRA_CERO_ID" uuid not null unique references public."CLIENTES_COMPRA_CERO"(id) on delete restrict,
  "SUPERVISOR_USUARIO" text not null references public."USUARIOS"("USUARIO"),
  "VISITA_FISICA" boolean not null default false,
  "REALIZO_COMPRA" boolean not null default false,
  "CANTIDAD_VENDIDA" numeric not null default 0 check ("CANTIDAD_VENDIDA">=0),
  "COMENTARIOS" text not null default '',
  "CREATED_AT" timestamptz not null default now(),
  "UPDATED_AT" timestamptz not null default now()
);

create index if not exists idx_gestion_compra_cero_supervisor
  on public."BBDD_GESTION_COMPRA_CERO"("SUPERVISOR_USUARIO","REALIZO_COMPRA");

grant select,insert,update on public."BBDD_GESTION_COMPRA_CERO" to authenticated;
alter table public."BBDD_GESTION_COMPRA_CERO" enable row level security;

drop policy if exists gestion_compra_cero_select on public."BBDD_GESTION_COMPRA_CERO";
create policy gestion_compra_cero_select on public."BBDD_GESTION_COMPRA_CERO"
for select to authenticated
using (
  public.current_app_role()='Administrador'
  or (
    public.current_app_role()='Supervisor'
    and exists (
      select 1 from public."CLIENTES_COMPRA_CERO" c
      where c.id="CLIENTE_COMPRA_CERO_ID"
        and c."REGION"=public.current_app_region()
    )
  )
);

drop policy if exists gestion_compra_cero_insert on public."BBDD_GESTION_COMPRA_CERO";
create policy gestion_compra_cero_insert on public."BBDD_GESTION_COMPRA_CERO"
for insert to authenticated
with check (
  public.current_app_role()='Supervisor'
  and "SUPERVISOR_USUARIO"=public.current_app_usuario()
  and exists (
    select 1 from public."CLIENTES_COMPRA_CERO" c
    where c.id="CLIENTE_COMPRA_CERO_ID"
      and c."REGION"=public.current_app_region()
  )
);

drop policy if exists gestion_compra_cero_update on public."BBDD_GESTION_COMPRA_CERO";
create policy gestion_compra_cero_update on public."BBDD_GESTION_COMPRA_CERO"
for update to authenticated
using (
  public.current_app_role()='Supervisor'
  and exists (
    select 1 from public."CLIENTES_COMPRA_CERO" c
    where c.id="CLIENTE_COMPRA_CERO_ID"
      and c."REGION"=public.current_app_region()
  )
)
with check (
  public.current_app_role()='Supervisor'
  and exists (
    select 1 from public."CLIENTES_COMPRA_CERO" c
    where c.id="CLIENTE_COMPRA_CERO_ID"
      and c."REGION"=public.current_app_region()
  )
);

-- 4) Reemplazo del maestro vigente Compra Cero.
-- No borra cargas históricas: desactiva la anterior e inserta una nueva fotografía.
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
    "CARGA_ID","CODIGO_CLIENTE","CLIENTE","REGION","LOCACION","ACTIVO","UPDATED_AT"
  )
  select
    v_carga_id,
    btrim(x->>'codigoCliente'),
    btrim(coalesce(x->>'cliente','')),
    btrim(x->>'region'),
    btrim(coalesce(x->>'locacion','')),
    true,
    now()
  from jsonb_array_elements(p_rows) x
  where nullif(btrim(x->>'codigoCliente'),'') is not null
    and nullif(btrim(x->>'region'),'') is not null;

  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.replace_clientes_compra_cero(jsonb) from public;
grant execute on function public.replace_clientes_compra_cero(jsonb) to authenticated;

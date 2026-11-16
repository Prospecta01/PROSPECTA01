-- PROSPECTA | RTM - Migración rol DESARROLLADOR
-- Úsala si YA ejecutaste 01_schema_y_seguridad.sql de una versión anterior.
-- Supabase > SQL Editor > New query > pegar/abrir este archivo > Run

-- 1) Ampliar roles permitidos.
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
alter table public."USUARIOS" add constraint "USUARIOS_ROL_check"
check ("ROL" in ('Prospector','Supervisor','Administrador','Desarrollador'));

-- 2) Nuevas bases exclusivas del Desarrollador.
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
  "UPDATED_AT" timestamptz,
  constraint "DEV_VISITA_FINALIZADA_check" check (
    "ESTADO"='EN_CURSO' or (
      btrim("CODIGO_CLIENTE")<>'' and
      (
        ("BONO_ENTREGADO"='NO' and "TIPO_BONO"='' and "FOTO_ENTREGA_DINERO"='' and "CODIGO_NOTA_CREDITO"='' and btrim("COMENTARIO_NO_BONO")<>'') or
        ("BONO_ENTREGADO"='SI' and "TIPO_BONO"='DINERO_EFECTIVO' and btrim("FOTO_ENTREGA_DINERO")<>'' and "CODIGO_NOTA_CREDITO"='' and "COMENTARIO_NO_BONO"='') or
        ("BONO_ENTREGADO"='SI' and "TIPO_BONO"='NOTA_CREDITO' and "FOTO_ENTREGA_DINERO"='' and btrim("CODIGO_NOTA_CREDITO")<>'' and "COMENTARIO_NO_BONO"='')
      )
    )
  )
);

-- Si una versión previa ya creó la tabla, incorpora el nuevo campo.
alter table public."BBDD_VISITAS_DESARROLLADOR"
  add column if not exists "COMENTARIO_NO_BONO" text not null default '';

-- Asegura la regla condicional actualizada incluso si la tabla ya existía.
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

create index if not exists idx_dev_inicio_fecha_usuario on public."BBDD_INICIO_JORNADA_DESARROLLADOR"("FECHA","USUARIO");
create index if not exists idx_dev_visitas_fecha_usuario on public."BBDD_VISITAS_DESARROLLADOR"("FECHA","USUARIO_DESARROLLADOR");
create index if not exists idx_dev_visitas_cliente_fecha on public."BBDD_VISITAS_DESARROLLADOR"("CODIGO_CLIENTE","FECHA");
create index if not exists idx_dev_visitas_estado_usuario on public."BBDD_VISITAS_DESARROLLADOR"("ESTADO","USUARIO_DESARROLLADOR");

alter table public."BBDD_INICIO_JORNADA_DESARROLLADOR" enable row level security;
alter table public."BBDD_VISITAS_DESARROLLADOR" enable row level security;

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

-- 3) Bucket privado para fotos cuando el bono se entrega en efectivo.
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

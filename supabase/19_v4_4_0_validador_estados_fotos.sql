-- PROSPECTA | RTM v4.4.0
-- Estados de validación, geolocalización, fecha aprobador y foto interior.

alter table public."BBDD_VISITAS"
  add column if not exists "FOTO_INTERIOR" text not null default '';

alter table public."BBDD_REGISTRO_VALIDADOR"
  add column if not exists "ESTADO_REGISTRO" text not null default 'PENDIENTE',
  add column if not exists "GEOLOCALIZADO" boolean not null default false,
  add column if not exists "FECHA_APROBADOR" date;

update public."BBDD_REGISTRO_VALIDADOR"
set "ESTADO_REGISTRO" = case when "REGISTRADO" = true then 'COMPLETADO' else 'PENDIENTE' end
where "ESTADO_REGISTRO" is null
   or "ESTADO_REGISTRO" not in ('PENDIENTE','COMPLETADO','RECHAZADO');

alter table public."BBDD_REGISTRO_VALIDADOR"
  drop constraint if exists bbdd_registro_validador_estado_registro_check;

alter table public."BBDD_REGISTRO_VALIDADOR"
  add constraint bbdd_registro_validador_estado_registro_check
  check ("ESTADO_REGISTRO" in ('PENDIENTE','COMPLETADO','RECHAZADO'));

create index if not exists idx_registro_validador_estado
  on public."BBDD_REGISTRO_VALIDADOR"("ESTADO_REGISTRO");

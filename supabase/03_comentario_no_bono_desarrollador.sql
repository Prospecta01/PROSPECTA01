-- PROSPECTA | RTM v3.2
-- Ejecuta SOLO si ya instalaste la versión v3.1 con el rol DESARROLLADOR.
-- Agrega el motivo/comentario obligatorio cuando NO se entrega bono.

alter table public."BBDD_VISITAS_DESARROLLADOR"
  add column if not exists "COMENTARIO_NO_BONO" text not null default '';

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

comment on column public."BBDD_VISITAS_DESARROLLADOR"."COMENTARIO_NO_BONO" is
'Motivo/comentario obligatorio únicamente cuando BONO_ENTREGADO = NO.';

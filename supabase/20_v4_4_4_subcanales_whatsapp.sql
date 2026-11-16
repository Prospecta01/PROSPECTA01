-- PROSPECTA | RTM v4.4.4
-- Check de envío WhatsApp en Validador. Los subcanales Boticas/Gimnasios son de catálogo frontend y no requieren tabla adicional.

alter table public."BBDD_REGISTRO_VALIDADOR"
  add column if not exists "ENVIO_WHATSAPP" boolean not null default false;

create index if not exists idx_registro_validador_whatsapp
  on public."BBDD_REGISTRO_VALIDADOR"("ENVIO_WHATSAPP");

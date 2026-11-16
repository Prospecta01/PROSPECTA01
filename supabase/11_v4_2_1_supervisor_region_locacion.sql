-- PROSPECTA | RTM v4.2.1
-- Supervisor se asigna por Región, sin Locación en su perfil.
-- El filtro Locación permanece disponible en sus vistas y opera sobre los Prospectores de su Región.

alter table public."USUARIOS" alter column "LOCACION" drop not null;

update public."USUARIOS"
set "LOCACION" = null, "UPDATED_AT" = now()
where "ROL" in ('Supervisor','Coordinador Regional')
  and "LOCACION" is not null;

-- El alcance de seguridad del Supervisor continúa siendo regional.
-- La segmentación por Locación se realiza en las consultas del frontend,
-- usando las locaciones activas de Prospectores dentro de su Región.

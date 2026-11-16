-- PROSPECTA RTM v4.6.0: catálogo de subcanales y Código Enlace
-- Ejecutar en Supabase SQL Editor antes de desplegar.
CREATE TABLE IF NOT EXISTS public."CATALOGO_SUBCANALES" (
 "SUBCANAL" text PRIMARY KEY,
 "ACTIVO" boolean NOT NULL DEFAULT true,
 "ORDEN" integer NOT NULL DEFAULT 0,
 "UPDATED_AT" timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public."CATALOGO_SUBCANALES" ("SUBCANAL","ORDEN") VALUES
 ('Bodegas',1),('Licorerías',2),('Restaurantes',3),('Minimarkets',4),('Panaderías',5),('Pescador y mariscos',6),('Criollo/Picanterías',7),('Boticas',8),('Gimnasios',9)
ON CONFLICT ("SUBCANAL") DO NOTHING;
ALTER TABLE public."CATALOGO_SUBCANALES" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS catalogo_subcanales_lectura ON public."CATALOGO_SUBCANALES";
CREATE POLICY catalogo_subcanales_lectura ON public."CATALOGO_SUBCANALES" FOR SELECT TO authenticated USING (true);
ALTER TABLE public."BBDD_REGISTRO_VALIDADOR" ADD COLUMN IF NOT EXISTS "CODIGO_ENLACE" text;
-- RPC SECURITY DEFINER: comprueba explícitamente rol del solicitante antes de reemplazar.
CREATE OR REPLACE FUNCTION public.reemplazar_catalogo_subcanales(p_subcanales text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rol text; v_count integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sesión no autorizada'; END IF;
 SELECT "ROL" INTO v_rol FROM public."USUARIOS" WHERE "UID_AUTH"=auth.uid() AND "EN_PLANTILLA_VIGENTE"=true AND "STATUS"='ACTIVO' LIMIT 1;
 IF lower(coalesce(v_rol,'')) <> 'administrador' THEN RAISE EXCEPTION 'Solo el Administrador puede actualizar subcanales'; END IF;
 v_count:=coalesce(array_length(p_subcanales,1),0);
 IF v_count=0 OR v_count>500 THEN RAISE EXCEPTION 'Se requieren entre 1 y 500 subcanales'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(p_subcanales) x WHERE trim(x)='' OR length(x)>120) THEN RAISE EXCEPTION 'Subcanal vacío o demasiado largo'; END IF;
 IF (SELECT count(DISTINCT lower(trim(x))) FROM unnest(p_subcanales) x)<>v_count THEN RAISE EXCEPTION 'Subcanales duplicados'; END IF;
 UPDATE public."CATALOGO_SUBCANALES" SET "ACTIVO"=false,"UPDATED_AT"=now();
 INSERT INTO public."CATALOGO_SUBCANALES"("SUBCANAL","ACTIVO","ORDEN","UPDATED_AT")
 SELECT trim(x),true,ord::integer,now() FROM unnest(p_subcanales) WITH ORDINALITY t(x,ord)
 ON CONFLICT("SUBCANAL") DO UPDATE SET "ACTIVO"=true,"ORDEN"=excluded."ORDEN","UPDATED_AT"=now();
END $$;
REVOKE ALL ON FUNCTION public.reemplazar_catalogo_subcanales(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reemplazar_catalogo_subcanales(text[]) TO authenticated;

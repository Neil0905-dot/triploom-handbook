-- Run in your own CloudBase PostgreSQL SQL console. Replace the secret digest
-- with SHA-256(DB_SECRET), then insert YOUR trip's initial state through the setup script.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS public.handbook_state (
  id text PRIMARY KEY, payload jsonb NOT NULL, revision bigint NOT NULL DEFAULT 0,
  secret_hash text NOT NULL
);
ALTER TABLE public.handbook_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handbook_state FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.handbook_state FROM public, anon, authenticated;
CREATE OR REPLACE FUNCTION public.handbook_read(p_secret text,p_trip text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object('state',payload,'revision',revision) INTO result FROM public.handbook_state
  WHERE id=p_trip AND secret_hash=encode(digest(convert_to(p_secret,'UTF8'),'sha256'),'hex');
  IF result IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  RETURN result;
END; $$;
CREATE OR REPLACE FUNCTION public.handbook_write(p_secret text,p_trip text,p_revision bigint,p_state jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE changed integer;
BEGIN
  IF jsonb_typeof(p_state)<>'object' OR octet_length(p_state::text)>1500000 THEN RAISE EXCEPTION 'invalid state'; END IF;
  UPDATE public.handbook_state SET payload=p_state,revision=revision+1 WHERE id=p_trip AND revision=p_revision
  AND secret_hash=encode(digest(convert_to(p_secret,'UTF8'),'sha256'),'hex');
  GET DIAGNOSTICS changed=ROW_COUNT;
  RETURN changed=1;
END; $$;
REVOKE ALL ON FUNCTION public.handbook_read(text,text) FROM public;
REVOKE ALL ON FUNCTION public.handbook_write(text,text,bigint,jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.handbook_read(text,text) TO anon;
GRANT EXECUTE ON FUNCTION public.handbook_write(text,text,bigint,jsonb) TO anon;

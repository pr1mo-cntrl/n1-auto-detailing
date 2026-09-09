-- ==============================================================================
-- Migration: 20240101000004_jobs_total_amount_insert_guard.sql
-- Description: Extend total_amount protection to cover INSERT operations.
--              Forces any client-supplied total_amount to 0 on new job creation.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.trg_jobs_protect_total_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_internal_recalc text;
BEGIN
  is_internal_recalc := current_setting('app.recalculating_job_total', true);

  IF TG_OP = 'INSERT' THEN
    IF (is_internal_recalc IS NULL OR is_internal_recalc <> 'true') THEN
      NEW.total_amount := 0;
    END IF;
    RETURN NEW;
  END IF;

  IF (NEW.total_amount IS DISTINCT FROM OLD.total_amount) THEN
    IF (is_internal_recalc IS NULL OR is_internal_recalc <> 'true') THEN
      NEW.total_amount := OLD.total_amount;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_jobs_total_amount ON public.jobs;

CREATE TRIGGER protect_jobs_total_amount
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.trg_jobs_protect_total_amount();
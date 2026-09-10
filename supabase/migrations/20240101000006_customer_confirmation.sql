-- Migration: 20240101000006_customer_confirmation.sql
-- Description: Add customer_confirmed_at column and update status transition trigger to gate QUEUED status

-- 1. Add customer_confirmed_at column to jobs
ALTER TABLE public.jobs
  ADD COLUMN customer_confirmed_at timestamptz;

-- 2. Update trg_validate_job_status_transition with customer confirmation gate
CREATE OR REPLACE FUNCTION public.trg_validate_job_status_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requester_role public.user_role;
BEGIN
  IF NEW.job_status IS DISTINCT FROM OLD.job_status THEN

    IF OLD.job_status IN ('COMPLETED', 'CANCELLED') THEN
      RAISE EXCEPTION 'Cannot change status of a % job', OLD.job_status;
    END IF;

    -- Specific gate: Customer confirmation required before moving PENDING -> QUEUED
    IF OLD.job_status = 'PENDING' AND NEW.job_status = 'QUEUED' AND OLD.customer_confirmed_at IS NULL THEN
      RAISE EXCEPTION 'Job cannot be queued until the customer has confirmed the services and total';
    END IF;

    -- Valid state transition check
    IF NOT (
      (OLD.job_status = 'PENDING' AND NEW.job_status = 'CANCELLED') OR
      (OLD.job_status = 'PENDING' AND NEW.job_status = 'QUEUED' AND OLD.customer_confirmed_at IS NOT NULL) OR
      (OLD.job_status = 'QUEUED' AND NEW.job_status IN ('IN_PROGRESS', 'CANCELLED')) OR
      (OLD.job_status = 'IN_PROGRESS' AND NEW.job_status = 'COMPLETED')
    ) THEN
      RAISE EXCEPTION 'Invalid job status transition: % -> %', OLD.job_status, NEW.job_status;
    END IF;

    IF NEW.job_status = 'CANCELLED' THEN
      SELECT role INTO requester_role FROM public.profiles WHERE id = auth.uid();
      IF requester_role IS DISTINCT FROM 'ADMIN' THEN
        RAISE EXCEPTION 'Only managers can cancel a job';
      END IF;
      NEW.cancelled_at := timezone('utc'::text, now());
    END IF;

    IF NEW.job_status = 'IN_PROGRESS' THEN
      NEW.started_at := timezone('utc'::text, now());
    END IF;

    IF NEW.job_status = 'COMPLETED' THEN
      NEW.completed_at := timezone('utc'::text, now());
    END IF;

  END IF;

  RETURN NEW;
END;
$function$;
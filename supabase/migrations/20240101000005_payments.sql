-- Migration: 20240101000005_payments.sql
-- Description: Create payment_method enum, payments table with immutable RLS, and trigger locking job_services when paid

-- 1. Create payment_method ENUM
CREATE TYPE public.payment_method AS ENUM (
  'CASH', 'GCASH', 'CARD', 'BANK_TRANSFER'
);

-- 2. Create payments table
CREATE TABLE public.payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid NOT NULL UNIQUE REFERENCES public.jobs(id) ON DELETE RESTRICT,
  amount          numeric(10,2) NOT NULL CHECK (amount >= 0),
  payment_method  public.payment_method NOT NULL,
  recorded_by     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  paid_at         timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at      timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for job lookups
CREATE INDEX idx_payments_job_id ON public.payments(job_id);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Granular RLS Policies (SELECT and INSERT only; deliberately NO UPDATE/DELETE)
CREATE POLICY "Authenticated staff can view payments"
  ON public.payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff can insert payments"
  ON public.payments FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Trigger Function: Lock job_services once a job is paid
CREATE OR REPLACE FUNCTION public.trg_prevent_job_services_edit_if_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_job_id uuid;
  payment_exists boolean;
BEGIN
  target_job_id := COALESCE(NEW.job_id, OLD.job_id);

  SELECT EXISTS (
    SELECT 1 FROM public.payments WHERE job_id = target_job_id
  ) INTO payment_exists;

  IF payment_exists THEN
    RAISE EXCEPTION 'Cannot modify services on a job that has already been paid';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to job_services
DROP TRIGGER IF EXISTS prevent_job_services_edit_if_paid ON public.job_services;
CREATE TRIGGER prevent_job_services_edit_if_paid
  BEFORE INSERT OR UPDATE OR DELETE ON public.job_services
  FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_job_services_edit_if_paid();
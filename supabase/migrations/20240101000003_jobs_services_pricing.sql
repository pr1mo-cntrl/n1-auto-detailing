-- ==============================================================================
-- 0. CLEANUP (Resets any partial tables/types from interrupted runs)
-- ==============================================================================
DROP TABLE IF EXISTS public.job_services CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.service_pricing CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TYPE IF EXISTS public.job_status CASCADE;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- ==============================================================================
-- 1. TIMESTAMP TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. PROFILES ROLE HARDENING
-- ==============================================================================
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('ADMIN', 'STAFF'));

-- ==============================================================================
-- 3. SERVICES TABLE & SEED
-- ==============================================================================
CREATE TABLE public.services (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at  timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT services_name_check CHECK (length(trim(name)) > 0)
);

CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated staff can view services"
  ON public.services FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff can insert services"
  ON public.services FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated staff can update services"
  ON public.services FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.services (name, description) VALUES
  ('Basic Wash', 'Exterior wash and dry'),
  ('Full Detail', 'Interior and exterior deep clean'),
  ('Wax & Polish', 'Exterior wax and paint polish'),
  ('Interior Deep Clean', 'Full interior vacuum, shampoo, and wipe-down');

-- ==============================================================================
-- 4. SERVICE PRICING TABLE & SEED
-- ==============================================================================
CREATE TABLE public.service_pricing (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id   uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  vehicle_size public.vehicle_size NOT NULL,
  price        numeric(10,2) NOT NULL CHECK (price >= 0),
  created_at   timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at   timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (service_id, vehicle_size)
);

CREATE TRIGGER set_service_pricing_updated_at
  BEFORE UPDATE ON public.service_pricing
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_service_pricing_service_id ON public.service_pricing(service_id);

ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated staff can view service_pricing"
  ON public.service_pricing FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff can insert service_pricing"
  ON public.service_pricing FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated staff can update service_pricing"
  ON public.service_pricing FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DO $$
DECLARE
  s_basic_wash uuid;
  s_full_detail uuid;
  s_wax_polish uuid;
  s_interior_deep uuid;
BEGIN
  SELECT id INTO s_basic_wash FROM public.services WHERE name = 'Basic Wash';
  SELECT id INTO s_full_detail FROM public.services WHERE name = 'Full Detail';
  SELECT id INTO s_wax_polish FROM public.services WHERE name = 'Wax & Polish';
  SELECT id INTO s_interior_deep FROM public.services WHERE name = 'Interior Deep Clean';

  -- Basic Wash
  INSERT INTO public.service_pricing (service_id, vehicle_size, price) VALUES
    (s_basic_wash, 'SMALL', 300.00),
    (s_basic_wash, 'MEDIUM', 350.00),
    (s_basic_wash, 'LARGE', 400.00),
    (s_basic_wash, 'X_LARGE', 450.00),
    (s_basic_wash, 'UNKNOWN', 400.00);

  -- Full Detail
  INSERT INTO public.service_pricing (service_id, vehicle_size, price) VALUES
    (s_full_detail, 'SMALL', 1200.00),
    (s_full_detail, 'MEDIUM', 1500.00),
    (s_full_detail, 'LARGE', 1800.00),
    (s_full_detail, 'X_LARGE', 2200.00),
    (s_full_detail, 'UNKNOWN', 1500.00);

  -- Wax & Polish
  INSERT INTO public.service_pricing (service_id, vehicle_size, price) VALUES
    (s_wax_polish, 'SMALL', 800.00),
    (s_wax_polish, 'MEDIUM', 1000.00),
    (s_wax_polish, 'LARGE', 1200.00),
    (s_wax_polish, 'X_LARGE', 1500.00),
    (s_wax_polish, 'UNKNOWN', 1000.00);

  -- Interior Deep Clean
  INSERT INTO public.service_pricing (service_id, vehicle_size, price) VALUES
    (s_interior_deep, 'SMALL', 600.00),
    (s_interior_deep, 'MEDIUM', 750.00),
    (s_interior_deep, 'LARGE', 900.00),
    (s_interior_deep, 'X_LARGE', 1100.00),
    (s_interior_deep, 'UNKNOWN', 750.00);
END $$;

-- ==============================================================================
-- 5. JOBS TABLE & ENUM
-- ==============================================================================
CREATE TYPE public.job_status AS ENUM (
  'PENDING', 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
);

CREATE TABLE public.jobs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  vehicle_id   uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  job_status   public.job_status NOT NULL DEFAULT 'PENDING',
  total_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  notes        text,
  started_at   timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at   timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER set_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_jobs_fifo_queue ON public.jobs (job_status, created_at ASC);
CREATE INDEX idx_jobs_customer_id ON public.jobs(customer_id);
CREATE INDEX idx_jobs_vehicle_id ON public.jobs(vehicle_id);

-- ==============================================================================
-- 6. JOB SERVICES TABLE
-- ==============================================================================
CREATE TABLE public.job_services (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  service_id    uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  price_charged numeric(10,2) NOT NULL CHECK (price_charged >= 0),
  created_at    timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_job_services_job_id ON public.job_services(job_id);

-- ==============================================================================
-- 7. TOTAL AMOUNT PROTECTION & RECALCULATION TRIGGERS
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

CREATE OR REPLACE FUNCTION public.trg_recalculate_job_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_job_id uuid;
  new_total numeric(10,2);
BEGIN
  target_job_id := COALESCE(NEW.job_id, OLD.job_id);

  SELECT COALESCE(SUM(price_charged), 0) INTO new_total
  FROM public.job_services
  WHERE job_id = target_job_id;

  PERFORM set_config('app.recalculating_job_total', 'true', true);

  UPDATE public.jobs
  SET total_amount = new_total
  WHERE id = target_job_id;

  PERFORM set_config('app.recalculating_job_total', 'false', true);

  RETURN NULL;
END;
$$;

CREATE TRIGGER recalculate_job_total_on_change
  AFTER INSERT OR UPDATE OR DELETE ON public.job_services
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_job_total();

-- ==============================================================================
-- 8. STATUS TRANSITION VALIDATION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.trg_validate_job_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_role public.user_role;
BEGIN
  IF NEW.job_status IS DISTINCT FROM OLD.job_status THEN

    IF OLD.job_status IN ('COMPLETED', 'CANCELLED') THEN
      RAISE EXCEPTION 'Cannot change status of a % job', OLD.job_status;
    END IF;

    IF NOT (
      (OLD.job_status = 'PENDING' AND NEW.job_status IN ('QUEUED', 'CANCELLED')) OR
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
$$;

CREATE TRIGGER validate_job_status_transition
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.trg_validate_job_status_transition();

-- ==============================================================================
-- 9. ROW LEVEL SECURITY POLICIES
-- ==============================================================================
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated staff can view jobs"
  ON public.jobs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff can insert jobs"
  ON public.jobs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated staff can update jobs"
  ON public.jobs FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (
    job_status <> 'CANCELLED'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Authenticated staff can view job_services"
  ON public.job_services FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated staff can insert job_services"
  ON public.job_services FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated staff can delete job_services"
  ON public.job_services FOR DELETE TO authenticated USING (true);
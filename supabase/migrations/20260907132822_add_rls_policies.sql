-- 1. ENABLE ROW LEVEL SECURITY ON ALL BUSINESS TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inv_transactions ENABLE ROW LEVEL SECURITY;

-- 2. HELPER FUNCTIONS TO PREVENT RECURSION & INSPECT ROLES SAFELY
-- SECURITY DEFINER runs with the privileges of the creator (postgres/superuser), 
-- bypassing RLS on the profiles table during the lookup to avoid infinite loops.
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.get_auth_role() = 'ADMIN'::user_role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.get_auth_role() IN ('STAFF'::user_role, 'ADMIN'::user_role));
$$;

-- 3. PROFILES POLICIES
-- Authenticated users can read all employee profiles (needed for names on queue/dashboard).
CREATE POLICY "profiles_select_auth"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Only an ADMIN can insert or update profiles (prevents self-elevation from STAFF to ADMIN).
CREATE POLICY "profiles_insert_admin"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "profiles_update_admin"
ON profiles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. CUSTOMERS POLICIES
CREATE POLICY "customers_select"
ON customers FOR SELECT
TO authenticated
USING (public.is_staff_or_admin());

CREATE POLICY "customers_insert"
ON customers FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin());

CREATE POLICY "customers_update"
ON customers FOR UPDATE
TO authenticated
USING (public.is_staff_or_admin())
WITH CHECK (public.is_staff_or_admin());

CREATE POLICY "customers_delete_admin"
ON customers FOR DELETE
TO authenticated
USING (public.is_admin());

-- 5. VEHICLES POLICIES
CREATE POLICY "vehicles_select"
ON vehicles FOR SELECT
TO authenticated
USING (public.is_staff_or_admin());

CREATE POLICY "vehicles_insert"
ON vehicles FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin());

CREATE POLICY "vehicles_update"
ON vehicles FOR UPDATE
TO authenticated
USING (public.is_staff_or_admin())
WITH CHECK (public.is_staff_or_admin());

CREATE POLICY "vehicles_delete_admin"
ON vehicles FOR DELETE
TO authenticated
USING (public.is_admin());

-- 6. SERVICES POLICIES (SERVICE CATALOG)
-- Any authenticated staff can read the service catalog.
CREATE POLICY "services_select"
ON services FOR SELECT
TO authenticated
USING (public.is_staff_or_admin());

-- Only ADMIN can modify the catalog. STAFF cannot mutate services.
CREATE POLICY "services_insert_admin"
ON services FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "services_update_admin"
ON services FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "services_delete_admin"
ON services FOR DELETE
TO authenticated
USING (public.is_admin());

-- 7. JOBS POLICIES
CREATE POLICY "jobs_select"
ON jobs FOR SELECT
TO authenticated
USING (public.is_staff_or_admin());

CREATE POLICY "jobs_insert"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin());

-- Staff and Admin can update jobs (status changes, timestamps, etc.).
CREATE POLICY "jobs_update"
ON jobs FOR UPDATE
TO authenticated
USING (public.is_staff_or_admin())
WITH CHECK (public.is_staff_or_admin());

-- STAFF CANNOT DELETE JOBS. Only ADMIN can delete jobs.
CREATE POLICY "jobs_delete_admin"
ON jobs FOR DELETE
TO authenticated
USING (public.is_admin());

-- 8. JOB_SERVICES POLICIES (HISTORICAL PRICING PROTECTION)
CREATE POLICY "job_services_select"
ON job_services FOR SELECT
TO authenticated
USING (public.is_staff_or_admin());

-- Staff can add line items to non-completed jobs. Admin can add anytime.
CREATE POLICY "job_services_insert"
ON job_services FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin() OR (
    public.is_staff_or_admin() AND EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_services.job_id 
        AND jobs.job_status NOT IN ('COMPLETED'::job_status, 'CANCELLED'::job_status)
    )
  )
);

-- UPDATE is blocked for STAFF once a job is COMPLETED or CANCELLED.
-- Only ADMIN can correct prices on completed jobs.
CREATE POLICY "job_services_update"
ON job_services FOR UPDATE
TO authenticated
USING (
  public.is_admin() OR (
    public.is_staff_or_admin() AND EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_services.job_id 
        AND jobs.job_status NOT IN ('COMPLETED'::job_status, 'CANCELLED'::job_status)
    )
  )
)
WITH CHECK (
  public.is_admin() OR (
    public.is_staff_or_admin() AND EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_services.job_id 
        AND jobs.job_status NOT IN ('COMPLETED'::job_status, 'CANCELLED'::job_status)
    )
  )
);

CREATE POLICY "job_services_delete"
ON job_services FOR DELETE
TO authenticated
USING (
  public.is_admin() OR (
    public.is_staff_or_admin() AND EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_services.job_id 
        AND jobs.job_status NOT IN ('COMPLETED'::job_status, 'CANCELLED'::job_status)
    )
  )
);

-- 9. PAYMENTS POLICIES
CREATE POLICY "payments_select"
ON payments FOR SELECT
TO authenticated
USING (public.is_staff_or_admin());

-- Staff can record payments.
CREATE POLICY "payments_insert"
ON payments FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin());

-- Completed payments are immutable for STAFF. Only ADMIN can correct payment records.
CREATE POLICY "payments_update_admin"
ON payments FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "payments_delete_admin"
ON payments FOR DELETE
TO authenticated
USING (public.is_admin());

-- 10. INVENTORY POLICIES
CREATE POLICY "inventory_items_select"
ON inventory_items FOR SELECT
TO authenticated
USING (public.is_staff_or_admin());

-- Only ADMIN can add, edit item definitions, or adjust min/current thresholds directly.
CREATE POLICY "inventory_items_insert_admin"
ON inventory_items FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "inventory_items_update_admin"
ON inventory_items FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "inventory_items_delete_admin"
ON inventory_items FOR DELETE
TO authenticated
USING (public.is_admin());

-- INVENTORY TRANSACTIONS (MANUAL STOCK IN / OUT LEDGER)
CREATE POLICY "inv_transactions_select"
ON inv_transactions FOR SELECT
TO authenticated
USING (public.is_staff_or_admin());

-- Staff can record stock in/out movements.
CREATE POLICY "inv_transactions_insert"
ON inv_transactions FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin());

-- Stock transactions represent an immutable audit trail; updates and deletions are restricted to ADMIN.
CREATE POLICY "inv_transactions_update_admin"
ON inv_transactions FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "inv_transactions_delete_admin"
ON inv_transactions FOR DELETE
TO authenticated
USING (public.is_admin());
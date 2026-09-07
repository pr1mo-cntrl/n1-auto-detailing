-- ENUMS
CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF');
CREATE TYPE vehicle_size AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'X_LARGE', 'UNKNOWN');
CREATE TYPE pricing_enum AS ENUM ('FIXED', 'SIZE_BASED', 'STARTING_AT', 'RANGE', 'ASSESSMENT', 'ADD_ON');
CREATE TYPE job_status AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('UNPAID', 'PAID', 'CANCELLED');
CREATE TYPE payment_method AS ENUM ('CASH', 'GCASH', 'MAYA');
CREATE TYPE transaction_type AS ENUM ('IN', 'OUT');

-- TABLES
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- References auth.users(id)
    role user_role NOT NULL DEFAULT 'STAFF',
    full_name TEXT NOT NULL
);

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    plate_number TEXT, -- Nullable, NOT globally unique
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    size vehicle_size NOT NULL DEFAULT 'UNKNOWN'
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    pricing_model pricing_enum NOT NULL,
    base_price NUMERIC CHECK (base_price >= 0),
    price_metadata JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_number BIGINT GENERATED ALWAYS AS IDENTITY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    job_status job_status NOT NULL DEFAULT 'WAITING',
    payment_status payment_status NOT NULL DEFAULT 'UNPAID',
    total_amount NUMERIC NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

CREATE TABLE job_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    price_charged NUMERIC NOT NULL CHECK (price_charged >= 0),
    notes TEXT
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'PAID',
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    current_qty INT NOT NULL DEFAULT 0 CHECK (current_qty >= 0),
    min_qty INT NOT NULL DEFAULT 0 CHECK (min_qty >= 0)
);

CREATE TABLE inv_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    type transaction_type NOT NULL,
    qty INT NOT NULL CHECK (qty > 0),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_jobs_status ON jobs(job_status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_vehicles_plate_number ON vehicles(plate_number);

-- TRIGGER FUNCTION FOR JOB TOTAL
CREATE OR REPLACE FUNCTION update_job_total_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE jobs
        SET total_amount = COALESCE((SELECT SUM(price_charged) FROM job_services WHERE job_id = OLD.job_id), 0)
        WHERE id = OLD.job_id;
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.job_id != NEW.job_id) THEN
            -- Recalculate the old job if the service was moved to a new job
            UPDATE jobs
            SET total_amount = COALESCE((SELECT SUM(price_charged) FROM job_services WHERE job_id = OLD.job_id), 0)
            WHERE id = OLD.job_id;
        END IF;
        -- Calculate for the new/current job
        UPDATE jobs
        SET total_amount = COALESCE((SELECT SUM(price_charged) FROM job_services WHERE job_id = NEW.job_id), 0)
        WHERE id = NEW.job_id;
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        UPDATE jobs
        SET total_amount = COALESCE((SELECT SUM(price_charged) FROM job_services WHERE job_id = NEW.job_id), 0)
        WHERE id = NEW.job_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_total
AFTER INSERT OR UPDATE OR DELETE ON job_services
FOR EACH ROW EXECUTE FUNCTION update_job_total_amount();
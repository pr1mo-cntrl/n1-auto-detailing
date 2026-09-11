import { createClient } from '@/utils/supabase/server';
import type { JobStatus, VehicleSize, PaymentMethod } from '@/types/database';

export interface JobPaymentDetail {
  id: string;
  amount: number;
  payment_method: PaymentMethod;
  paid_at: string;
  recorded_by?: string;
}

export interface JobQueueItem {
  id: string;
  customer_id: string;
  vehicle_id: string;
  job_status: JobStatus;
  total_amount: number;
  notes: string | null;
  created_at: string;
  customer: {
    id: string;
    name: string;
    contact_number: string | null;
  } | null;
  vehicle: {
    id: string;
    make: string;
    model: string;
    plate_number: string;
    size: VehicleSize;
  } | null;
  payments: JobPaymentDetail | JobPaymentDetail[] | null;
}

export interface JobServiceDetail {
  id: string;
  job_id: string;
  service_id: string;
  price_charged: number;
  created_at: string;
  service: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export interface JobDetail extends Omit<JobQueueItem, 'payments'> {
  customer_confirmed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  updated_at: string;
  job_services: JobServiceDetail[];
  payment: JobPaymentDetail | null;
}

export async function getJobsQueue(): Promise<JobQueueItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      id,
      customer_id,
      vehicle_id,
      job_status,
      total_amount,
      notes,
      created_at,
      customer:customers(id, name, contact_number),
      vehicle:vehicles(id, make, model, plate_number, size),
      payments(id, amount, payment_method, paid_at)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Database query error in getJobsQueue:', error);
    return [];
  }

  return (data as unknown as JobQueueItem[]) || [];
}

export async function getJobById(
  id: string
): Promise<{ data: JobDetail | null; error: Error | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      id,
      customer_id,
      vehicle_id,
      job_status,
      total_amount,
      notes,
      customer_confirmed_at,
      started_at,
      completed_at,
      cancelled_at,
      created_at,
      updated_at,
      customer:customers(id, name, contact_number),
      vehicle:vehicles(id, make, model, plate_number, size),
      job_services(
        id,
        job_id,
        service_id,
        price_charged,
        created_at,
        service:services(id, name, description)
      ),
      payments(id, amount, payment_method, paid_at, recorded_by)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Database query error in getJobById:', error);
    return { data: null, error: new Error(error.message) };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const rawPayments = (data as unknown as { payments: JobPaymentDetail | JobPaymentDetail[] | null }).payments;
  const payment = Array.isArray(rawPayments)
    ? rawPayments[0] || null
    : rawPayments || null;

  const jobDetail: JobDetail = {
    ...(data as unknown as JobDetail),
    payment,
  };

  return { data: jobDetail, error: null };
}
import { createClient } from '@/utils/supabase/server';
import type { Job, JobStatus, VehicleSize } from '@/types/database';

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
    plate_number: string | null;
    size: VehicleSize;
  } | null;
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

export interface JobDetail extends JobQueueItem {
  customer_confirmed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  updated_at: string;
  job_services: JobServiceDetail[];
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
      vehicle:vehicles(id, make, model, plate_number, size)
    `)
    .in('job_status', ['PENDING', 'QUEUED', 'IN_PROGRESS'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching jobs queue:', error);
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
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Database query error in getJobById:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: (data as unknown as JobDetail) || null, error: null };
}

export async function getJobsByVehicleId(vehicleId: string): Promise<Job[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs by vehicle ID:', error);
    return [];
  }
  return data || [];
}
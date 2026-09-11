'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import {
  createJobSchema,
  addJobServiceSchema,
  updateJobStatusSchema,
  type CreateJobInput,
  type AddJobServiceInput,
  type UpdateJobStatusInput,
} from '@/schemas/job';
import { getServicePriceForSize } from '@/lib/data/services';
import type { ActionResponse, Job, JobService, VehicleSize } from '@/types/database';

export async function createJob(input: CreateJobInput): Promise<ActionResponse<Job>> {
  const parsed = createJobSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const supabase = await createClient();

  const { data: vehicle, error: vehicleErr } = await supabase
    .from('vehicles')
    .select('customer_id')
    .eq('id', parsed.data.vehicle_id)
    .maybeSingle();

  if (vehicleErr || !vehicle) {
    return { success: false, error: 'Vehicle not found or lookup failed' };
  }

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .insert({
      customer_id: vehicle.customer_id,
      vehicle_id: parsed.data.vehicle_id,
      notes: parsed.data.notes || null,
    })
    .select()
    .single();

  if (jobErr) {
    return { success: false, error: jobErr.message };
  }

  revalidatePath('/dashboard/jobs');
  return { success: true, data: job };
}

export async function addServiceToJob(
  input: AddJobServiceInput
): Promise<ActionResponse<JobService>> {
  const validated = addJobServiceSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message || 'Invalid input.' };
  }

  const { job_id, service_id, custom_price } = validated.data;
  const supabase = await createClient();

  // 1. Fetch job and vehicle size
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, vehicle_id, vehicle:vehicles(size)')
    .eq('id', job_id)
    .maybeSingle();

  if (jobErr || !job) {
    return { success: false, error: 'Job not found.' };
  }

  // 2. Fetch service to check pricing_type
  const { data: service, error: svcErr } = await supabase
    .from('services')
    .select('id, name, pricing_type, flat_price')
    .eq('id', service_id)
    .maybeSingle();

  if (svcErr || !service) {
    return { success: false, error: 'Service not found.' };
  }

  const vehicleSize = ((job.vehicle as unknown) as { size: VehicleSize } | null)?.size || 'UNKNOWN';

  let finalPrice: number;

  if (service.pricing_type === 'CUSTOM') {
    if (custom_price === undefined || custom_price === null) {
      return {
        success: false,
        error: `A custom quoted price is required for "${service.name}".`,
      };
    }
    finalPrice = custom_price;
  } else {
    // FLAT or SIZE_TIERED lookup
    const catalogPrice = await getServicePriceForSize(service.id, vehicleSize);

    if (catalogPrice !== null) {
      // Authoritative catalog price found — ignore any client-submitted custom_price
      finalPrice = catalogPrice;
    } else {
      // Fallback: No catalog price defined for this size (e.g. Premium Carwash for X_LARGE)
      if (custom_price === undefined || custom_price === null) {
        return {
          success: false,
          error: `No standard price defined for size [${vehicleSize}]. Please enter a custom price.`,
        };
      }
      finalPrice = custom_price;
    }
  }

  // 3. Insert job_service line item
  const { data: jobService, error: insertErr } = await supabase
    .from('job_services')
    .insert({
      job_id,
      service_id,
      price_charged: finalPrice,
    })
    .select()
    .single();

  if (insertErr) {
    return { success: false, error: insertErr.message };
  }

  revalidatePath(`/dashboard/jobs/${job_id}`);
  revalidatePath('/dashboard/jobs');

  return { success: true, data: jobService };
}

export async function removeServiceFromJob(jobServiceId: string): Promise<ActionResponse> {
  const uuidSchema = z.string().uuid('Valid line-item ID is required');
  const parsed = uuidSchema.safeParse(jobServiceId);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid ID' };
  }

  const supabase = await createClient();

  const { data: item } = await supabase
    .from('job_services')
    .select('job_id')
    .eq('id', parsed.data)
    .maybeSingle();

  const { error } = await supabase
    .from('job_services')
    .delete()
    .eq('id', parsed.data);

  if (error) {
    return { success: false, error: error.message };
  }

  if (item?.job_id) {
    revalidatePath(`/dashboard/jobs/${item.job_id}`);
  }
  revalidatePath('/dashboard/jobs');
  return { success: true };
}

export async function updateJobStatus(input: UpdateJobStatusInput): Promise<ActionResponse<Job>> {
  const parsed = updateJobStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid status transition input' };
  }

  const supabase = await createClient();

  if (parsed.data.new_status === 'CANCELLED') {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'ADMIN') {
      return { success: false, error: 'Only managers can cancel a job' };
    }
  }

  const { data: updatedJob, error } = await supabase
    .from('jobs')
    .update({ job_status: parsed.data.new_status })
    .eq('id', parsed.data.job_id)
    .select()
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!updatedJob) {
    return { success: false, error: 'Job not found or update failed' };
  }

  revalidatePath(`/dashboard/jobs/${parsed.data.job_id}`);
  revalidatePath('/dashboard/jobs');
  return { success: true, data: updatedJob };
}

export async function confirmJobByCustomer(jobId: string): Promise<ActionResponse<Job>> {
  const uuidSchema = z.string().uuid('Valid job ID is required');
  const parsed = uuidSchema.safeParse(jobId);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid Job ID' };
  }

  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from('jobs')
    .update({ customer_confirmed_at: new Date().toISOString() })
    .eq('id', parsed.data)
    .eq('job_status', 'PENDING')
    .is('customer_confirmed_at', null)
    .select()
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!job) {
    return {
      success: false,
      error: 'Job could not be confirmed. It may not exist, has already been confirmed, or is no longer in PENDING status.',
    };
  }

  revalidatePath(`/dashboard/jobs/${parsed.data}`);
  revalidatePath('/dashboard/jobs');

  return { success: true, data: job };
}
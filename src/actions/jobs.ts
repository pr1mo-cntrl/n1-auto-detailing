'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import type { ActionResponse, Job, JobService, VehicleSize } from '@/types/database';
import {
  createJobSchema,
  addJobServiceSchema,
  updateJobStatusSchema,
  type CreateJobInput,
  type AddJobServiceInput,
  type UpdateJobStatusInput,
} from '@/schemas/job';
import { getServicePriceForSize } from '@/lib/data/services';

export async function createJob(input: CreateJobInput): Promise<ActionResponse<Job>> {
  const validated = createJobSchema.safeParse(input);
  if (!validated.success) {
    const msg = validated.error.issues[0]?.message || 'Validation failed';
    return { success: false, error: msg };
  }

  const supabase = await createClient();

  const { data: vehicle, error: vehicleErr } = await supabase
    .from('vehicles')
    .select('customer_id')
    .eq('id', validated.data.vehicle_id)
    .maybeSingle();

  if (vehicleErr || !vehicle) {
    return { success: false, error: 'Referenced vehicle not found.' };
  }

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .insert({
      customer_id: vehicle.customer_id,
      vehicle_id: validated.data.vehicle_id,
      notes: validated.data.notes || null,
    })
    .select()
    .single();

  if (jobErr || !job) {
    return { success: false, error: jobErr ? jobErr.message : 'Failed to create job.' };
  }

  revalidatePath('/dashboard/jobs');
  revalidatePath(`/dashboard/customers/${vehicle.customer_id}`);

  return { success: true, data: job };
}

export async function addServiceToJob(
  input: AddJobServiceInput
): Promise<ActionResponse<JobService>> {
  const validated = addJobServiceSchema.safeParse(input);
  if (!validated.success) {
    const msg = validated.error.issues[0]?.message || 'Validation failed';
    return { success: false, error: msg };
  }

  const supabase = await createClient();

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, vehicle:vehicles(size)')
    .eq('id', validated.data.job_id)
    .maybeSingle();

  if (jobErr || !job || !job.vehicle) {
    return { success: false, error: 'Parent job or vehicle details could not be found.' };
  }

  const vehicleObj = job.vehicle as unknown as { size: VehicleSize };
  const vehicleSize = vehicleObj.size;

  const priceCharged = await getServicePriceForSize(validated.data.service_id, vehicleSize);
  if (priceCharged === null) {
    return {
      success: false,
      error: 'No pricing configured for this service and vehicle size.',
    };
  }

  const { data: jobService, error: insertErr } = await supabase
    .from('job_services')
    .insert({
      job_id: validated.data.job_id,
      service_id: validated.data.service_id,
      price_charged: priceCharged,
    })
    .select()
    .single();

  if (insertErr || !jobService) {
    return {
      success: false,
      error: insertErr ? insertErr.message : 'Failed to add service to job.',
    };
  }

  revalidatePath(`/dashboard/jobs/${validated.data.job_id}`);
  revalidatePath('/dashboard/jobs');

  return { success: true, data: jobService };
}

export async function removeServiceFromJob(
  jobServiceId: string
): Promise<ActionResponse<void>> {
  const supabase = await createClient();

  const { data: item, error: fetchErr } = await supabase
    .from('job_services')
    .select('job_id')
    .eq('id', jobServiceId)
    .maybeSingle();

  if (fetchErr || !item) {
    return { success: false, error: 'Job service item not found.' };
  }

  const { error: deleteErr } = await supabase
    .from('job_services')
    .delete()
    .eq('id', jobServiceId);

  if (deleteErr) {
    return { success: false, error: deleteErr.message };
  }

  revalidatePath(`/dashboard/jobs/${item.job_id}`);
  revalidatePath('/dashboard/jobs');

  return { success: true };
}

export async function updateJobStatus(
  input: UpdateJobStatusInput
): Promise<ActionResponse<Job>> {
  const validated = updateJobStatusSchema.safeParse(input);
  if (!validated.success) {
    const msg = validated.error.issues[0]?.message || 'Validation failed';
    return { success: false, error: msg };
  }

  const supabase = await createClient();

  if (validated.data.new_status === 'CANCELLED') {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can cancel a job.' };
    }
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .update({ job_status: validated.data.new_status })
    .eq('id', validated.data.job_id)
    .select()
    .single();

  if (error) {
    const cleanMsg = error.message.replace(/^.*?:\s*/, '');
    return { success: false, error: cleanMsg || error.message };
  }

  revalidatePath('/dashboard/jobs');
  revalidatePath(`/dashboard/jobs/${validated.data.job_id}`);

  return { success: true, data: job };
}
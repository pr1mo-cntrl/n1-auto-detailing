'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import type { ActionResponse, Payment } from '@/types/database';
import { recordPaymentSchema, type RecordPaymentInput } from '@/schemas/payment';

export async function recordPayment(input: RecordPaymentInput): Promise<ActionResponse<Payment>> {
  const validated = recordPaymentSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message || 'Invalid payment input' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Authentication required.' };
  }

  // Authoritative server-side lookup of the job's current total_amount
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, total_amount')
    .eq('id', validated.data.job_id)
    .maybeSingle();

  if (jobErr || !job) {
    return { success: false, error: 'Referenced job not found.' };
  }

  const { data: payment, error: insertErr } = await supabase
    .from('payments')
    .insert({
      job_id: validated.data.job_id,
      amount: job.total_amount,
      payment_method: validated.data.payment_method,
      recorded_by: user.id,
    })
    .select()
    .single();

  if (insertErr) {
    if (insertErr.code === '23505') {
      return { success: false, error: 'This job has already been paid.' };
    }
    return { success: false, error: insertErr.message };
  }

  revalidatePath(`/dashboard/jobs/${validated.data.job_id}`);
  revalidatePath('/dashboard/jobs');

  return { success: true, data: payment };
}
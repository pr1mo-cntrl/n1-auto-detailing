import { createClient } from '@/utils/supabase/server';
import type { Payment } from '@/types/database';

export async function getPaymentByJobId(jobId: string): Promise<Payment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('job_id', jobId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching payment for job:', error);
    return null;
  }
  return data;
}
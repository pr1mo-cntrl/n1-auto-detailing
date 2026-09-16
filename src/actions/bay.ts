'use server';

import { updateJobBay } from '@/lib/data/jobs';
import { revalidatePath } from 'next/cache';

export async function setJobBay(jobId: string, bay: string) {
  await updateJobBay(jobId, bay);
  
  // This tells Next.js to immediately refresh the data on these pages
  revalidatePath('/dashboard/jobs');
  revalidatePath(`/dashboard/jobs/${jobId}`);
}
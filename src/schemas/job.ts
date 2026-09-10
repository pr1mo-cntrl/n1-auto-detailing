import { z } from 'zod';

export const createJobSchema = z.object({
  vehicle_id: z.string().uuid('Valid vehicle ID is required'),
  notes: z.string().trim().optional(),
});

export const addJobServiceSchema = z.object({
  job_id: z.string().uuid('Valid job ID is required'),
  service_id: z.string().uuid('Valid service ID is required'),
});

export const updateJobStatusSchema = z.object({
  job_id: z.string().uuid('Valid job ID is required'),
  new_status: z.enum(['QUEUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type AddJobServiceInput = z.infer<typeof addJobServiceSchema>;
export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;
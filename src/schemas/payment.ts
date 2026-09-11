import { z } from 'zod';

export const recordPaymentSchema = z.object({
  job_id: z.string().uuid('Valid job ID is required'),
  payment_method: z.enum(['CASH', 'GCASH', 'CARD', 'BANK_TRANSFER']),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Customer name cannot be empty')
    .max(100, 'Customer name must not exceed 100 characters'),
  contact_number: z
    .string()
    .trim()
    .max(30, 'Contact number must not exceed 30 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val ?? null)),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
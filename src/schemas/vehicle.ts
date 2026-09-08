import { z } from 'zod';

export const vehicleSizeEnum = z.enum([
  'SMALL',
  'MEDIUM',
  'LARGE',
  'X_LARGE',
  'UNKNOWN',
]);

export const createVehicleSchema = z.object({
  customer_id: z
    .string()
    .uuid('Invalid customer ID format'),
  plate_number: z
    .string()
    .trim()
    .max(20, 'Plate number must not exceed 20 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val ?? null)),
  make: z
    .string()
    .trim()
    .min(1, 'Vehicle make cannot be empty')
    .max(50, 'Vehicle make must not exceed 50 characters'),
  model: z
    .string()
    .trim()
    .min(1, 'Vehicle model cannot be empty')
    .max(50, 'Vehicle model must not exceed 50 characters'),
  size: vehicleSizeEnum.default('UNKNOWN'),
});

export const updateVehicleSchema = createVehicleSchema
  .omit({ customer_id: true })
  .partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
import { z } from 'zod';

export const dateRangePresetSchema = z.enum(['today', 'week', 'month', 'custom']);

export const reportQuerySchema = z.object({
  range: dateRangePresetSchema.optional().default('today'),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
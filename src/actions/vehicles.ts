'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createVehicleSchema, updateVehicleSchema } from '@/schemas/vehicle';
import type { ActionResponse, Vehicle } from '@/types/database';

export async function createVehicle(rawInput: unknown): Promise<ActionResponse<Vehicle>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in.' };
  }

  const parseResult = createVehicleSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message ?? 'Invalid vehicle information.',
    };
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      customer_id: parseResult.data.customer_id,
      plate_number: parseResult.data.plate_number,
      make: parseResult.data.make,
      model: parseResult.data.model,
      size: parseResult.data.size,
    })
    .select('id, customer_id, plate_number, make, model, size')
    .single();

  if (error) {
    console.error('[createVehicle] Insert error:', error.message);
    return { success: false, error: 'Vehicle could not be created.' };
  }

  revalidatePath('/dashboard');
  return { success: true, data: data as Vehicle };
}

export async function updateVehicle(
  id: string,
  rawInput: unknown
): Promise<ActionResponse<Vehicle>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in.' };
  }

  if (!id || typeof id !== 'string') {
    return { success: false, error: 'Invalid vehicle ID.' };
  }

  const parseResult = updateVehicleSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message ?? 'Invalid vehicle information.',
    };
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update(parseResult.data)
    .eq('id', id)
    .select('id, customer_id, plate_number, make, model, size')
    .single();

  if (error) {
    console.error(`[updateVehicle] Update error for ${id}:`, error.message);
    return { success: false, error: 'Vehicle could not be updated.' };
  }

  revalidatePath('/dashboard');
  return { success: true, data: data as Vehicle };
}
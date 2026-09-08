import { createClient } from '@/utils/supabase/server';
import type { Vehicle } from '@/types/database';

export async function getVehiclesByCustomerId(customerId: string): Promise<Vehicle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, customer_id, plate_number, make, model, size')
    .eq('customer_id', customerId);

  if (error) {
    console.error(`[getVehiclesByCustomerId] Query error for Customer ${customerId}:`, error.message);
    return [];
  }

  return (data as Vehicle[]) ?? [];
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, customer_id, plate_number, make, model, size')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(`[getVehicleById] Query error for ID ${id}:`, error.message);
    return null;
  }

  return (data as Vehicle) ?? null;
}
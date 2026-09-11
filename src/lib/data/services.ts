import { createClient } from '@/utils/supabase/server';
import type { Service, VehicleSize } from '@/types/database';

export type ActiveService = Service;

export async function getActiveServices(): Promise<ActiveService[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, pricing_type, flat_price, active, created_at')
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('Error fetching active services:', error);
    return [];
  }

  return data || [];
}

export async function getServicePriceForSize(
  serviceId: string,
  size: VehicleSize
): Promise<number | null> {
  const supabase = await createClient();

  // 1. Fetch the service to inspect pricing_type
  const { data: service, error: svcErr } = await supabase
    .from('services')
    .select('id, pricing_type, flat_price')
    .eq('id', serviceId)
    .maybeSingle();

  if (svcErr || !service) {
    console.error('Error fetching service pricing details:', svcErr);
    return null;
  }

  // 2. Branch according to pricing_type
  if (service.pricing_type === 'FLAT') {
    return service.flat_price !== null ? Number(service.flat_price) : null;
  }

  if (service.pricing_type === 'CUSTOM') {
    // Custom services have no fixed catalog price
    return null;
  }

  // 3. SIZE_TIERED: Look up in service_pricing
  const { data, error } = await supabase
    .from('service_pricing')
    .select('price')
    .eq('service_id', serviceId)
    .eq('vehicle_size', size)
    .maybeSingle();

  if (error || !data) {
    // Either a DB error or no price configured for this size (e.g., X_LARGE fallback)
    return null;
  }

  return Number(data.price);
}
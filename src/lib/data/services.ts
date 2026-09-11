import { createClient } from '@/utils/supabase/server';
import type { Service, VehicleSize } from '@/types/database';

export * from './serviceCategories';

export type ActiveService = Service;

export async function getActiveServices(): Promise<ActiveService[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, pricing_type, flat_price, category, active, created_at')
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('Error fetching active services:', error);
    return [];
  }

  return (data as ActiveService[]) || [];
}

export async function getServicePriceForSize(
  serviceId: string,
  size: VehicleSize
): Promise<number | null> {
  const supabase = await createClient();

  const { data: service, error: svcErr } = await supabase
    .from('services')
    .select('id, pricing_type, flat_price')
    .eq('id', serviceId)
    .maybeSingle();

  if (svcErr || !service) {
    console.error('Error fetching service pricing details:', svcErr);
    return null;
  }

  if (service.pricing_type === 'FLAT') {
    return service.flat_price !== null ? Number(service.flat_price) : null;
  }

  if (service.pricing_type === 'CUSTOM') {
    return null;
  }

  const { data, error } = await supabase
    .from('service_pricing')
    .select('price')
    .eq('service_id', serviceId)
    .eq('vehicle_size', size)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return Number(data.price);
}
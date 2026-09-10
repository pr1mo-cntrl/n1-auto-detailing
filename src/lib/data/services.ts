import { createClient } from '@/utils/supabase/server';
import type { Service, ServicePricing, VehicleSize } from '@/types/database';

export async function getActiveServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching active services:', error);
    return [];
  }
  return data || [];
}

export async function getServicePricing(serviceId: string): Promise<ServicePricing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_pricing')
    .select('*')
    .eq('service_id', serviceId);

  if (error) {
    console.error('Error fetching service pricing:', error);
    return [];
  }
  return data || [];
}

export async function getServicePriceForSize(
  serviceId: string,
  size: VehicleSize
): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_pricing')
    .select('price')
    .eq('service_id', serviceId)
    .eq('vehicle_size', size)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('Error fetching service price for size:', error);
    return null;
  }
  return Number(data.price);
}
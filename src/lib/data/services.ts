import { createClient } from '@/utils/supabase/server';
import type { Service, ServiceCategory, VehicleSize } from '@/types/database';

export type ActiveService = Service;

export const CATEGORY_METADATA: Record<ServiceCategory, { label: string; order: number }> = {
  PREMIUM_CARWASH: { label: 'Premium Carwash', order: 1 },
  ADDITIONAL_SERVICES: { label: 'Additional Services', order: 2 },
  INTERIOR_DETAILING: { label: 'Interior Detailing', order: 3 },
  EXTERIOR_DETAILING: { label: 'Exterior Detailing', order: 4 },
  GLASS_DETAILING: { label: 'Glass Detailing', order: 5 },
  UNDERBODY_DETAILING: { label: 'Underbody Detailing', order: 6 },
  PAINTLESS_DENT_REMOVAL: { label: 'Paintless Dent Removal', order: 7 },
  CERAMIC_COATING: { label: 'Ceramic Coating', order: 8 },
  PAINT_RESTORATION: { label: 'Paint Restoration', order: 9 },
  PPF: { label: 'Paint Protection Film (PPF)', order: 10 },
  WINDOW_TINT: { label: 'Window Tint', order: 11 },
};

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

export function groupServicesByCategory<T extends { category: ServiceCategory }>(
  services: T[]
): Record<ServiceCategory, T[]> {
  const categories: ServiceCategory[] = [
    'PREMIUM_CARWASH',
    'ADDITIONAL_SERVICES',
    'INTERIOR_DETAILING',
    'EXTERIOR_DETAILING',
    'GLASS_DETAILING',
    'UNDERBODY_DETAILING',
    'PAINTLESS_DENT_REMOVAL',
    'CERAMIC_COATING',
    'PAINT_RESTORATION',
    'PPF',
    'WINDOW_TINT',
  ];

  const grouped = {} as Record<ServiceCategory, T[]>;
  for (const cat of categories) {
    grouped[cat] = [];
  }

  for (const service of services) {
    if (grouped[service.category]) {
      grouped[service.category].push(service);
    }
  }

  return grouped;
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
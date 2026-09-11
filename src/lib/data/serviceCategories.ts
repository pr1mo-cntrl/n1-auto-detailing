import type { ServiceCategory } from '@/types/database';

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
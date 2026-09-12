import { createClient } from '@/utils/supabase/server';
import { ServiceCategory, PaymentMethod } from '@/types/database';
export type { PaymentMethod, ServiceCategory };

export interface EarningsSummary {
  totalCollected: number;
  paymentCount: number;
  paymentMethodBreakdown: { method: PaymentMethod; total: number }[];
  categoryBreakdown: { category: ServiceCategory; total: number }[];
}

export const ALL_PAYMENT_METHODS: readonly PaymentMethod[] = [
  'CASH',
  'GCASH',
  'CARD',
  'BANK_TRANSFER',
] as const;

export const ALL_SERVICE_CATEGORIES: ServiceCategory[] = [
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

export async function getEarningsSummary(
  startIsoDate: string,
  endIsoDate: string
): Promise<EarningsSummary> {
  const supabase = await createClient();

  const rangeStartUtc = new Date(`${startIsoDate}T00:00:00+08:00`).toISOString();
  const rangeEndUtc = new Date(`${endIsoDate}T23:59:59.999+08:00`).toISOString();

  // 1. Fetch payments in target date range
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('id, amount, payment_method, job_id')
    .gte('paid_at', rangeStartUtc)
    .lte('paid_at', rangeEndUtc);

  if (paymentsError) {
    throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
  }

  const paymentList = payments || [];
  const totalCollected = paymentList.reduce((acc, p) => acc + Number(p.amount), 0);
  const paymentCount = paymentList.length;

  // 2. Compute paymentMethodBreakdown (guarantee all 4 exist)
  const methodMap = new Map<PaymentMethod, number>();
  ALL_PAYMENT_METHODS.forEach((m) => methodMap.set(m, 0));

  paymentList.forEach((p) => {
    const current = methodMap.get(p.payment_method as PaymentMethod) || 0;
    methodMap.set(p.payment_method as PaymentMethod, current + Number(p.amount));
  });

  const paymentMethodBreakdown = ALL_PAYMENT_METHODS.map((method) => ({
    method,
    total: methodMap.get(method) ?? 0,
  }));

  // 3. Compute categoryBreakdown via job_services of paid jobs
  const categoryMap = new Map<ServiceCategory, number>();
  ALL_SERVICE_CATEGORIES.forEach((c) => categoryMap.set(c, 0));

  const paidJobIds = Array.from(new Set(paymentList.map((p) => p.job_id)));

  if (paidJobIds.length > 0) {
    const { data: jobServicesData, error: servicesError } = await supabase
      .from('job_services')
      .select('price_charged, services(category)')
      .in('job_id', paidJobIds);

    if (servicesError) {
      throw new Error(`Failed to fetch category services: ${servicesError.message}`);
    }

    (jobServicesData || []).forEach((js) => {
      const service = js.services as unknown as { category: ServiceCategory } | null;
      if (service?.category && categoryMap.has(service.category)) {
        const current = categoryMap.get(service.category) || 0;
        categoryMap.set(service.category, current + Number(js.price_charged));
      }
    });
  }

  const categoryBreakdown = ALL_SERVICE_CATEGORIES.map((category) => ({
    category,
    total: categoryMap.get(category) ?? 0,
  })).sort((a, b) => b.total - a.total);

  return {
    totalCollected,
    paymentCount,
    paymentMethodBreakdown,
    categoryBreakdown,
  };
}
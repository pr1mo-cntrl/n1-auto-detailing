import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getVehicleById } from '@/lib/data/vehicles';
import NewJobForm, { type ServiceWithPrice } from '@/components/jobs/NewJobForm';
import { ArrowLeft, Car, User, AlertCircle } from 'lucide-react';
import type { VehicleSize } from '@/types/database';

interface NewJobPageProps {
  searchParams: Promise<{ vehicle_id?: string }>;
}

export default async function NewJobPage({ searchParams }: NewJobPageProps) {
  const resolvedSearchParams = await searchParams;
  const vehicleId = resolvedSearchParams.vehicle_id;

  if (!vehicleId) {
    redirect('/dashboard/jobs');
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vehicleId);
  if (!isUuid) {
    notFound();
  }

  const vehicle = await getVehicleById(vehicleId);

  if (!vehicle) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-xl text-red-300">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span>Vehicle not found</span>
        </div>
        <p className="text-xs text-red-400/80 mt-1">
          The vehicle specified for intake could not be found.
        </p>
        <Link
          href="/dashboard/jobs"
          className="inline-block mt-4 text-xs underline hover:text-red-200"
        >
          Return to Jobs Queue
        </Link>
      </div>
    );
  }

  const supabase = await createClient();

  // Fetch active catalog services with category and size-tiered pricing
  const { data: rawServices } = await supabase
    .from('services')
    .select(
      'id, name, description, pricing_type, flat_price, category, active, created_at, service_pricing(vehicle_size, price)'
    )
    .eq('active', true)
    .order('name');

  const vehicleSize: VehicleSize = vehicle.size || 'UNKNOWN';

  // Map each service's price specifically for this vehicle's size
  const servicesForVehicle: ServiceWithPrice[] = (rawServices || []).map((s) => {
    let resolvedPrice: number | null = null;

    if (s.pricing_type === 'FLAT') {
      resolvedPrice = s.flat_price !== null ? Number(s.flat_price) : 0;
    } else if (s.pricing_type === 'SIZE_TIERED') {
      const tierMatch = Array.isArray(s.service_pricing)
        ? s.service_pricing.find(
            (sp: { vehicle_size: string; price: number }) => sp.vehicle_size === vehicleSize
          )
        : null;
      resolvedPrice = tierMatch ? Number(tierMatch.price) : null;
    } else if (s.pricing_type === 'CUSTOM') {
      resolvedPrice = null;
    }

    return {
      id: s.id,
      name: s.name,
      description: s.description,
      pricing_type: s.pricing_type,
      flat_price: s.flat_price !== null ? Number(s.flat_price) : null,
      category: s.category,
      active: s.active,
      created_at: s.created_at,
      price: resolvedPrice,
    };
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/jobs"
          className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-neutral-100">Job Intake Registration</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Create a new detailing job and configure initial services.
          </p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-800 text-xs">
          <div>
            <span className="text-neutral-500 block flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Customer
            </span>
            <span className="text-neutral-200 font-medium text-sm mt-0.5 block">
              {(vehicle as { customer?: { name?: string; contact_number?: string } }).customer?.name ||
                'Unknown Customer'}
            </span>
            {(vehicle as { customer?: { name?: string; contact_number?: string } }).customer?.contact_number && (
              <span className="text-neutral-400 font-mono block mt-0.5">
                {(vehicle as { customer?: { name?: string; contact_number?: string } }).customer?.contact_number}
              </span>
            )}
          </div>
          <div>
            <span className="text-neutral-500 block flex items-center gap-1">
              <Car className="w-3.5 h-3.5" /> Vehicle
            </span>
            <span className="text-neutral-200 font-medium text-sm mt-0.5 block">
              {vehicle.make} {vehicle.model}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-neutral-400">
                {vehicle.plate_number || 'No Plate'}
              </span>
              <span className="text-emerald-400 font-mono font-semibold">
                [{vehicle.size}]
              </span>
            </div>
          </div>
        </div>

        <NewJobForm vehicleId={vehicle.id} services={servicesForVehicle} />
      </div>
    </div>
  );
}
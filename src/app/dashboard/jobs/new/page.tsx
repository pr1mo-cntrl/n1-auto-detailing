import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { getActiveServices } from '@/lib/data/services';
import NewJobForm from '@/components/jobs/NewJobForm';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import type { VehicleSize } from '@/types/database';

interface NewJobPageProps {
  searchParams: Promise<{ vehicle_id?: string }>;
}

export default async function NewJobPage({ searchParams }: NewJobPageProps) {
  const { vehicle_id } = await searchParams;

  if (!vehicle_id) {
    return (
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
          <AlertCircle className="w-5 h-5" />
          <span>Vehicle selection required</span>
        </div>
        <p className="text-xs text-neutral-400">
          A vehicle must be selected to initiate job intake. Please select a vehicle from the customer directory.
        </p>
        <Link
          href="/dashboard/customers"
          className="inline-block px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
        >
          Go to Customer Directory
        </Link>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      make,
      model,
      plate_number,
      size,
      customer:customers(id, name, contact_number)
    `)
    .eq('id', vehicle_id)
    .maybeSingle();

  if (error || !vehicle) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
          <AlertCircle className="w-5 h-5" />
          <span>Invalid vehicle selected</span>
        </div>
        <p className="text-xs text-neutral-400">
          The specified vehicle ID could not be resolved.
        </p>
        <Link
          href="/dashboard/customers"
          className="inline-block text-xs text-neutral-300 underline"
        >
          Return to Customers
        </Link>
      </div>
    );
  }

  const activeServices = await getActiveServices();
  const { data: pricingRows } = await supabase
    .from('service_pricing')
    .select('service_id, price')
    .eq('vehicle_size', vehicle.size as VehicleSize);

  const priceMap: Record<string, number> = {};
  pricingRows?.forEach((row) => {
    priceMap[row.service_id] = Number(row.price);
  });

  const servicesWithPrices = activeServices.map((s) => ({
    ...s,
    price: priceMap[s.id] ?? 0,
  }));

  const customerData = vehicle.customer as unknown as {
    id: string;
    name: string;
    contact_number: string | null;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/customers/${customerData.id}`}
          className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-neutral-100">Job Intake Registration</h1>
          <p className="text-xs text-neutral-400">
            Create a new detailing job and configure initial services.
          </p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5 text-xs grid grid-cols-2 gap-3">
          <div>
            <span className="text-neutral-500 block">Customer</span>
            <span className="text-neutral-200 font-medium">{customerData.name}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Vehicle</span>
            <span className="text-neutral-200 font-medium">
              {vehicle.make} {vehicle.model}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block">Plate Number</span>
            <span className="font-mono text-neutral-300">{vehicle.plate_number || 'None'}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Size Tier</span>
            <span className="text-emerald-400 font-mono font-semibold">{vehicle.size}</span>
          </div>
        </div>

        <NewJobForm vehicleId={vehicle.id} services={servicesWithPrices} />
      </div>
    </div>
  );
}
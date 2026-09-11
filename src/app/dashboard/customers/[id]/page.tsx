import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCustomerById } from '@/lib/data/customers';
import { getVehiclesByCustomerId } from '@/lib/data/vehicles';
import EditCustomerModal from '@/components/customers/EditCustomerModal';
import AddVehicleModal from '@/components/vehicles/AddVehicleModal';
import EditVehicleModal from '@/components/vehicles/EditVehicleModal';
import VehicleJobAction from '@/components/vehicles/VehicleJobAction';
import { ArrowLeft, User, Phone, Calendar, Car, Hash } from 'lucide-react';
import type { VehicleSize } from '@/types/database';

interface PageProps {
  params: Promise<{ id: string }>;
}

const sizeBadgeColors: Record<VehicleSize, string> = {
  SMALL: 'bg-blue-950 text-blue-300 border-blue-800',
  MEDIUM: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  LARGE: 'bg-amber-950 text-amber-300 border-amber-800',
  X_LARGE: 'bg-purple-950 text-purple-300 border-purple-800',
  UNKNOWN: 'bg-neutral-800 text-neutral-400 border-neutral-700',
};

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  let customer = null;
  let vehicles: Awaited<ReturnType<typeof getVehiclesByCustomerId>> = [];

  try {
    customer = await getCustomerById(id);
    if (customer) {
      vehicles = await getVehiclesByCustomerId(id);
    }
  } catch {
    notFound();
  }

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Directory
        </Link>
      </div>

      {/* Customer Information Panel */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-neutral-800 rounded-full text-emerald-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-100">{customer.name}</h1>
              <p className="text-xs text-neutral-500 font-mono">ID: {customer.id}</p>
            </div>
          </div>
          <EditCustomerModal customer={customer} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className="flex items-center gap-2.5 text-sm text-neutral-300">
            <Phone className="w-4 h-4 text-neutral-500" />
            <span className="text-xs text-neutral-500 uppercase tracking-wider">Contact:</span>
            <span className="font-medium text-neutral-200">
              {customer.contact_number || <span className="italic text-neutral-500 font-normal">Unspecified</span>}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-sm text-neutral-300">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <span className="text-xs text-neutral-500 uppercase tracking-wider">Registered:</span>
            <span className="font-medium text-neutral-200">
              formatLocalDate(customer.created_at)
            </span>
          </div>
        </div>
      </div>

      {/* Customer Vehicles Fleet */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-100">Registered Vehicles</h2>
            <span className="px-2 py-0.5 text-xs bg-neutral-800 text-neutral-400 rounded-full font-medium">
              {vehicles.length}
            </span>
          </div>
          <AddVehicleModal customerId={customer.id} />
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-12 border border-neutral-800 border-dashed rounded-xl bg-neutral-900/30">
            <Car className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
            <h3 className="text-sm font-medium text-neutral-300">No vehicles registered yet</h3>
            <p className="text-xs text-neutral-500 mt-1">
              This customer has no registered vehicles. Register a vehicle to prepare for service intake.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-100">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                      <Hash className="w-3.5 h-3.5 text-neutral-500" />
                      {vehicle.plate_number ? (
                        <span className="font-mono uppercase font-medium text-neutral-200">
                          {vehicle.plate_number}
                        </span>
                      ) : (
                        <span className="italic text-neutral-500">No plate number</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${sizeBadgeColors[vehicle.size]}`}
                  >
                    {vehicle.size}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80">
                  <EditVehicleModal vehicle={vehicle} />
                  <VehicleJobAction vehicle={vehicle} customerName={customer.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
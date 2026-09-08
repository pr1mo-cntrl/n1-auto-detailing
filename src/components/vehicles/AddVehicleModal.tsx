'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createVehicle } from '@/actions/vehicles';
import type { VehicleSize } from '@/types/database';
import { Plus, X, Loader2 } from 'lucide-react';

const VEHICLE_SIZES: { label: string; value: VehicleSize }[] = [
  { label: 'Small (Hatchback / Compact)', value: 'SMALL' },
  { label: 'Medium (Sedan / Small Crossover)', value: 'MEDIUM' },
  { label: 'Large (Mid-Size SUV / Pickup)', value: 'LARGE' },
  { label: 'X-Large (Van / Full-Size SUV)', value: 'X_LARGE' },
  { label: 'Unknown / Unspecified', value: 'UNKNOWN' },
];

export default function AddVehicleModal({ customerId }: { customerId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      customer_id: customerId,
      make: formData.get('make') as string,
      model: formData.get('model') as string,
      plate_number: formData.get('plate_number') as string,
      size: formData.get('size') as VehicleSize,
    };

    startTransition(async () => {
      const result = await createVehicle(payload);
      if (result.success) {
        setIsOpen(false);
        form.reset();
        router.refresh();
      } else {
        setError(result.error || 'Failed to add vehicle');
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Add Vehicle
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <h2 className="text-base font-semibold text-neutral-100">Register Vehicle</h2>
              <button
                onClick={() => !isPending && setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
                disabled={isPending}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 text-sm text-rose-400 bg-rose-950/50 border border-rose-800 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Make *
                  </label>
                  <input
                    name="make"
                    type="text"
                    required
                    placeholder="e.g., Toyota"
                    disabled={isPending}
                    className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Model *
                  </label>
                  <input
                    name="model"
                    type="text"
                    required
                    placeholder="e.g., Vios / Fortuner"
                    disabled={isPending}
                    className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Plate Number
                  </label>
                  <input
                    name="plate_number"
                    type="text"
                    placeholder="e.g., ABC 1234"
                    disabled={isPending}
                    className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 text-sm uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Size Classification *
                  </label>
                  <select
                    name="size"
                    defaultValue="MEDIUM"
                    disabled={isPending}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {VEHICLE_SIZES.map((size) => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-sm text-neutral-300 hover:text-white rounded-lg border border-neutral-800 hover:bg-neutral-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Register Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
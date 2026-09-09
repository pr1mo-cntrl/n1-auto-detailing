'use client';

import { useState, useTransition } from 'react';
import { createVehicle } from '@/actions/vehicles';
import type { VehicleSize } from '@/types/database';
import { Car, Plus, X, Loader2 } from 'lucide-react';

interface AddVehicleModalProps {
  customerId: string;
}

export default function AddVehicleModal({ customerId }: AddVehicleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [size, setSize] = useState<VehicleSize>('MEDIUM');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createVehicle({
        customer_id: customerId,
        make,
        model,
        plate_number: plateNumber ? plateNumber.toUpperCase() : null,
        size,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsOpen(false);
      setMake('');
      setModel('');
      setPlateNumber('');
      setSize('MEDIUM');
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-neutral-700/60 shadow-xs"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Vehicle</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-neutral-100 font-semibold text-sm">
                <Car className="w-4 h-4 text-emerald-400" />
                <span>Register New Vehicle</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 text-xs bg-red-950/60 border border-red-800 text-red-300 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Make <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    disabled={isPending}
                    placeholder="e.g. Toyota"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-600 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Model <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={isPending}
                    placeholder="e.g. Vios"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-600 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Plate Number <span className="text-neutral-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  disabled={isPending}
                  placeholder="e.g. ABC 1234"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 uppercase focus:outline-hidden focus:border-neutral-600 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Vehicle Size Classification <span className="text-red-400">*</span>
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as VehicleSize)}
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-hidden focus:border-neutral-600 disabled:opacity-50"
                >
                  <option value="SMALL">Small (Sedan / Hatchback)</option>
                  <option value="MEDIUM">Medium (Crossover / Compact SUV)</option>
                  <option value="LARGE">Large (Mid-size SUV / Pickup)</option>
                  <option value="X_LARGE">Extra Large (Full-size SUV / Van)</option>
                  <option value="UNKNOWN">Unknown / Unclassified</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <span>Register Vehicle</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
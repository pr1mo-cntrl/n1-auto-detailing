'use client';

import { useState, useTransition } from 'react';
import { updateVehicle } from '@/actions/vehicles';
import type { Vehicle, VehicleSize } from '@/types/database';
import { Pencil, X, Loader2 } from 'lucide-react';

interface EditVehicleModalProps {
  vehicle: Vehicle;
}

export default function EditVehicleModal({ vehicle }: EditVehicleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [make, setMake] = useState(vehicle.make);
  const [model, setModel] = useState(vehicle.model);
  const [plateNumber, setPlateNumber] = useState(vehicle.plate_number || '');
  const [size, setSize] = useState<VehicleSize>(vehicle.size);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateVehicle(vehicle.id, {
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
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
        title="Edit Vehicle"
      >
        <Pencil className="w-3.5 h-3.5" />
        <span>Edit</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-100">Edit Vehicle</h3>
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
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-hidden focus:border-neutral-600 disabled:opacity-50"
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
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-hidden focus:border-neutral-600 disabled:opacity-50"
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
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 uppercase focus:outline-hidden focus:border-neutral-600 disabled:opacity-50"
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
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
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
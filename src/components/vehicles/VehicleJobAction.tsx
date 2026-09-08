'use client';

import { useState } from 'react';
import type { Vehicle } from '@/types/database';
import { Play, X, Wrench, AlertCircle } from 'lucide-react';

interface VehicleJobActionProps {
  vehicle: Vehicle;
  customerName: string;
}

export default function VehicleJobAction({ vehicle, customerName }: VehicleJobActionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
        title={`Initiate job intake for ${vehicle.make} ${vehicle.model}`}
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>Create Job</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-neutral-100 font-semibold text-sm">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <span>Job Intake Handoff</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Customer:</span>
                  <span className="font-medium text-neutral-200">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Vehicle:</span>
                  <span className="font-medium text-neutral-200">
                    {vehicle.make} {vehicle.model}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Plate Number:</span>
                  <span className="font-mono text-neutral-200">
                    {vehicle.plate_number || 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tier / Classification:</span>
                  <span className="font-semibold text-emerald-400">{vehicle.size}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/60 text-neutral-300 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  The Job intake and Queue module is scheduled for implementation in the next phase.
                  This vehicle is configured and ready to be assigned services and pricing tiers.
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
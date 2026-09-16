'use client';

import { useState, useTransition } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { setJobBay } from '@/actions/bay';

const BAY_OPTIONS = [
  'Pending Intake',
  'Wash Bay',
  'Detailing Bay 1',
  'Detailing Bay 2',
  'Ready for Pickup'
];

export default function BayLocationManager({ jobId, currentBay }: { jobId: string, currentBay?: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticBay, setOptimisticBay] = useState(currentBay || 'Pending Intake');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBay = e.target.value;
    setOptimisticBay(newBay); // Updates UI instantly for a snappy feel
    
    startTransition(async () => {
      await setJobBay(jobId, newBay);
    });
  };

  return (
    <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-lg pl-2 pr-1 py-1">
      <MapPin className="w-3.5 h-3.5 text-blue-400" />
      <div className="relative">
        <select
          value={optimisticBay}
          onChange={handleChange}
          disabled={isPending}
          className="appearance-none bg-transparent text-neutral-200 text-xs font-semibold pr-6 py-0.5 focus:outline-none cursor-pointer disabled:opacity-50"
        >
          {BAY_OPTIONS.map(bay => (
            <option key={bay} value={bay} className="bg-neutral-800 text-white">
              {bay}
            </option>
          ))}
        </select>
        {isPending && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
          </div>
        )}
      </div>
    </div>
  );
}
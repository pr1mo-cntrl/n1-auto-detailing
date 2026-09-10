'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createJob, addServiceToJob } from '@/actions/jobs';
import type { Service } from '@/types/database';
import { Check, Loader2 } from 'lucide-react';

interface ServiceWithPrice extends Service {
  price: number;
}

interface NewJobFormProps {
  vehicleId: string;
  services: ServiceWithPrice[];
}

export default function NewJobForm({ vehicleId, services }: NewJobFormProps) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const calculatedTotal = services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create the Job
      const jobRes = await createJob({ vehicle_id: vehicleId, notes });
      if (!jobRes.success) {
        setErrorMsg(jobRes.error || 'Failed to initialize job.');
        setIsSubmitting(false);
        return;
      }

      if (!jobRes.data) {
        setErrorMsg('Job creation did not return a valid record.');
        setIsSubmitting(false);
        return;
      }

      const newJobId = jobRes.data.id;

      // 2. Add selected services
      let partialFailure = false;
      for (const serviceId of selectedServices) {
        const sRes = await addServiceToJob({ job_id: newJobId, service_id: serviceId });
        if (!sRes.success) {
          partialFailure = true;
        }
      }

      if (partialFailure) {
        router.push(`/dashboard/jobs/${newJobId}?warning=partial_services`);
      } else {
        router.push(`/dashboard/jobs/${newJobId}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during submission.';
      setErrorMsg(message);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-xs">
      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 text-red-400 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Service Selection */}
      <div className="space-y-2">
        <label className="font-semibold text-neutral-200 block">Select Detailing Services</label>
        <div className="space-y-2">
          {services.map((s) => {
            const isSelected = selectedServices.includes(s.id);
            return (
              <div
                key={s.id}
                onClick={() => !isSubmitting && toggleService(s.id)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-800/80 border-emerald-500/80 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-neutral-700 bg-neutral-900'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-100">{s.name}</span>
                    {s.description && (
                      <p className="text-[11px] text-neutral-500">{s.description}</p>
                    )}
                  </div>
                </div>
                <span className="font-mono font-medium text-emerald-400">
                  ₱{s.price.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estimated Total Display */}
      <div className="flex justify-between items-center py-2 px-3 bg-neutral-950 rounded-lg border border-neutral-800 font-mono">
        <span className="text-neutral-400">Initial Estimated Total:</span>
        <span className="text-emerald-400 font-bold text-sm">₱{calculatedTotal.toFixed(2)}</span>
      </div>

      {/* Notes Field */}
      <div className="space-y-1.5">
        <label className="font-medium text-neutral-300 block">Job Intake Notes (Optional)</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          placeholder="e.g. Extra focus on front bumper, scratches on driver side..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-neutral-700 disabled:opacity-50"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isSubmitting ? 'Registering Job...' : 'Confirm and Open Job'}</span>
        </button>
      </div>
    </form>
  );
}
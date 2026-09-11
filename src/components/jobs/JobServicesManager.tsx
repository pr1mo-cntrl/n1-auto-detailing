'use client';

import { useState } from 'react';
import { addServiceToJob, removeServiceFromJob } from '@/actions/jobs';
import type { JobServiceDetail } from '@/lib/data/jobs';
import type { Service, JobStatus, VehicleSize } from '@/types/database';
import { Plus, Trash2, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';

interface JobServicesManagerProps {
  jobId: string;
  jobStatus: JobStatus;
  totalAmount: number;
  jobServices: JobServiceDetail[];
  availableServices: Service[];
  vehicleSize?: VehicleSize;
  isPaid?: boolean;
}

export default function JobServicesManager({
  jobId,
  jobStatus,
  totalAmount,
  jobServices,
  availableServices,
  vehicleSize = 'UNKNOWN',
  isPaid = false,
}: JobServicesManagerProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isTerminal = jobStatus === 'COMPLETED' || jobStatus === 'CANCELLED' || isPaid;

  const selectedService = availableServices.find((s) => s.id === selectedServiceId);

  // Check whether selected service requires custom pricing
  const requiresCustomPrice =
    selectedService?.pricing_type === 'CUSTOM' ||
    (selectedService?.pricing_type === 'SIZE_TIERED' &&
      (vehicleSize === 'UNKNOWN' ||
        (selectedService.name === 'Premium Carwash' && vehicleSize === 'X_LARGE') ||
        (selectedService.name === 'Undercoating' && vehicleSize === 'X_LARGE')));

  function getServiceDisplayLabel(svc: Service) {
    if (svc.pricing_type === 'FLAT' && svc.flat_price !== null) {
      return `${svc.name} — ₱${Number(svc.flat_price).toFixed(2)}`;
    }
    if (svc.pricing_type === 'CUSTOM') {
      return `${svc.name} — [Custom Quote]`;
    }
    return `${svc.name} — [Size-Tiered / Varies]`;
  }

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedServiceId || isTerminal) return;

    if (requiresCustomPrice) {
      const parsedPrice = parseFloat(customPrice);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        setErrorMsg('Please enter a valid price greater than or equal to 0.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await addServiceToJob({
        job_id: jobId,
        service_id: selectedServiceId,
        custom_price: requiresCustomPrice ? parseFloat(customPrice) : undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error);
      } else {
        setSelectedServiceId('');
        setCustomPrice('');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveService(jobServiceId: string) {
    if (isTerminal) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await removeServiceFromJob(jobServiceId);
      if (!res.success) {
        setErrorMsg(res.error);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
        <h2 className="text-sm font-semibold text-neutral-200">Services & Pricing</h2>
        <span className="font-mono text-base font-bold text-emerald-400">
          Total: ₱{Number(totalAmount).toFixed(2)}
        </span>
      </div>

      {isPaid && (
        <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>This job has been paid. Services cannot be added or removed.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="divide-y divide-neutral-800/60">
        {jobServices.length === 0 ? (
          <p className="text-xs text-neutral-500 py-3 italic">No services added yet.</p>
        ) : (
          jobServices.map((item) => (
            <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
              <div>
                <span className="text-neutral-200 font-medium">
                  {item.service?.name || 'Custom Service'}
                </span>
                {item.service?.description && (
                  <p className="text-neutral-500 text-[11px] mt-0.5">{item.service.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-neutral-300 font-medium">
                  ₱{Number(item.price_charged).toFixed(2)}
                </span>
                {!isTerminal && (
                  <button
                    onClick={() => handleRemoveService(item.id)}
                    disabled={loading}
                    className="text-neutral-500 hover:text-red-400 disabled:opacity-50 p-1 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {!isTerminal && (
        <form onSubmit={handleAddService} className="pt-3 border-t border-neutral-800/80 space-y-2">
          <div className="flex gap-2">
            <select
              value={selectedServiceId}
              onChange={(e) => {
                setSelectedServiceId(e.target.value);
                setCustomPrice('');
              }}
              disabled={loading}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select a service to add...</option>
              {availableServices.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {getServiceDisplayLabel(svc)}
                </option>
              ))}
            </select>
            {!requiresCustomPrice && (
              <button
                type="submit"
                disabled={loading || !selectedServiceId}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Add</span>
              </button>
            )}
          </div>

          {requiresCustomPrice && (
            <div className="flex gap-2 items-center bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              <div className="flex-1">
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Custom Quoted Price (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter agreed price"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  disabled={loading}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !customPrice}
                className="self-end px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Confirm & Add</span>
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
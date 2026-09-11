'use client';

import { useState } from 'react';
import { addServiceToJob, removeServiceFromJob } from '@/actions/jobs';
import type { JobServiceDetail } from '@/lib/data/jobs';
import type { Service, JobStatus } from '@/types/database';
import { Plus, Trash2, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';

interface JobServicesManagerProps {
  jobId: string;
  jobStatus: JobStatus;
  totalAmount: number;
  jobServices: JobServiceDetail[];
  availableServices: Service[];
  isPaid?: boolean;
}

export default function JobServicesManager({
  jobId,
  jobStatus,
  totalAmount,
  jobServices,
  availableServices,
  isPaid = false,
}: JobServicesManagerProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isTerminal = jobStatus === 'COMPLETED' || jobStatus === 'CANCELLED' || isPaid;

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedServiceId || isTerminal) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await addServiceToJob({
        job_id: jobId,
        service_id: selectedServiceId,
      });

      if (!res.success) {
        setErrorMsg(res.error);
      } else {
        setSelectedServiceId('');
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
                    className="text-neutral-500 hover:text-red-400 disabled:opacity-50 p-1 rounded transition-colors"
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
        <form onSubmit={handleAddService} className="pt-2 border-t border-neutral-800/80 flex gap-2">
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            disabled={loading}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Select a service to add...</option>
            {availableServices.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading || !selectedServiceId}
            className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Add</span>
          </button>
        </form>
      )}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { addServiceToJob, removeServiceFromJob } from '@/actions/jobs';
import type { Service, JobStatus } from '@/types/database';
import type { JobServiceDetail } from '@/lib/data/jobs';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';

interface JobServicesManagerProps {
  jobId: string;
  jobStatus: JobStatus;
  totalAmount: number;
  jobServices: JobServiceDetail[];
  availableServices: Service[];
}

export default function JobServicesManager({
  jobId,
  jobStatus,
  totalAmount,
  jobServices,
  availableServices,
}: JobServicesManagerProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isTerminal = jobStatus === 'COMPLETED' || jobStatus === 'CANCELLED';

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedServiceId) return;

    setIsAdding(true);
    setErrorMsg(null);
    try {
      const res = await addServiceToJob({ job_id: jobId, service_id: selectedServiceId });
      if (!res.success) {
        setErrorMsg(res.error);
      } else {
        setSelectedServiceId('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add service.';
      setErrorMsg(msg);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveService(id: string) {
    setDeletingId(id);
    setErrorMsg(null);
    try {
      const res = await removeServiceFromJob(id);
      if (!res.success) {
        setErrorMsg(res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove service.';
      setErrorMsg(msg);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-200">Services & Line Items</h2>
          <p className="text-xs text-neutral-400">
            Prices are automatically snapshotted per the vehicle size.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-neutral-500 block">Total Amount</span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            ₱{Number(totalAmount).toFixed(2)}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-2.5 rounded-lg">
          {errorMsg}
        </div>
      )}

      {jobServices.length === 0 ? (
        <p className="text-xs text-neutral-500 italic py-3 text-center">
          No services have been added to this job yet.
        </p>
      ) : (
        <div className="divide-y divide-neutral-800/60 text-xs">
          {jobServices.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="text-neutral-200 font-medium">
                  {item.service ? item.service.name : 'Custom Service'}
                </span>
                {item.service?.description && (
                  <p className="text-[11px] text-neutral-500">{item.service.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono font-medium text-neutral-200">
                  ₱{Number(item.price_charged).toFixed(2)}
                </span>
                {!isTerminal && (
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => handleRemoveService(item.id)}
                    className="p-1 text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Remove service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isTerminal && (
        <form
          onSubmit={handleAddService}
          className="pt-3 border-t border-neutral-800/80 flex flex-col sm:flex-row gap-2"
        >
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            disabled={isAdding}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-neutral-700"
          >
            <option value="">-- Select a service to add --</option>
            {availableServices.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isAdding || !selectedServiceId}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Adding...' : 'Add Service'}</span>
          </button>
        </form>
      )}

      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
        <span>Total calculation and pricing snapshots are secured via Postgres triggers.</span>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { confirmJobByCustomer } from '@/actions/jobs';
import type { JobDetail } from '@/lib/data/jobs';
import { CheckCircle2, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';

interface CustomerConfirmationViewProps {
  job: JobDetail;
}

export default function CustomerConfirmationView({ job }: CustomerConfirmationViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await confirmJobByCustomer(job.id);
      if (!res.success) {
        setErrorMsg(res.error);
        setLoading(false);
        return;
      }

      setConfirmed(true);
      setTimeout(() => {
        router.push(`/dashboard/jobs/${job.id}`);
      }, 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-neutral-100 flex flex-col justify-between p-6 md:p-12 overflow-y-auto">
      <div className="flex justify-between items-center max-w-2xl mx-auto w-full">
        <button
          onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
          disabled={loading || confirmed}
          className="text-neutral-500 hover:text-neutral-300 transition-colors text-xs flex items-center gap-1.5 p-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Dashboard</span>
        </button>

        <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Customer Review</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full my-auto py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Please Review Your Services
          </h1>
          <p className="text-sm text-neutral-400">
            Confirm your vehicle specifications and requested services before we begin.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-950/50 border border-red-800 text-red-300 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex justify-between items-center">
          <div>
            <span className="text-xs font-mono uppercase text-neutral-500 block">Vehicle</span>
            <span className="text-lg font-semibold text-white">
              {job.vehicle ? `${job.vehicle.make} ${job.vehicle.model}` : 'Vehicle'}
            </span>
            <span className="text-xs text-neutral-400 block font-mono mt-0.5">
              Plate: {job.vehicle?.plate_number || 'N/A'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono uppercase text-neutral-500 block">Size Class</span>
            <span className="text-sm font-semibold text-emerald-400 font-mono">
              {job.vehicle?.size}
            </span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-3">
            Selected Services
          </h2>

          <div className="divide-y divide-neutral-800/60">
            {job.job_services.length === 0 ? (
              <p className="text-sm text-neutral-500 py-3">No services added to this job.</p>
            ) : (
              job.job_services.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium text-neutral-200">
                      {item.service?.name || 'Custom Service'}
                    </span>
                    {item.service?.description && (
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.service.description}
                      </p>
                    )}
                  </div>
                  <span className="font-mono font-medium text-neutral-200 ml-4">
                    ₱{Number(item.price_charged).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-neutral-800 pt-4 flex justify-between items-center">
            <span className="text-base font-semibold text-neutral-300">Total Due</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">
              ₱{Number(job.total_amount).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {confirmed ? (
            <div className="w-full py-4 px-6 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 rounded-2xl flex items-center justify-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Confirmed! Handing back to staff...</span>
            </div>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-base font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              <span>{loading ? 'Confirming...' : 'I Confirm Services & Total'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-neutral-600 max-w-2xl mx-auto w-full">
        N1 Auto Detailing Service Intake
      </div>
    </div>
  );
}
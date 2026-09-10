'use client';

import { useState } from 'react';
import { updateJobStatus } from '@/actions/jobs';
import type { JobStatus, UserRole } from '@/types/database';
import { Play, CheckCircle2, XCircle, ArrowRight, ShieldAlert } from 'lucide-react';

interface JobStatusTransitionsProps {
  jobId: string;
  currentStatus: JobStatus;
  customerConfirmedAt: string | null;
  userRole: UserRole;
}

export default function JobStatusTransitions({
  jobId,
  currentStatus,
  customerConfirmedAt,
  userRole,
}: JobStatusTransitionsProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleTransition(newStatus: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await updateJobStatus({ job_id: jobId, new_status: newStatus });
      if (!res.success) {
        setErrorMsg(res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
    return (
      <div className="text-xs text-neutral-400 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
        This job is finalized ({currentStatus}) and cannot be transitioned further.
      </div>
    );
  }

  const isPendingAwaitingConfirm = currentStatus === 'PENDING' && !customerConfirmedAt;

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-xs">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        {currentStatus === 'PENDING' && (
          <div className="space-y-1">
            <button
              onClick={() => handleTransition('QUEUED')}
              disabled={loading || isPendingAwaitingConfirm}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Move to Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {isPendingAwaitingConfirm && (
              <span className="text-[11px] text-amber-400/90 flex items-center gap-1 mt-1">
                <ShieldAlert className="w-3 h-3" />
                <span>Awaiting customer confirmation</span>
              </span>
            )}
          </div>
        )}

        {currentStatus === 'QUEUED' && (
          <button
            onClick={() => handleTransition('IN_PROGRESS')}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Start Job</span>
          </button>
        )}

        {currentStatus === 'IN_PROGRESS' && (
          <button
            onClick={() => handleTransition('COMPLETED')}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete Job</span>
          </button>
        )}

        {userRole === 'ADMIN' && (currentStatus === 'PENDING' || currentStatus === 'QUEUED') && (
          <button
            onClick={() => handleTransition('CANCELLED')}
            disabled={loading}
            className="px-3.5 py-2 bg-neutral-950 hover:bg-red-950 border border-neutral-800 hover:border-red-800 text-neutral-400 hover:text-red-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ml-auto"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel Job</span>
          </button>
        )}
      </div>
    </div>
  );
}
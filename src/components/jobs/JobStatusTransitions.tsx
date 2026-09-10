'use client';

import { useState } from 'react';
import { updateJobStatus } from '@/actions/jobs';
import type { JobStatus, UserRole } from '@/types/database';
import { Play, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface JobStatusTransitionsProps {
  jobId: string;
  currentStatus: JobStatus;
  userRole: UserRole;
}

export default function JobStatusTransitions({
  jobId,
  currentStatus,
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
        This job is marked as <strong className="text-neutral-200">{currentStatus}</strong>. No further status changes are permitted.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-2.5 rounded-lg">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 items-center">
        {currentStatus === 'PENDING' && (
          <button
            type="button"
            disabled={loading}
            onClick={() => handleTransition('QUEUED')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>{loading ? 'Updating...' : 'Enqueue Job (QUEUED)'}</span>
          </button>
        )}

        {currentStatus === 'QUEUED' && (
          <button
            type="button"
            disabled={loading}
            onClick={() => handleTransition('IN_PROGRESS')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? 'Updating...' : 'Start Work (IN_PROGRESS)'}</span>
          </button>
        )}

        {currentStatus === 'IN_PROGRESS' && (
          <button
            type="button"
            disabled={loading}
            onClick={() => handleTransition('COMPLETED')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Updating...' : 'Complete Detailing (COMPLETED)'}</span>
          </button>
        )}

        {(currentStatus === 'PENDING' || currentStatus === 'QUEUED') && userRole === 'ADMIN' && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (confirm('Are you sure you want to cancel this job?')) {
                handleTransition('CANCELLED');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{loading ? 'Updating...' : 'Cancel Job'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
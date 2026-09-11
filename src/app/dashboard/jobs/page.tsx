import Link from 'next/link';
import { getJobsQueue } from '@/lib/data/jobs';
import { Plus, Clock, Car, User } from 'lucide-react';

export default async function JobsQueuePage() {
  const jobs = await getJobsQueue();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-neutral-100">Jobs Queue</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time shop floor and intake job tracking
          </p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Intake</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {jobs.length === 0 ? (
          <div className="p-8 text-center bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-500 text-xs">
            No jobs in queue. Register a customer and vehicle to create an intake.
          </div>
        ) : (
          jobs.map((job) => {
            const isPaid = Array.isArray(job.payments)
              ? job.payments.length > 0
              : !!job.payments;

            return (
              <Link
                key={job.id}
                href={`/dashboard/jobs/${job.id}`}
                className="block p-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-neutral-200">
                        #{job.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {job.job_status}
                      </span>
                      {isPaid ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-950/70 border border-emerald-800 text-emerald-300">
                          PAID
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-amber-950/70 border border-amber-800 text-amber-300">
                          UNPAID
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{job.customer?.name || 'Walk-in'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-neutral-500" />
                        <span>
                          {job.vehicle ? `${job.vehicle.make} ${job.vehicle.model}` : 'Vehicle'}{' '}
                          <span className="font-mono text-emerald-400">[{job.vehicle?.size}]</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-2 md:pt-0 border-neutral-800/80">
                    <div className="text-right">
                      <span className="text-[11px] text-neutral-500 block">Total Due</span>
                      <span className="text-sm font-bold font-mono text-emerald-400">
                        ₱{Number(job.total_amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] text-neutral-500 block flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" /> Time
                      </span>
                      <span className="text-xs font-mono text-neutral-400">
                        {new Date(job.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
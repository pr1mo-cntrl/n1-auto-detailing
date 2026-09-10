import Link from 'next/link';
import { getJobsQueue } from '@/lib/data/jobs';
import { ClipboardList, ArrowRight, Clock, Car } from 'lucide-react';

export const metadata = {
  title: 'Jobs Queue | N1 Auto Detailing',
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-950/60 text-amber-400 border border-amber-800/60';
    case 'QUEUED':
      return 'bg-blue-950/60 text-blue-400 border border-blue-800/60';
    case 'IN_PROGRESS':
      return 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60';
    case 'COMPLETED':
      return 'bg-neutral-800 text-neutral-300 border border-neutral-700';
    case 'CANCELLED':
      return 'bg-red-950/60 text-red-400 border border-red-800/60';
    default:
      return 'bg-neutral-800 text-neutral-400 border border-neutral-700';
  }
}

export default async function JobsPage() {
  const jobs = await getJobsQueue();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-emerald-400" />
            <span>Active Jobs Queue</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track active intake, ongoing detailing operations, and stage transitions.
          </p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
          <Car className="w-12 h-12 text-neutral-600 mb-3" />
          <h3 className="text-sm font-semibold text-neutral-200">No active jobs in queue</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm">
            All vehicles have been processed. Go to Customers & Vehicles to initiate a new job.
          </p>
          <Link
            href="/dashboard/customers"
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Go to Customer Directory
          </Link>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/50 text-neutral-400">
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Vehicle</th>
                  <th className="py-3 px-4 font-semibold">Size Tier</th>
                  <th className="py-3 px-4 font-semibold">Total</th>
                  <th className="py-3 px-4 font-semibold">Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${getStatusBadge(
                          job.job_status
                        )}`}
                      >
                        {job.job_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-200">
                      {job.customer ? job.customer.name : 'Unknown Customer'}
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      {job.vehicle ? (
                        <>
                          <span>
                            {job.vehicle.make} {job.vehicle.model}
                          </span>
                          {job.vehicle.plate_number && (
                            <span className="ml-2 font-mono text-neutral-500">
                              ({job.vehicle.plate_number})
                            </span>
                          )}
                        </>
                      ) : (
                        'Unknown Vehicle'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-neutral-400 font-medium">
                        {job.vehicle?.size || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-neutral-200">
                      ₱{Number(job.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-md transition-colors"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
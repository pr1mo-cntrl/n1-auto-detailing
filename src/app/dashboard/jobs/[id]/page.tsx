import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getJobById } from '@/lib/data/jobs';
import { getActiveServices } from '@/lib/data/services';
import JobStatusTransitions from '@/components/jobs/JobStatusTransitions';
import JobServicesManager from '@/components/jobs/JobServicesManager';
import { ArrowLeft, Clock, AlertCircle, Tablet, CheckCircle2 } from 'lucide-react';
import type { UserRole } from '@/types/database';

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) {
    notFound();
  }

  const { data: job, error } = await getJobById(id);

  if (error) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-xl text-red-300">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span>Error loading job</span>
        </div>
        <p className="text-xs text-red-400/80 mt-1">{error.message}</p>
        <Link
          href="/dashboard/jobs"
          className="inline-block mt-4 text-xs underline hover:text-red-200"
        >
          Return to Jobs Queue
        </Link>
      </div>
    );
  }

  if (!job) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: UserRole = 'STAFF';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role === 'ADMIN') userRole = 'ADMIN';
  }

  const activeServices = await getActiveServices();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/jobs"
            className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-3">
              <span>Job #{job.id.slice(0, 8)}</span>
              <span className="text-xs px-2.5 py-0.5 rounded font-mono font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                {job.job_status}
              </span>
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Registered: {new Date(job.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {job.job_status === 'PENDING' && !job.customer_confirmed_at && (
          <Link
            href={`/dashboard/jobs/${job.id}/confirm`}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <Tablet className="w-4 h-4" />
            <span>Show Customer for Confirmation</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-200 border-b border-neutral-800 pb-3">
              Vehicle & Customer
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-neutral-500 block">Customer</span>
                <span className="text-neutral-200 font-medium text-sm">
                  {job.customer ? job.customer.name : 'Unknown Customer'}
                </span>
                {job.customer?.contact_number && (
                  <span className="text-neutral-400 block mt-0.5 font-mono">
                    {job.customer.contact_number}
                  </span>
                )}
              </div>
              <div className="pt-2 border-t border-neutral-800/60">
                <span className="text-neutral-500 block">Vehicle</span>
                <span className="text-neutral-200 font-medium">
                  {job.vehicle ? `${job.vehicle.make} ${job.vehicle.model}` : 'Unknown Vehicle'}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-neutral-400">
                    {job.vehicle?.plate_number || 'No Plate'}
                  </span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    [{job.vehicle?.size}]
                  </span>
                </div>
              </div>
              {job.notes && (
                <div className="pt-2 border-t border-neutral-800/60">
                  <span className="text-neutral-500 block">Intake Notes</span>
                  <p className="text-neutral-300 italic mt-0.5">{job.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3 text-xs">
            <h2 className="text-sm font-semibold text-neutral-200 border-b border-neutral-800 pb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span>Timeline History</span>
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">Created:</span>
                <span className="text-neutral-300">{new Date(job.created_at).toLocaleTimeString()}</span>
              </div>
              {job.customer_confirmed_at && (
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Customer Confirmed:</span>
                  </span>
                  <span>{new Date(job.customer_confirmed_at).toLocaleTimeString()}</span>
                </div>
              )}
              {job.started_at && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Started:</span>
                  <span className="text-emerald-400">{new Date(job.started_at).toLocaleTimeString()}</span>
                </div>
              )}
              {job.completed_at && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Completed:</span>
                  <span className="text-blue-400">{new Date(job.completed_at).toLocaleTimeString()}</span>
                </div>
              )}
              {job.cancelled_at && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Cancelled:</span>
                  <span className="text-red-400">{new Date(job.cancelled_at).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-neutral-200 mb-3">Workflow Controls</h2>
            <JobStatusTransitions
              jobId={job.id}
              currentStatus={job.job_status}
              customerConfirmedAt={job.customer_confirmed_at}
              userRole={userRole}
            />
          </div>

          <JobServicesManager
            jobId={job.id}
            jobStatus={job.job_status}
            totalAmount={job.total_amount}
            jobServices={job.job_services}
            availableServices={activeServices}
          />
        </div>
      </div>
    </div>
  );
}
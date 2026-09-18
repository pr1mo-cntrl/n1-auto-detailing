import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { logout } from '@/app/login/actions';
import Link from 'next/link';
import { ClipboardList, Users, BarChart3, ArrowRight } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* 1. Existing Welcome Card */}
      <div className="max-w-xl space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6 shadow-md">
        <div>
          <h1 className="text-xl font-bold text-white">N1 Auto Detailing</h1>
          <p className="text-xs text-neutral-400">Dashboard Overview</p>
        </div>

        <div className="space-y-1 border-t border-neutral-800 pt-4 text-sm">
          <p>
            Welcome, <span className="font-semibold text-white">{profile?.full_name ?? user.email}</span>
          </p>
          <p>
            Assigned Role: <span className="font-semibold text-emerald-400">{profile?.role ?? 'STAFF'}</span>
          </p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="rounded border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </form>
      </div>

      {/* 2. Quick Actions Grid */}
      <div className="max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        {/* Jobs Queue Card */}
        <Link 
          href="/dashboard/jobs"
          className="group flex flex-col p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Jobs Queue</h3>
          <p className="text-sm text-neutral-400">
            View active shop floor work orders, update bay locations, and process payments.
          </p>
        </Link>

        {/* Customers & Intake Card */}
        <Link 
          href="/dashboard/customers"
          className="group flex flex-col p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Customers & Intake</h3>
          <p className="text-sm text-neutral-400">
            Search existing profiles, register new vehicles, and create new work orders.
          </p>
        </Link>

        {/* Admin Reports Card (Only visible to ADMIN) */}
        {isAdmin && (
          <Link 
            href="/dashboard/reports"
            className="group flex flex-col p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Shop Reports</h3>
            <p className="text-sm text-neutral-400">
              View shop analytics, revenue summaries, and staff performance metrics.
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
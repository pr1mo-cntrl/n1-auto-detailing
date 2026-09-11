import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { logout } from '@/app/login/actions';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, ClipboardList, Users, ShieldCheck, LogOut } from 'lucide-react';

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
    .single();

  return (
    <div className="space-y-6">
      {/* Brand Hero & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="space-y-1">
          <h1 className="font-['Brush_Script_MT',cursive] text-4xl sm:text-5xl text-neutral-100 tracking-wide select-none italic">
            N1 Auto Detailing
          </h1>
          <p className="text-xs sm:text-sm italic font-medium tracking-wide text-neutral-400">
            &ldquo;Driven by Detail, Defined by Performance&rdquo;
          </p>
        </div>

        <div>
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm rounded-xl transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Customer / Intake</span>
          </Link>
        </div>
      </div>

      {/* Profile & Auth Status Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-neutral-100">
              {profile?.full_name ?? 'Employee'}
            </span>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
              {profile?.role ?? 'STAFF'}
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Active session logged in as <span className="font-mono text-neutral-300">{user.email}</span>
          </p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </form>
      </div>

      {/* Navigation Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/jobs"
          className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-5 rounded-xl transition-colors group block"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-800 rounded-lg text-emerald-400 group-hover:bg-neutral-700 transition-colors">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-200 group-hover:text-emerald-400 transition-colors">
                Jobs Queue
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Track active vehicles on the detailing bay
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/customers"
          className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-5 rounded-xl transition-colors group block"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-neutral-800 rounded-lg text-emerald-400 group-hover:bg-neutral-700 transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-200 group-hover:text-emerald-400 transition-colors">
                Customers & Vehicles
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Manage registered customer profiles and vehicle fleet
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
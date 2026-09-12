import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { logout } from '@/app/login/actions';

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

  return (
    <div className="max-w-xl space-y-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
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
          className="rounded border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
        >
          Logout
        </button>
      </form>
    </div>
  );
}
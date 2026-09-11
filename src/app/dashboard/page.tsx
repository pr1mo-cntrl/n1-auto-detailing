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
    .single();

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <div className="max-w-xl space-y-6 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div>
          <h1 className="text-xl font-bold">N1 Auto Detailing</h1>
          <p className="text-xs text-zinc-400">Step 2C Verification View</p>
        </div>

        <div className="space-y-1 border-t border-zinc-800 pt-4 text-sm">
          <p>
            Welcome, <span className="font-semibold text-white">{profile?.full_name ?? 'Employee'}</span>
          </p>
          <p>
            Assigned Role: <span className="font-semibold text-white">{profile?.role ?? 'STAFF'}</span>
          </p>
          <p className="text-emerald-400">Authentication is active and verified.</p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="rounded border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
          >
            Logout
          </button>
        </form>
      </div>
    </main>
  );
}
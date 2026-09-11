import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Car, Users, LayoutDashboard, ClipboardList } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
              <Car className="w-5 h-5" />
              <span>N1 Auto Detailing</span>
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-neutral-400" />
                <span>Overview</span>
              </Link>
              <Link
                href="/dashboard/jobs"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <ClipboardList className="w-4 h-4 text-neutral-400" />
                <span>Jobs Queue</span>
              </Link>
              <Link
                href="/dashboard/customers"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <Users className="w-4 h-4 text-neutral-400" />
                <span>Customers & Vehicles</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 hidden sm:inline-block font-mono">
              {user.email}
            </span>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
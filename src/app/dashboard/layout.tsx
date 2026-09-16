import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Car, LayoutDashboard, ClipboardList, Users, BarChart3 } from 'lucide-react';

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

  // 1. Fetch the user's profile to check their role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation */}
      <header className="border-b border-neutral-800 bg-neutral-950 px-6 py-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
            <Car className="w-5 h-5" />
            <span>N1 Auto Detailing</span>
          </Link>
          
          <nav className="flex items-center gap-6 text-neutral-400 font-medium">
            <Link href="/dashboard" className="flex items-center gap-2 hover:text-white transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </Link>
            <Link href="/dashboard/jobs" className="flex items-center gap-2 hover:text-white transition-colors">
              <ClipboardList className="w-4 h-4" />
              Jobs Queue
            </Link>
            <Link href="/dashboard/customers" className="flex items-center gap-2 hover:text-white transition-colors">
              <Users className="w-4 h-4" />
              Customers & Vehicles
            </Link>
            
            {/* 2. Conditionally render the Reports link ONLY for Admins */}
            {isAdmin && (
              <Link href="/dashboard/reports" className="flex items-center gap-2 hover:text-white transition-colors">
                <BarChart3 className="w-4 h-4" />
                Reports
              </Link>
            )}
          </nav>
        </div>

        <div className="text-neutral-500 font-mono text-xs">
          {user.email}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
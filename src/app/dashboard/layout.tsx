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
      {/* Top Navigation - Ultra Compact Single Row */}
      <header className="border-b border-neutral-800 bg-neutral-950 px-4 md:px-6 py-3 flex items-center justify-between text-sm">
        
        {/* Left Side: Logo (Always shows full text now) */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-emerald-500 hover:text-emerald-400 transition-colors shrink-0">
          <Car className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">N1 Auto Detailing</span>
        </Link>
        
        {/* Right Side: Navigation (Icons only on mobile, Icons + Text on Desktop) */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-5 md:gap-6 text-neutral-400 font-medium">
            <Link href="/dashboard" className="flex items-center gap-2 hover:text-white transition-colors" title="Overview">
              <LayoutDashboard className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline">Overview</span>
            </Link>
            <Link href="/dashboard/jobs" className="flex items-center gap-2 hover:text-white transition-colors" title="Jobs Queue">
              <ClipboardList className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline">Jobs Queue</span>
            </Link>
            <Link href="/dashboard/customers" className="flex items-center gap-2 hover:text-white transition-colors" title="Customers & Vehicles">
              <Users className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline">Customers</span>
            </Link>
            
            {isAdmin && (
              <Link href="/dashboard/reports" className="flex items-center gap-2 hover:text-white transition-colors" title="Reports">
                <BarChart3 className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden md:inline">Reports</span>
              </Link>
            )}
          </nav>

          {/* Desktop Email Display */}
          <div className="hidden lg:block text-neutral-600 font-mono text-xs pl-4 border-l border-neutral-800">
            {user.email}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
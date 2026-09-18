import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Car } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';

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
          
          {/* Injecting the new Client Component here */}
          <DashboardNav isAdmin={isAdmin} />

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
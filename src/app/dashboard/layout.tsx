import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Users, LayoutDashboard, ClipboardList } from 'lucide-react';

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-0 sm:h-16 gap-2 sm:gap-4">
            
            {/* Logo Brand Section */}
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center group">
                <Image
                  src="/n1-logo.png"
                  alt="N1 Auto Detailing"
                  width={140}
                  height={42}
                  className="h-8 sm:h-9 w-auto object-contain brightness-95 group-hover:brightness-110 transition-all"
                  priority
                />
              </Link>

              {/* Email badge shown only on mobile top-right */}
              <span className="text-[11px] text-neutral-400 sm:hidden font-mono truncate max-w-[140px]">
                {user.email}
              </span>
            </div>

            {/* Navigation & Desktop User Identity */}
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              <nav className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap"
                >
                  <LayoutDashboard className="w-4 h-4 text-neutral-400" />
                  <span>Overview</span>
                </Link>
                <Link
                  href="/dashboard/jobs"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap"
                >
                  <ClipboardList className="w-4 h-4 text-neutral-400" />
                  <span>Jobs Queue</span>
                </Link>
                <Link
                  href="/dashboard/customers"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors whitespace-nowrap"
                >
                  <Users className="w-4 h-4 text-neutral-400" />
                  <span>Customers & Vehicles</span>
                </Link>
              </nav>

              {/* Email badge for tablet/desktop */}
              <span className="text-xs text-neutral-400 hidden sm:inline-block font-mono">
                {user.email}
              </span>
            </div>

          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
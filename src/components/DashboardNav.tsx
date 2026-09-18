'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, Users, BarChart3 } from 'lucide-react';

export default function DashboardNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  // If the user is exactly on the main dashboard page, hide the navigation links
  if (pathname === '/dashboard') {
    return null;
  }

  return (
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
  );
}
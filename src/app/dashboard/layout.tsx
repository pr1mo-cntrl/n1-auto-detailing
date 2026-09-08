import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-lg font-bold tracking-tight text-white">
              N1 Auto Detailing
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link
                href="/dashboard"
                className="text-neutral-400 hover:text-neutral-100 transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/dashboard/customers"
                className="text-neutral-400 hover:text-neutral-100 transition-colors"
              >
                Customers & Vehicles
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
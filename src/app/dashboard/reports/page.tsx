import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getEarningsSummary } from '@/lib/data/reports';
import { reportQuerySchema } from '@/schemas/reports';
import EarningsSummaryView from '@/components/reports/EarningsSummaryView';

interface ReportsPageProps {
  searchParams: Promise<{
    range?: string;
    start?: string;
    end?: string;
  }>;
}

function getManilaDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // RLS & Guard: Only Admins can view this page
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const rawParams = await searchParams;
  const parsed = reportQuerySchema.safeParse(rawParams);
  const validated = parsed.success ? parsed.data : { range: 'today' as const };

  const now = new Date();
  const todayManila = getManilaDateString(now);

  let startIso = todayManila;
  let endIso = todayManila;

  // Handle date presets
  if (validated.range === 'week') {
    const d = new Date(now);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));
    const sunday = new Date(d.setDate(monday.getDate() + 6));
    startIso = getManilaDateString(monday);
    endIso = getManilaDateString(sunday);
  } else if (validated.range === 'month') {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(now);
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    startIso = `${year}-${month}-01`;
    const nextMonth = new Date(Number(year), Number(month), 0);
    endIso = `${year}-${month}-${String(nextMonth.getDate()).padStart(2, '0')}`;
  } else if (validated.range === 'custom' && validated.start && validated.end) {
    startIso = validated.start;
    endIso = validated.end;
  }

  const earnings = await getEarningsSummary(startIso, endIso);

  return (
    <EarningsSummaryView
      data={earnings}
      selectedRange={validated.range}
      startDate={startIso}
      endDate={endIso}
    />
  );
}
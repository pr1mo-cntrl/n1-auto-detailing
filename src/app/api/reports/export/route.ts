import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDetailedPayments, PaymentMethod } from '@/lib/data/reports';
import { formatLocalDate, formatLocalTime } from '@/utils/formatDate';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Admin role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start') || new Date().toISOString().split('T')[0];
  const end = searchParams.get('end') || start;
  const method = (searchParams.get('method') as PaymentMethod) || undefined;

  const records = await getDetailedPayments(start, end, method);

  // Build CSV content
  const headers = [
    'Payment ID',
    'Date (PST)',
    'Time (PST)',
    'Customer',
    'Plate Number',
    'Services',
    'Payment Method',
    'Amount (PHP)',
  ];

  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${formatLocalDate(r.paidAt)}"`,
    `"${formatLocalTime(r.paidAt)}"`,
    `"${r.customerName.replace(/"/g, '""')}"`,
    `"${r.plateNumber}"`,
    `"${r.servicesList.replace(/"/g, '""')}"`,
    `"${r.paymentMethod}"`,
    r.amount.toFixed(2),
  ]);

  const csvString = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  return new NextResponse(csvString, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="n1-financial-report-${start}-to-${end}.csv"`,
    },
  });
}
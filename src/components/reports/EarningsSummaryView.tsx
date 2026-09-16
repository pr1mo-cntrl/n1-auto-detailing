'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { EarningsSummary } from '@/lib/data/reports';
import {
  Banknote,
  CreditCard,
  Landmark,
  QrCode,
  TrendingUp,
  CalendarDays,
  ArrowRight,
  Download,
  Printer,
} from 'lucide-react';

interface EarningsSummaryViewProps {
  data: EarningsSummary;
  selectedRange: string;
  startDate: string;
  endDate: string;
}

export default function EarningsSummaryView({
  data,
  selectedRange,
  startDate,
  endDate,
}: EarningsSummaryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const handlePresetChange = (preset: 'today' | 'week' | 'month') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', preset);
    params.delete('start');
    params.delete('end');
    router.push(`/dashboard/reports?${params.toString()}`);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    const params = new URLSearchParams();
    params.set('range', 'custom');
    params.set('start', customStart);
    params.set('end', customEnd);
    router.push(`/dashboard/reports?${params.toString()}`);
  };

  const handleDownloadCsv = () => {
    const url = `/api/reports/export?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const methodIcons = {
    CASH: <Banknote className="w-4 h-4 text-emerald-400" />,
    GCASH: <QrCode className="w-4 h-4 text-blue-400" />,
    CARD: <CreditCard className="w-4 h-4 text-purple-400" />,
    BANK_TRANSFER: <Landmark className="w-4 h-4 text-amber-400" />,
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Action Bar (Hidden on Print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Financial & Earnings Reports
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Period: <span className="text-neutral-200 font-mono">{startDate}</span> to{' '}
            <span className="text-neutral-200 font-mono">{endDate}</span> (Asia/Manila)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          {(['today', 'week', 'month'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                selectedRange === preset
                  ? 'bg-emerald-500 text-neutral-950 font-semibold'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {preset === 'today' ? 'Today' : preset === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}

          <div className="h-4 w-px bg-neutral-700 mx-1 hidden sm:block" />

          {/* Export Actions */}
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors border border-neutral-700"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors border border-neutral-700"
            title="Print Closeout Summary"
          >
            <Printer className="w-3.5 h-3.5 text-neutral-300" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block border-b border-black pb-4 mb-4 text-black">
        <h1 className="text-xl font-bold uppercase tracking-wide">N1 Auto Detailing — Daily Closeout (Z-Reading)</h1>
        <p className="text-xs">Period: {startDate} to {endDate} (PST / Asia/Manila)</p>
      </div>

      {/* Custom Range Filter (Hidden on Print) */}
      <form
        onSubmit={handleApplyCustom}
        className="flex flex-wrap items-center gap-3 bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl text-xs print:hidden"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-neutral-500" />
          <span className="text-neutral-400 font-medium">Custom Range:</span>
        </div>
        <input
          type="date"
          value={customStart}
          onChange={(e) => setCustomStart(e.target.value)}
          className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-neutral-200 focus:outline-none focus:border-emerald-500"
          required
        />
        <span className="text-neutral-500">to</span>
        <input
          type="date"
          value={customEnd}
          onChange={(e) => setCustomEnd(e.target.value)}
          className="bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-neutral-200 focus:outline-none focus:border-emerald-500"
          required
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 px-3 py-1 rounded-lg transition-colors font-medium ml-auto sm:ml-0"
        >
          <span>Apply</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:text-black">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-1 print:bg-white print:border-black">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider print:text-black">
            Total Revenue Collected
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-neutral-100 font-mono print:text-black">
            {formatCurrency(data.totalCollected)}
          </p>
          <p className="text-[11px] text-neutral-500 print:text-gray-600">Excludes uncompleted / unpaid balances</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-1 print:bg-white print:border-black">
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider print:text-black">
            Payments Processed
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-neutral-100 font-mono print:text-black">
            {data.paymentCount} <span className="text-sm font-normal text-neutral-400 print:text-black">transactions</span>
          </p>
          <p className="text-[11px] text-neutral-500 print:text-gray-600">Settled through verified channels</p>
        </div>
      </div>

      {data.totalCollected === 0 ? (
        <div className="text-center py-12 border border-neutral-800 border-dashed rounded-xl bg-neutral-900/30">
          <CalendarDays className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
          <p className="text-sm font-semibold text-neutral-300">No payments recorded yet for this period</p>
          <p className="text-xs text-neutral-500 mt-1">Try switching presets or picking a broader date range.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:text-black">
          {/* Payment Method Breakdown */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 print:bg-white print:border-black">
            <h2 className="text-sm font-semibold text-neutral-200 border-b border-neutral-800 pb-2.5 print:text-black print:border-black">
              Payment Methods
            </h2>
            <div className="space-y-3">
              {data.paymentMethodBreakdown.map((item) => (
                <div key={item.method} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-neutral-300 font-medium print:text-black">
                    <span className="print:hidden">{methodIcons[item.method]}</span>
                    <span>{item.method.replace('_', ' ')}</span>
                  </div>
                  <span className="font-mono font-medium text-neutral-100 print:text-black">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Service Category Breakdown */}
          <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 print:bg-white print:border-black">
            <h2 className="text-sm font-semibold text-neutral-200 border-b border-neutral-800 pb-2.5 print:text-black print:border-black">
              Revenue by Service Category
            </h2>
            <div className="space-y-2.5">
              {data.categoryBreakdown.map((item) => {
                const percentage = data.totalCollected > 0 ? (item.total / data.totalCollected) * 100 : 0;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-neutral-300 capitalize print:text-black">
                        {item.category.toLowerCase().replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-neutral-100 print:text-black">
                        {formatCurrency(item.total)}{' '}
                        <span className="text-neutral-500 text-[10px] print:text-gray-600">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden print:hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
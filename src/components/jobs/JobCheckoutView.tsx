'use client';

import { Printer, ArrowLeft, CheckCircle2, Receipt } from 'lucide-react';
import Link from 'next/link';

// 1. Updated interface to anticipate Supabase arrays or singular aliases
interface CheckoutJobService {
  id: string;
  price_charged: number;
  services?: { name: string } | { name: string }[] | null;
  service?: { name: string } | null;
}

interface CheckoutJobDetails {
  id: string;
  created_at: string;
  total_amount: number;
  customer: { name: string; contact_number: string | null } | null;
  vehicle: { make: string; model: string; size: string; plate_number: string | null } | null;
  job_services: CheckoutJobService[] | null;
  payment: { amount: number; payment_method: string } | null;
}

export default function JobCheckoutView({ job }: { job: CheckoutJobDetails }) {
  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateStr));

  const isPaid = !!job.payment;

  // Helper to safely extract the name regardless of Supabase's return shape
  const getServiceName = (js: CheckoutJobService) => {
    if (Array.isArray(js.services)) return js.services[0]?.name;
    if (js.services && !Array.isArray(js.services)) return js.services.name;
    if (js.service) return js.service.name;
    return 'Unknown Service';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/dashboard/jobs/${job.id}`}
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Job Details
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-900 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
      </div>

      {/* Screen View */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden print:hidden">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              Work Order Summary
            </h1>
            <p className="text-sm text-neutral-400 mt-1">ID: {job.id.split('-')[0]}</p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              {isPaid ? 'Fully Paid' : 'Pending Payment'}
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6 border-b border-neutral-800">
          <div>
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-1">Customer</p>
            <p className="text-sm font-semibold text-neutral-200">{job.customer?.name || 'Walk-in'}</p>
            <p className="text-sm text-neutral-400">{job.customer?.contact_number || 'No contact provided'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-1">Vehicle</p>
            <p className="text-sm font-semibold text-neutral-200">
              {job.vehicle?.make} {job.vehicle?.model} ({job.vehicle?.size})
            </p>
            <p className="text-sm text-neutral-400 font-mono">{job.vehicle?.plate_number || 'NO PLATE'}</p>
          </div>
        </div>

        <div className="p-6">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-4">Services Rendered</p>
          <div className="space-y-3">
            {job.job_services?.map((js) => (
              <div key={js.id} className="flex justify-between items-center text-sm">
                <span className="text-neutral-300">{getServiceName(js)}</span>
                <span className="font-mono text-neutral-200">{formatCurrency(js.price_charged)}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-between items-center">
            <span className="text-base font-medium text-neutral-300">Total Amount</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{formatCurrency(job.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* PRINT VIEW */}
      <div className="hidden print:block text-black bg-white w-full max-w-[80mm] mx-auto text-sm font-sans">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold uppercase tracking-tight">N1 Auto Detailing</h2>
          <p className="text-xs">Baguio City, Philippines</p>
          <p className="text-xs mt-1">Receipt / Work Order</p>
          <p className="text-xs text-gray-500 mt-2">{formatDate(job.created_at)}</p>
          <p className="text-xs text-gray-500">Order #: {job.id.split('-')[0].toUpperCase()}</p>
        </div>

        <div className="border-t border-b border-black border-dashed py-2 mb-4 space-y-1">
          <p className="text-xs"><span className="font-semibold">Customer:</span> {job.customer?.name || 'Walk-in'}</p>
          <p className="text-xs"><span className="font-semibold">Vehicle:</span> {job.vehicle?.make} {job.vehicle?.model}</p>
          <p className="text-xs"><span className="font-semibold">Plate:</span> {job.vehicle?.plate_number || 'N/A'}</p>
        </div>

        <div className="mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-1 font-semibold">Service</th>
                <th className="text-right py-1 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {job.job_services?.map((js) => (
                <tr key={js.id}>
                  <td className="py-1 pr-2 break-words">{getServiceName(js)}</td>
                  <td className="py-1 text-right whitespace-nowrap">{formatCurrency(js.price_charged)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-black pt-2 mb-4">
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL</span>
            <span>{formatCurrency(job.total_amount)}</span>
          </div>
        </div>

        {isPaid && job.payment && (
          <div className="mb-4 text-xs">
            <p className="font-semibold border-b border-black mb-1">Payment</p>
            <div className="flex justify-between">
              <span>{job.payment.payment_method.replace('_', ' ')}</span>
              <span>{formatCurrency(job.payment.amount)}</span>
            </div>
          </div>
        )}

        <div className="text-center text-xs mt-8 mb-2 flex flex-col items-center">
          {isPaid ? (
            <>
              <CheckCircle2 className="w-6 h-6 mb-1 text-black" />
              <p className="font-bold">PAID IN FULL</p>
            </>
          ) : (
            <p className="font-bold">PENDING BALANCE</p>
          )}
          <p className="mt-4 italic text-gray-600">Thank you for choosing N1!</p>
        </div>
      </div>
    </div>
  );
}
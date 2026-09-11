'use client';

import { useState } from 'react';
import { recordPayment } from '@/actions/payments';
import type { PaymentMethod } from '@/types/database';
import type { JobPaymentDetail } from '@/lib/data/jobs';
import { CreditCard, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface JobPaymentPanelProps {
  jobId: string;
  totalAmount: number;
  existingPayment: JobPaymentDetail | null;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'GCASH', label: 'GCash' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

export default function JobPaymentPanel({
  jobId,
  totalAmount,
  existingPayment,
}: JobPaymentPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRecordPayment() {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await recordPayment({
        job_id: jobId,
        payment_method: method,
      });

      if (!res.success) {
        setErrorMsg(res.error);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>Payment Status</span>
        </h2>
        {existingPayment ? (
          <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-emerald-950/70 border border-emerald-800 text-emerald-300">
            PAID
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-amber-950/70 border border-amber-800 text-amber-300">
            UNPAID
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {existingPayment ? (
        <div className="space-y-3">
          <div className="p-4 bg-neutral-950 border border-neutral-800/80 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Amount Paid:</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                ₱{Number(existingPayment.amount).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Method:</span>
              <span className="font-medium text-neutral-200">{existingPayment.payment_method}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Recorded At:</span>
              <span className="font-mono text-neutral-300">
                formatLocalDate(customer.created_at)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400/90 bg-emerald-950/30 border border-emerald-900/40 p-2.5 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Payment ledger finalized. Services are permanently locked.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between p-3 bg-neutral-950 rounded-lg border border-neutral-800">
            <span className="text-xs text-neutral-400">Current Balance Due:</span>
            <span className="text-xl font-bold font-mono text-white">
              ₱{Number(totalAmount).toFixed(2)}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400 block font-medium">Select Method</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-left transition-colors cursor-pointer ${
                    method === m.value
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRecordPayment}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            <span>{loading ? 'Recording Payment...' : `Record Payment (₱${Number(totalAmount).toFixed(2)})`}</span>
          </button>
        </div>
      )}
    </div>
  );
}
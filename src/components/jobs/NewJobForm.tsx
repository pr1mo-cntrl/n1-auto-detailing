'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createJob, addServiceToJob } from '@/actions/jobs';
import { groupServicesByCategory, CATEGORY_METADATA } from '@/lib/data/services';
import type { Service, ServiceCategory } from '@/types/database';
import { Check, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

export interface ServiceWithPrice extends Service {
  price: number | null;
}

interface NewJobFormProps {
  vehicleId: string;
  services: ServiceWithPrice[];
}

export default function NewJobForm({ vehicleId, services }: NewJobFormProps) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const grouped = groupServicesByCategory(services);

  const prominentServices = [
    ...(grouped.PREMIUM_CARWASH || []),
    ...(grouped.ADDITIONAL_SERVICES || []),
  ];

  const collapsibleCategories: ServiceCategory[] = [
    'INTERIOR_DETAILING',
    'EXTERIOR_DETAILING',
    'GLASS_DETAILING',
    'UNDERBODY_DETAILING',
    'PAINTLESS_DENT_REMOVAL',
    'CERAMIC_COATING',
    'PAINT_RESTORATION',
    'PPF',
    'WINDOW_TINT',
  ];

  const toggleCategory = (cat: ServiceCategory) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleCustomPriceChange = (serviceId: string, value: string) => {
    setCustomPrices((prev) => ({ ...prev, [serviceId]: value }));
  };

  const calculatedTotal = services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => {
      if (s.price !== null) {
        return sum + s.price;
      }
      const entered = parseFloat(customPrices[s.id] || '0');
      return sum + (isNaN(entered) ? 0 : entered);
    }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    for (const serviceId of selectedServices) {
      const svc = services.find((s) => s.id === serviceId);
      if (svc && svc.price === null) {
        const val = parseFloat(customPrices[serviceId] || '');
        if (isNaN(val) || val < 0) {
          setErrorMsg(`Please enter a valid price for "${svc.name}".`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const jobRes = await createJob({ vehicle_id: vehicleId, notes });
      if (!jobRes.success || !jobRes.data) {
        setErrorMsg('error' in jobRes ? (jobRes.error as string) : 'Failed to initialize job.');
        setIsSubmitting(false);
        return;
      }

      const newJobId = jobRes.data?.id;
      if (!newJobId) {
        setErrorMsg('Failed to retrieve new job ID.');
        setIsSubmitting(false);
        return;
      }

      let partialFailure = false;
      for (const serviceId of selectedServices) {
        const svc = services.find((s) => s.id === serviceId);
        const customPriceVal =
          svc && svc.price === null && customPrices[serviceId]
            ? parseFloat(customPrices[serviceId])
            : undefined;

        const sRes = await addServiceToJob({
          job_id: newJobId,
          service_id: serviceId,
          custom_price: customPriceVal,
        });

        if (!sRes.success) {
          partialFailure = true;
        }
      }

      if (partialFailure) {
        router.push(`/dashboard/jobs/${newJobId}?warning=partial_services`);
      } else {
        router.push(`/dashboard/jobs/${newJobId}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred during submission.';
      setErrorMsg(message);
      setIsSubmitting(false);
    }
  }

  function renderServiceRow(s: ServiceWithPrice) {
    const isSelected = selectedServices.includes(s.id);
    const isCustom = s.price === null;

    return (
      <div
        key={s.id}
        className={`p-3 rounded-lg border transition-colors ${
          isSelected
            ? 'bg-neutral-800/80 border-emerald-500/80 text-white'
            : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
        }`}
      >
        <div
          onClick={() => !isSubmitting && toggleService(s.id)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-4 h-4 rounded flex items-center justify-center border ${
                isSelected
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'border-neutral-700 bg-neutral-900'
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
            </div>
            <div>
              <span className="font-medium text-neutral-100">{s.name}</span>
              {s.description && (
                <p className="text-[11px] text-neutral-500">{s.description}</p>
              )}
            </div>
          </div>
          <span className="font-mono font-medium text-emerald-400 ml-4 shrink-0">
            {isCustom || s.price === null ? '[Custom Quote]' : `₱${s.price.toFixed(2)}`}
          </span>
        </div>

        {isSelected && isCustom && (
          <div
            className="mt-3 pt-2.5 border-t border-neutral-700/60 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="text-[11px] text-neutral-400 shrink-0">
              Enter Quoted Price (₱):
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={customPrices[s.id] || ''}
              onChange={(e) => handleCustomPriceChange(s.id, e.target.value)}
              disabled={isSubmitting}
              className="w-32 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-xs">
      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 text-red-400 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Service Selection */}
      <div className="space-y-4">
        <div>
          <label className="font-semibold text-neutral-200 block mb-2">Common Services</label>
          <div className="space-y-2">
            {prominentServices.map((s) => renderServiceRow(s))}
          </div>
        </div>

        {/* Collapsible Categories */}
        <div className="space-y-2">
          <label className="font-semibold text-neutral-300 block mb-1">Catalog Categories</label>
          {collapsibleCategories.map((catKey) => {
            const items = grouped[catKey] || [];
            if (items.length === 0) return null;

            const hasSelectedChild = items.some((item) => selectedServices.includes(item.id));
            const isExpanded = expandedCategories[catKey] ?? hasSelectedChild;
            const meta = CATEGORY_METADATA[catKey];

            return (
              <div key={catKey} className="border border-neutral-800 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(catKey)}
                  className="w-full flex items-center justify-between p-3.5 bg-neutral-950 hover:bg-neutral-900/80 transition-colors text-left select-none cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    )}
                    <span className="font-medium text-neutral-200">{meta.label}</span>
                    <span className="text-[11px] text-neutral-500 font-mono">({items.length})</span>
                  </div>
                  {hasSelectedChild && (
                    <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                      Active Selection
                    </span>
                  )}
                </button>

                {isExpanded && (
                  <div className="p-3 bg-neutral-900/30 border-t border-neutral-800 space-y-2">
                    {items.map((s) => renderServiceRow(s))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Estimated Total Display */}
      <div className="flex justify-between items-center py-2 px-3 bg-neutral-950 rounded-lg border border-neutral-800 font-mono">
        <span className="text-neutral-400">Initial Estimated Total:</span>
        <span className="text-emerald-400 font-bold text-sm">₱{calculatedTotal.toFixed(2)}</span>
      </div>

      {/* Notes Field */}
      <div className="space-y-1.5">
        <label className="font-medium text-neutral-300 block">Job Intake Notes (Optional)</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          placeholder="e.g. Extra focus on front bumper, scratches on driver side..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-200 focus:outline-none focus:border-neutral-700 disabled:opacity-50"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isSubmitting ? 'Registering Job...' : 'Confirm and Open Job'}</span>
        </button>
      </div>
    </form>
  );
}
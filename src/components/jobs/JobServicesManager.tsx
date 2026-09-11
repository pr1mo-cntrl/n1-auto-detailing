'use client';

import { useState } from 'react';
import { addServiceToJob, removeServiceFromJob } from '@/actions/jobs';
import { groupServicesByCategory, CATEGORY_METADATA } from '@/lib/data/serviceCategories';
import type { JobServiceDetail } from '@/lib/data/jobs';
import type { Service, ServiceCategory, JobStatus, VehicleSize } from '@/types/database';
import { Plus, Trash2, Loader2, AlertCircle, ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';

interface JobServicesManagerProps {
  jobId: string;
  jobStatus: JobStatus;
  totalAmount: number;
  jobServices: JobServiceDetail[];
  availableServices: Service[];
  vehicleSize?: VehicleSize;
  isPaid?: boolean;
}

export default function JobServicesManager({
  jobId,
  jobStatus,
  totalAmount,
  jobServices,
  availableServices,
  vehicleSize = 'UNKNOWN',
  isPaid = false,
}: JobServicesManagerProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const isTerminal = jobStatus === 'COMPLETED' || jobStatus === 'CANCELLED' || isPaid;

  const grouped = groupServicesByCategory(availableServices);

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

  const selectedService = availableServices.find((s) => s.id === selectedServiceId);

  const requiresCustomPrice =
    selectedService?.pricing_type === 'CUSTOM' ||
    (selectedService?.pricing_type === 'SIZE_TIERED' &&
      (vehicleSize === 'UNKNOWN' ||
        (selectedService.name === 'Premium Carwash' && vehicleSize === 'X_LARGE') ||
        (selectedService.name === 'Undercoating' && vehicleSize === 'X_LARGE')));

  const toggleCategory = (cat: ServiceCategory) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  async function handleAddSelectedService(serviceId: string) {
    if (isTerminal || !serviceId) return;

    const svc = availableServices.find((s) => s.id === serviceId);
    const isCustom =
      svc?.pricing_type === 'CUSTOM' ||
      (svc?.pricing_type === 'SIZE_TIERED' &&
        (vehicleSize === 'UNKNOWN' ||
          (svc.name === 'Premium Carwash' && vehicleSize === 'X_LARGE') ||
          (svc.name === 'Undercoating' && vehicleSize === 'X_LARGE')));

    if (isCustom) {
      setSelectedServiceId(serviceId);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await addServiceToJob({
        job_id: jobId,
        service_id: serviceId,
      });

      if (!res.success) {
        setErrorMsg(res.error);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmCustomAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedServiceId || isTerminal) return;

    const parsedPrice = parseFloat(customPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg('Please enter a valid price greater than or equal to 0.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await addServiceToJob({
        job_id: jobId,
        service_id: selectedServiceId,
        custom_price: parsedPrice,
      });

      if (!res.success) {
        setErrorMsg(res.error);
      } else {
        setSelectedServiceId('');
        setCustomPrice('');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveService(jobServiceId: string) {
    if (isTerminal) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await removeServiceFromJob(jobServiceId);
      if (!res.success) {
        setErrorMsg(res.error);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  function renderSelectableItem(svc: Service) {
    const isCurrentlySelected = selectedServiceId === svc.id;

    return (
      <div
        key={svc.id}
        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
          isCurrentlySelected
            ? 'bg-neutral-800 border-emerald-500 text-white'
            : 'bg-neutral-950 border-neutral-800/80 text-neutral-300 hover:border-neutral-700'
        }`}
      >
        <div className="flex-1 pr-3">
          <div className="font-medium text-neutral-200">{svc.name}</div>
          {svc.description && (
            <div className="text-[11px] text-neutral-500 mt-0.5">{svc.description}</div>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-emerald-400 font-medium">
            {svc.pricing_type === 'FLAT' && svc.flat_price !== null
              ? `₱${Number(svc.flat_price).toFixed(2)}`
              : svc.pricing_type === 'CUSTOM'
              ? '[Custom Quote]'
              : '[Size Tiered]'}
          </span>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (requiresCustomPrice || svc.pricing_type === 'CUSTOM') {
                setSelectedServiceId(svc.id);
              } else {
                handleAddSelectedService(svc.id);
              }
            }}
            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
        <h2 className="text-sm font-semibold text-neutral-200">Services & Pricing</h2>
        <span className="font-mono text-base font-bold text-emerald-400">
          Total: ₱{Number(totalAmount).toFixed(2)}
        </span>
      </div>

      {isPaid && (
        <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>This job has been paid. Services cannot be added or removed.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Existing Job Services List */}
      <div className="divide-y divide-neutral-800/60">
        {jobServices.length === 0 ? (
          <p className="text-xs text-neutral-500 py-3 italic">No services added yet.</p>
        ) : (
          jobServices.map((item) => (
            <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
              <div>
                <span className="text-neutral-200 font-medium">
                  {item.service?.name || 'Custom Service'}
                </span>
                {item.service?.description && (
                  <p className="text-neutral-500 text-[11px] mt-0.5">{item.service.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-neutral-300 font-medium">
                  ₱{Number(item.price_charged).toFixed(2)}
                </span>
                {!isTerminal && (
                  <button
                    onClick={() => handleRemoveService(item.id)}
                    disabled={loading}
                    className="text-neutral-500 hover:text-red-400 disabled:opacity-50 p-1 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Services Section */}
      {!isTerminal && (
        <div className="pt-3 border-t border-neutral-800 space-y-3">
          {/* Custom Quote Prompt Modal/Input */}
          {selectedService && requiresCustomPrice && (
            <form
              onSubmit={handleConfirmCustomAdd}
              className="p-3 bg-neutral-950 rounded-lg border border-emerald-500/80 space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-emerald-400">
                  Custom Quote Required: {selectedService.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServiceId('');
                    setCustomPrice('');
                  }}
                  className="text-[11px] text-neutral-500 hover:text-neutral-300"
                >
                  Cancel
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter agreed price (₱)"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    disabled={loading}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !customPrice}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Confirm</span>
                </button>
              </div>
            </form>
          )}

          {/* Prominent Section */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-neutral-300">Common Services</h3>
            <div className="space-y-1.5">
              {prominentServices.map((svc) => renderSelectableItem(svc))}
            </div>
          </div>

          {/* Collapsible Categories */}
          <div className="space-y-1.5 pt-1">
            <h3 className="text-xs font-semibold text-neutral-400">Other Catalog Categories</h3>
            {collapsibleCategories.map((catKey) => {
              const items = grouped[catKey] || [];
              if (items.length === 0) return null;

              const isExpanded = expandedCategories[catKey] ?? false;
              const meta = CATEGORY_METADATA[catKey];

              return (
                <div key={catKey} className="border border-neutral-800 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory(catKey)}
                    className="w-full flex items-center justify-between p-3 bg-neutral-950 hover:bg-neutral-900 transition-colors text-left select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                      )}
                      <span className="text-xs font-medium text-neutral-200">{meta.label}</span>
                      <span className="text-[11px] text-neutral-500 font-mono">({items.length})</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-2 bg-neutral-900/40 border-t border-neutral-800 space-y-1.5">
                      {items.map((svc) => renderSelectableItem(svc))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
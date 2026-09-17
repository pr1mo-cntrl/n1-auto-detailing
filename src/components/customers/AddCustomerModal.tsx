'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createCustomer, searchCustomersForIntake } from '@/actions/customers';
import { UserPlus, X, Loader2, CheckCircle2, Search, UserCheck } from 'lucide-react';

export default function AddCustomerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  
  // --- NEW: Search State ---
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; contact_number: string | null }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // --- NEW: Live Search Effect ---
  useEffect(() => {
    const searchDB = async () => {
      if (name.trim().length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      const result = await searchCustomersForIntake(name);
      
      if (result.success && result.data && result.data.length > 0) {
        setSearchResults(result.data);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
      setIsSearching(false);
    };

    // "Debounce" the search so it doesn't spam the database on every single keystroke
    const timeoutId = setTimeout(() => {
      searchDB();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [name]);

  // Hide dropdown if user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- NEW: Handle clicking an existing customer from the dropdown ---
  const handleSelectExisting = (customer: { id: string; name: string }) => {
    setShowDropdown(false);
    setSuccessMessage(`Existing profile found! Opening ${customer.name}'s account...`);
    
    setTimeout(() => {
      setIsOpen(false);
      setName('');
      setContactNumber('');
      setSuccessMessage(null);
      router.push(`/dashboard/customers/${customer.id}`);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await createCustomer({
        name,
        contact_number: contactNumber || null,
      });

      if (!result.success) {
        setError(result.error || 'Something went wrong.');
        return;
      }

      if (!result.data) {
        setError('No customer data returned.');
        return;
      }

      // Check if the customer profile is old (existing) or brand new
      const customerAge = Date.now() - new Date(result.data.created_at).getTime();
      const isExisting = customerAge > 5000;

      if (isExisting) {
        setSuccessMessage(`Existing profile found! Linking to ${result.data.name}'s account...`);
        setTimeout(() => {
          setIsOpen(false);
          setName('');
          setContactNumber('');
          setSuccessMessage(null);
          router.push(`/dashboard/customers/${result.data?.id}`);
        }, 2000);
      } else {
        setIsOpen(false);
        setName('');
        setContactNumber('');
        router.push(`/dashboard/customers/${result.data.id}`);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        <span>Add Customer</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-100">Add New Customer</h3>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending || !!successMessage}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 text-xs bg-red-950/60 border border-red-800 text-red-300 rounded-lg">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2 p-3 text-xs bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}

              {/* SEARCHABLE NAME INPUT */}
              <div className="space-y-1.5 relative" ref={dropdownRef}>
                <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                  <span>Full Name <span className="text-red-400">*</span></span>
                  {isSearching && <Loader2 className="w-3 h-3 text-neutral-500 animate-spin" />}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowDropdown(true);
                    }}
                    disabled={isPending || !!successMessage}
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-600 disabled:opacity-50"
                  />
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                </div>

                {/* LIVE AUTOCOMPLETE DROPDOWN */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 bg-neutral-800/50 border-b border-neutral-700/50 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                      Existing Customers Found
                    </div>
                    <ul className="max-h-48 overflow-y-auto">
                      {searchResults.map((customer) => (
                        <li key={customer.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectExisting(customer)}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-neutral-800 transition-colors cursor-pointer group border-b border-neutral-800/50 last:border-0"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-neutral-200 group-hover:text-emerald-400 transition-colors">
                                {customer.name}
                              </span>
                              {customer.contact_number && (
                                <span className="text-xs font-mono text-neutral-500 mt-0.5">
                                  {customer.contact_number}
                                </span>
                              )}
                            </div>
                            <UserCheck className="w-4 h-4 text-neutral-600 group-hover:text-emerald-500 transition-colors" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Contact Number <span className="text-neutral-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  disabled={isPending || !!successMessage}
                  placeholder="e.g. 09171234567"
                  className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-neutral-600 disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending || !!successMessage}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !!successMessage}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Customer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
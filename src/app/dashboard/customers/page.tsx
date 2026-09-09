import Link from 'next/link';
import { searchCustomers } from '@/lib/data/customers';
import CustomerSearch from '@/components/customers/CustomerSearch';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import { Users, Phone, Calendar, ChevronRight, SearchX } from 'lucide-react';

interface CustomersPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const { q } = await searchParams;
  const query = q || '';
  const customers = await searchCustomers(query);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-400" />
            Customers & Vehicles
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Manage registered customer profiles and their vehicle fleet.
          </p>
        </div>
        <AddCustomerModal />
      </div>

      <div className="flex items-center gap-4">
        <CustomerSearch />
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-16 border border-neutral-800 border-dashed rounded-xl bg-neutral-900/30">
          {query ? (
            <div className="max-w-md mx-auto space-y-3">
              <SearchX className="w-10 h-10 mx-auto text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-200">No customers found</h3>
              <p className="text-xs text-neutral-400">
                No records matched &ldquo;<span className="text-neutral-200 font-medium">{query}</span>&rdquo;. Check the spelling or search by contact number.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard/customers"
                  className="inline-flex items-center text-xs font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
                >
                  Clear search filter
                </Link>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-2">
              <Users className="w-10 h-10 mx-auto text-neutral-600" />
              <h3 className="text-sm font-semibold text-neutral-300">No customers registered</h3>
              <p className="text-xs text-neutral-500">
                Get started by registering your first customer profile using the button above.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-neutral-950 text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Customer Name</th>
                  <th scope="col" className="px-6 py-3.5">Contact Number</th>
                  <th scope="col" className="px-6 py-3.5">Registered Date</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-neutral-800/40 transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium text-neutral-100">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 text-neutral-400">
                      {customer.contact_number ? (
                        <span className="flex items-center gap-1.5 font-mono text-xs text-neutral-300">
                          <Phone className="w-3.5 h-3.5 text-neutral-500" />
                          {customer.contact_number}
                        </span>
                      ) : (
                        <span className="italic text-neutral-500 text-xs">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                        {new Date(customer.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <span>View Fleet</span>
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
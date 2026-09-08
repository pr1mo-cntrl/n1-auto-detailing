import Link from 'next/link';
import { searchCustomers } from '@/lib/data/customers';
import CustomerSearch from '@/components/customers/CustomerSearch';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import { Users, Phone, Calendar, ArrowRight } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q ?? '';
  const customers = await searchCustomers(query);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Customer Directory</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Search customer records, view profiles, and manage vehicles.
          </p>
        </div>
        <AddCustomerModal />
      </div>

      <div className="flex items-center">
        <CustomerSearch initialQuery={query} />
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-16 border border-neutral-800 border-dashed rounded-xl bg-neutral-900/30">
          <Users className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
          <h3 className="text-sm font-medium text-neutral-300">No customers found</h3>
          <p className="text-xs text-neutral-500 mt-1">
            {query
              ? `No matching records for "${query}". Check spelling or create a new customer.`
              : 'The customer database is currently empty.'}
          </p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="text-xs font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-950/60 border-b border-neutral-800">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-neutral-100">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="hover:text-emerald-400 transition-colors"
                      >
                        {customer.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      {customer.contact_number ? (
                        <span className="inline-flex items-center gap-1.5 text-neutral-300">
                          <Phone className="w-3.5 h-3.5 text-neutral-500" />
                          {customer.contact_number}
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-xs italic">No contact number</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                        {new Date(customer.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                      >
                        View
                        <ArrowRight className="w-3.5 h-3.5" />
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
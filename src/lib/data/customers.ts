import { createClient } from '@/utils/supabase/server';
import type { Customer } from '@/types/database';

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, contact_number, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getCustomers] Database error:', error.message);
    return [];
  }

  return (data as Customer[]) ?? [];
}

export async function searchCustomers(searchTerm: string): Promise<Customer[]> {
  const trimmed = searchTerm.trim();
  if (!trimmed) {
    return getCustomers();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, contact_number, created_at')
    .or(`name.ilike.%${trimmed}%,contact_number.ilike.%${trimmed}%`)
    .order('name', { ascending: true });

  if (error) {
    console.error('[searchCustomers] Query error:', error.message);
    return [];
  }

  return (data as Customer[]) ?? [];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, contact_number, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(`[getCustomerById] Query error for ID ${id}:`, error.message);
    return null;
  }

  return (data as Customer) ?? null;
}
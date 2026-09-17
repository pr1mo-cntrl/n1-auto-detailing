'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { createCustomerSchema, updateCustomerSchema } from '@/schemas/customer';
import type { ActionResponse, Customer } from '@/types/database';

export async function createCustomer(rawInput: unknown): Promise<ActionResponse<Customer>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in.' };
  }

  const parseResult = createCustomerSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message ?? 'Invalid customer information.',
    };
  }

  const { name, contact_number } = parseResult.data;

  // --- NEW LOGIC: FIND OR CREATE (Anti-Duplication) ---
  
  // 1. Build a search query to find an exact match
  let query = supabase
    .from('customers')
    .select('id, name, contact_number, created_at')
    .ilike('name', name); // Case-insensitive match (e.g., "John" == "john")

  // If a phone number was provided, match it exactly. Otherwise, ensure it is null.
  if (contact_number) {
    query = query.eq('contact_number', contact_number);
  } else {
    query = query.is('contact_number', null);
  }

  const { data: existingCustomer } = await query.limit(1).maybeSingle();

  // 2. If they already exist in the system, seamlessly return their existing profile!
  if (existingCustomer) {
    return { success: true, data: existingCustomer as Customer };
  }

  // 3. If no match is found, safely create a brand new customer
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: name,
      contact_number: contact_number,
    })
    .select('id, name, contact_number, created_at')
    .single();

  if (error) {
    console.error('[createCustomer] Insert error:', error.message);
    return { success: false, error: 'Customer could not be created.' };
  }

  revalidatePath('/dashboard');
  return { success: true, data: data as Customer };
}

export async function updateCustomer(
  id: string,
  rawInput: unknown
): Promise<ActionResponse<Customer>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in.' };
  }

  if (!id || typeof id !== 'string') {
    return { success: false, error: 'Invalid customer ID.' };
  }

  const parseResult = updateCustomerSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0]?.message ?? 'Invalid customer information.',
    };
  }

  const { data, error } = await supabase
    .from('customers')
    .update(parseResult.data)
    .eq('id', id)
    .select('id, name, contact_number, created_at')
    .single();

  if (error) {
    console.error(`[updateCustomer] Update error for ${id}:`, error.message);
    return { success: false, error: 'Customer could not be updated.' };
  }

  revalidatePath('/dashboard');
  return { success: true, data: data as Customer };
}
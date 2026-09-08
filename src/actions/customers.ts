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

  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: parseResult.data.name,
      contact_number: parseResult.data.contact_number,
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
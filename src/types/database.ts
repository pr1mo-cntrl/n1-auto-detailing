export type VehicleSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'X_LARGE' | 'UNKNOWN';

export interface Customer {
  id: string;
  name: string;
  contact_number: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  plate_number: string | null;
  make: string;
  model: string;
  size: VehicleSize;
}

export type ActionResponse<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never };
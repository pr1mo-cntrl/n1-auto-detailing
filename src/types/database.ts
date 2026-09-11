export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export type UserRole = 'ADMIN' | 'STAFF';
export type VehicleSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'X_LARGE' | 'UNKNOWN';
export type JobStatus = 'PENDING' | 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ServicePricingType = 'SIZE_TIERED' | 'FLAT' | 'CUSTOM';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  contact_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  plate_number: string | null;
  size: VehicleSize;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  pricing_type: ServicePricingType;
  flat_price: number | null;
  active: boolean;
  created_at: string;
}

export interface ServicePricing {
  id: string;
  service_id: string;
  vehicle_size: VehicleSize;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  customer_id: string;
  vehicle_id: string;
  job_status: JobStatus;
  total_amount: number;
  notes: string | null;
  customer_confirmed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobService {
  id: string;
  job_id: string;
  service_id: string;
  price_charged: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>;
      };
      vehicles: {
        Row: Vehicle;
        Insert: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at'>>;
      };
      service_pricing: {
        Row: ServicePricing;
        Insert: Omit<ServicePricing, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ServicePricing, 'id' | 'created_at' | 'updated_at'>>;
      };
      jobs: {
        Row: Job;
        Insert: Omit<Job, 'id' | 'total_amount' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>>;
      };
      job_services: {
        Row: JobService;
        Insert: Omit<JobService, 'id' | 'created_at'>;
        Update: Partial<Omit<JobService, 'id' | 'created_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      handle_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      trg_jobs_protect_total_amount: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      trg_recalculate_job_total: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      trg_validate_job_status_transition: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: {
      user_role: UserRole;
      vehicle_size: VehicleSize;
      job_status: JobStatus;
    };
  };
}

export type PaymentMethod = 'CASH' | 'GCASH' | 'CARD' | 'BANK_TRANSFER';

export interface Payment {
  id: string;
  job_id: string;
  amount: number;
  payment_method: PaymentMethod;
  recorded_by: string;
  paid_at: string;
  created_at: string;
} 
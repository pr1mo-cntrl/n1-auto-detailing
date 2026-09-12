-- Migration: 20260908130000_backfill_service_category.sql
-- Purpose: Backfill missing migration capturing live production service_category enum and services column.
-- NOTE: Do not run against production database; this schema state already exists live.

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_category') THEN
    CREATE TYPE public.service_category AS ENUM (
      'PREMIUM_CARWASH',
      'ADDITIONAL_SERVICES',
      'INTERIOR_DETAILING',
      'EXTERIOR_DETAILING',
      'GLASS_DETAILING',
      'UNDERBODY_DETAILING',
      'PAINTLESS_DENT_REMOVAL',
      'CERAMIC_COATING',
      'PAINT_RESTORATION',
      'PPF',
      'WINDOW_TINT'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'services' 
      AND column_name = 'category'
  ) THEN
    ALTER TABLE public.services ADD COLUMN category public.service_category;
  END IF;
END $$;
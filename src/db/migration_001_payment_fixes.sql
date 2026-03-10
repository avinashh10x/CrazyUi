-- CrazyUI Payment System Migration
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Project: dqlmmmfxflafmidgqlgw

-- 1. Add plan_type column to payments table (if not exists)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'premium';

-- 2. Add UNIQUE constraint on order_id to prevent race condition duplicates
-- This is the critical fix: if both webhook and verify try to insert the same order,
-- the second one will get a 23505 error which we handle gracefully in code.
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payments_order_id_unique'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_order_id_unique UNIQUE (order_id);
  END IF;
END $$;

-- 3. Add payment_method column (if not exists)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'online';

-- 4. Add payment_timestamp column (if not exists)  
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_timestamp TIMESTAMPTZ;

-- 5. Add name and phone to payments (if not exists)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

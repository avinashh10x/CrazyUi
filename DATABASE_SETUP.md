# CrazyUI Membership System - Database Setup Guide

This guide will help you set up the required database tables in Supabase.

## Prerequisites

- Supabase account and project created
- Access to Supabase SQL Editor

## Step 1: Create Tables

Open your Supabase SQL Editor and run the following SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  membership_status TEXT DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  cf_payment_id TEXT UNIQUE,
  email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_cf_payment_id ON payments(cf_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);
```

## Step 2: Set Up Row Level Security (RLS)

```sql
-- Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (backend API)
-- Service role bypasses RLS, so these are for additional security

-- Allow service role to do everything (your API will use service role key)
CREATE POLICY "Service role can do everything on users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on payments"
  ON payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Allow authenticated users to read their own data
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can read their own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (email = auth.email());
```

## Step 3: Verify Setup

Run these queries to verify your tables are created correctly:

```sql
-- Check users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users';

-- Check payments table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments';

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('users', 'payments');
```

## Step 4: Get Your Supabase Credentials

1. Go to your Supabase project settings
2. Navigate to **API** section
3. Copy the following values:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Step 5: Update Environment Variables

Add these to your `.env.local` file:

```env
SUPABASE_URL=your_project_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Testing Queries

After setup, you can test with these queries:

```sql
-- Test inserting a user
INSERT INTO users (name, email, phone)
VALUES ('Test User', 'test@example.com', '9999999999');

-- Test inserting a payment
INSERT INTO payments (order_id, cf_payment_id, email, amount, status)
VALUES ('order_test_123', 'payment_test_123', 'test@example.com', 999, 'SUCCESS');

-- View all users
SELECT * FROM users ORDER BY created_at DESC;

-- View all payments
SELECT * FROM payments ORDER BY created_at DESC;

-- Clean up test data
DELETE FROM payments WHERE order_id = 'order_test_123';
DELETE FROM users WHERE email = 'test@example.com';
```

## Security Notes

✅ **RLS is enabled** - Protects data at database level
✅ **Unique constraints** - Prevents duplicate emails and orders
✅ **Service role only** - Backend API uses service role key for writes
✅ **Indexed columns** - Fast lookups for email and order_id

## Troubleshooting

**Issue: "relation already exists"**
- Tables already created, you can skip table creation

**Issue: "permission denied"**
- Make sure you're using the service role key in your backend code
- Check RLS policies are correctly configured

**Issue: "duplicate key value"**
- Email or order_id already exists
- Check for existing records before inserting

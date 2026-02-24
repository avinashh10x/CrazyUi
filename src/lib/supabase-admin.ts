import { createClient } from "@supabase/supabase-js";
import type { User, Payment } from "@/types/membership";

// Supabase admin client with service role key
// This bypasses Row Level Security (RLS) - use only in server-side code
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/**
 * Create a new user account
 */
export async function createUser(userData: {
  name: string;
  email: string;
  phone: string;
}): Promise<User> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      membership_status: "active",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data as User;
}

/**
 * Check if email already exists
 */
export async function emailExists(email: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw new Error(`Failed to check email: ${error.message}`);
  }

  return !!data;
}

/**
 * Create payment record
 */
export async function createPayment(paymentData: {
  order_id: string;
  cf_payment_id: string;
  email: string;
  amount: number;
  status: "SUCCESS" | "FAILED" | "PENDING";
}): Promise<Payment> {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .insert(paymentData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create payment: ${error.message}`);
  }

  return data as Payment;
}

/**
 * Check if order has already been processed (idempotency check)
 */
export async function orderExists(orderId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("order_id", orderId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to check order: ${error.message}`);
  }

  return !!data;
}

export { supabaseAdmin };

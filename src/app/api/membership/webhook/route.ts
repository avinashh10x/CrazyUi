import { NextResponse } from "next/server";
import cashfree from "@/lib/cashfree";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client for server-side operations
// This client bypasses RLS, so it can create users and record payments
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");
    const body = await request.text();

    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify Signature
    try {
      cashfree.PGVerifyWebhookSignature(signature, body, timestamp);
    } catch (err) {
      console.error("Webhook signature verification failed", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
      const paymentData = event.data.payment;
      const orderData = event.data.order;

      const email = event.data.customer_details.customer_email;
      const phone = event.data.customer_details.customer_phone;
      const name = event.data.customer_details.customer_name;

      const orderId = orderData.order_id;
      const cfPaymentId = paymentData.cf_payment_id;
      const paymentAmount = paymentData.payment_amount;

      console.log(`Processing payment for ${email}, Order: ${orderId}`);

      // 1. Idempotency Check: Don't process if payment already recorded
      const { data: existingPayment } = await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("cf_payment_id", cfPaymentId)
        .single();

      if (existingPayment) {
        console.log("Payment already recorded:", cfPaymentId);
        return NextResponse.json({ status: "ignored_duplicate" });
      }

      // 2. User Resolution (Atomic-like flow with Rollback)
      let userId: string | null = null;
      let isNewUser = false;

      // Check for existing Auth User
      const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
      if (listUsersError) {
        throw new Error(`Failed to list users: ${listUsersError.message}`);
      }

      const existingAuthUser = users.find((u) => u.email === email);

      if (existingAuthUser) {
        userId = existingAuthUser.id;
        console.log(`Found existing Auth User: ${userId}`);
      } else {
        console.log(`Creating new Auth User for ${email}`);
        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true, // Auto-confirm email so they can assume the identity later
          user_metadata: { name, phone },
        });

        if (createUserError || !newUser.user) {
          throw new Error(`Failed to create Auth User: ${createUserError?.message}`);
        }

        userId = newUser.user.id;
        isNewUser = true;
      }

      // 3. Database Operations
      try {
        // A. Upsert Public Profile (Users Table) - Safe for both new and existing
        // We ensure the profile exists and has the active status
        const { error: profileError } = await supabaseAdmin
          .from("users")
          .upsert({
            id: userId,
            email,
            name,
            phone,
            membership_status: "active",
            // If updating, we keep created_at as is, just update status
          });

        if (profileError) throw new Error(`Profile upsert failed: ${profileError.message}`);

        // B. Record Payment
        const { error: paymentError } = await supabaseAdmin
          .from("payments")
          .insert({
            order_id: orderId,
            cf_payment_id: cfPaymentId,
            email,
            amount: paymentAmount,
            status: "SUCCESS",
          });

        if (paymentError) throw new Error(`Payment recording failed: ${paymentError.message}`);

        console.log("Payment and User processed successfully");
        return NextResponse.json({ status: "processed" });

      } catch (dbError: any) {
        console.error("Database operation failed:", dbError.message);

        // ROLLBACK: If we created a new Auth User but failed to set up the DB profile/payment,
        // we delete the Auth User to ensure valid state (so they can try again or be created correctly next time).
        if (isNewUser && userId) {
          console.log(`Rolling back: Deleting Auth User ${userId}`);
          await supabaseAdmin.auth.admin.deleteUser(userId);
        }

        throw dbError; // Return 500
      }
    }

    return NextResponse.json({ status: "ignored" });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook failed" },
      { status: 500 },
    );
  }
}

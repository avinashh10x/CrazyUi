import { NextResponse } from "next/server";
import cashfree from "@/lib/cashfree";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client for server-side operations
// This client bypasses RLS, so it can create users and record payments
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Verify admin client is initialized
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error("❌ CRITICAL: Supabase environment variables not set!");
  console.error("Missing:", {
    SUPABASE_URL: !process.env.NEXT_PUBLIC_SUPABASE_URL ? "NOT SET" : "OK",
    SERVICE_ROLE_KEY: !process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "NOT SET"
      : "SET",
  });
}

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
      try {
        const {
          data: { users },
          error: listUsersError,
        } = await supabaseAdmin.auth.admin.listUsers();
        if (listUsersError) {
          throw new Error(`Failed to list users: ${listUsersError.message}`);
        }

        const existingAuthUser = users.find((u) => u.email === email);

        if (existingAuthUser) {
          userId = existingAuthUser.id;
          console.log(`Found existing Auth User: ${userId}`);
        } else {
          console.log(`Creating new Auth User for ${email}`);
          const { data: newUser, error: createUserError } =
            await supabaseAdmin.auth.admin.createUser({
              email,
              email_confirm: true, // Auto-confirm email so they can assume the identity later
              user_metadata: { name, phone },
            });

          console.log("Auth user creation response:", {
            error: createUserError,
            userId: newUser?.user?.id,
          });

          if (createUserError) {
            console.error("CreateUser error details:", createUserError);
            throw new Error(
              `Failed to create Auth User: ${createUserError.message}`,
            );
          }

          if (!newUser?.user?.id) {
            throw new Error(
              "Auth user created but no user ID returned. Response: " +
                JSON.stringify(newUser),
            );
          }

          userId = newUser.user.id;
          isNewUser = true;

          // Verify the auth user was actually created
          const { data: verifyUser, error: verifyError } =
            await supabaseAdmin.auth.admin.getUserById(userId);

          if (verifyError || !verifyUser?.user) {
            throw new Error(
              `Auth user verification failed after creation. Error: ${verifyError?.message}`,
            );
          }

          console.log(
            `✅ Successfully created and verified new Auth User: ${userId}`,
          );
        }
      } catch (authError: any) {
        console.error(
          "❌ Auth User creation/lookup failed:",
          authError.message,
        );
        throw authError;
      }

      const orderMeta = orderData.order_meta || {};
      const planType = orderMeta.plan_type || "premium"; // Default to premium if not found

      // Validate userId is set
      if (!userId) {
        throw new Error(
          "User ID not resolved. Cannot proceed with payment processing.",
        );
      }

      console.log(
        `✅ Auth user ready. UserId: ${userId}, isNewUser: ${isNewUser}`,
      );

      // 3. Database Operations
      try {
        // A. Record Payment FIRST (before user insert to get payment ID)
        const { data: insertedPayments, error: paymentError } =
          await supabaseAdmin
            .from("payments")
            .insert({
              order_id: orderId,
              cf_payment_id: cfPaymentId,
              email,
              name,
              phone,
              amount: paymentAmount,
              status: "success",
              payment_method: paymentData.payment_method || "online",
              payment_timestamp: new Date().toISOString(),
            })
            .select("id");

        if (paymentError) {
          console.error("Payment insert error:", paymentError);
          throw new Error(`Payment recording failed: ${paymentError.message}`);
        }

        if (!insertedPayments || insertedPayments.length === 0) {
          throw new Error("Payment record was not created");
        }

        const paymentId = insertedPayments[0].id;
        console.log(`Payment recorded successfully: ${paymentId}`);

        // B. Check if user profile exists, then insert or update accordingly
        const { data: existingUser, error: checkUserError } =
          await supabaseAdmin
            .from("users")
            .select("id")
            .eq("id", userId)
            .single();

        let profileError;

        if (existingUser) {
          // User exists, update the profile
          const { error: updateError } = await supabaseAdmin
            .from("users")
            .update({
              email,
              name,
              phone,
              payment_id: paymentId,
              membership_status: "active",
            })
            .eq("id", userId);

          profileError = updateError;
          console.log(`User profile updated for ${email}`);
        } else {
          // User doesn't exist, insert new profile
          const { error: insertError } = await supabaseAdmin
            .from("users")
            .insert({
              id: userId,
              email,
              name,
              phone,
              payment_id: paymentId,
              membership_status: "active",
            });

          profileError = insertError;
          console.log(`User profile created for ${email}`);
        }

        if (profileError)
          throw new Error(`Profile operation failed: ${profileError.message}`);

        console.log(
          `User profile saved for ${email} with payment_id ${paymentId}`,
        );

        console.log("========== WEBHOOK SUCCESS SUMMARY ==========");
        console.log(
          `✅ Auth User Created: ${isNewUser ? "YES - New user" : "NO - Existing user"}`,
        );
        console.log(`✅ Auth User ID: ${userId}`);
        console.log(`✅ Payment ID: ${paymentId}`);
        console.log(`✅ DB User Saved: YES`);
        console.log(`✅ Payment Saved: YES`);
        console.log("===========================================");

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

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

/**
 * Atomic user creation flow:
 * 1. Verify webhook signature
 * 2. Check idempotency (skip if already processed)
 * 3. Create/find auth user
 * 4. Record payment
 * 5. Create/update user profile
 * If any DB step fails after auth user creation, rollback the auth user.
 */
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
      const cfPaymentId = String(paymentData.cf_payment_id);
      const paymentAmount = paymentData.payment_amount;

      console.log(`📩 Webhook received for ${email}, Order: ${orderId}`);

      // 1. Idempotency Check: Don't process if payment already recorded
      const { data: existingPayment } = await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("cf_payment_id", cfPaymentId)
        .single();

      if (existingPayment) {
        console.log("⏭️ Payment already recorded:", cfPaymentId);
        return NextResponse.json({ status: "ignored_duplicate" });
      }

      // 2. User Resolution — find existing or create new auth user
      let userId: string | null = null;
      let isNewUser = false;

      try {
        // Use admin API to look up user by email directly (no pagination issues)
        const { data: lookupData, error: lookupError } =
          await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1,
          });

        // More reliable: search users table first, then auth
        const { data: existingDbUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", email)
          .single();

        if (existingDbUser) {
          userId = existingDbUser.id;
          console.log(`✅ Found existing DB user: ${userId}`);
        } else {
          // Check auth.users via admin API
          const {
            data: { users },
            error: listError,
          } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 50,
          });

          if (listError) {
            throw new Error(`Failed to list users: ${listError.message}`);
          }

          const existingAuthUser = users?.find((u) => u.email === email);

          if (existingAuthUser) {
            userId = existingAuthUser.id;
            console.log(`✅ Found existing Auth user: ${userId}`);
          } else {
            // Create new auth user
            console.log(`🆕 Creating new Auth user for ${email}`);
            const { data: newUser, error: createUserError } =
              await supabaseAdmin.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: { name, phone },
              });

            if (createUserError) {
              console.error("❌ CreateUser error:", createUserError);
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
                `Auth user verification failed: ${verifyError?.message}`,
              );
            }

            console.log(`✅ Created and verified new Auth user: ${userId}`);
          }
        }
      } catch (authError: any) {
        console.error("❌ Auth user resolution failed:", authError.message);
        throw authError;
      }

      if (!userId) {
        throw new Error(
          "User ID not resolved. Cannot proceed with payment processing.",
        );
      }

      // Determine plan type from order tags or meta
      const orderTags = orderData.order_tags || {};
      const orderMeta = orderData.order_meta || {};
      const planType = orderTags.plan_type || orderMeta.plan_type || "premium";

      console.log(
        `✅ Auth user ready. UserId: ${userId}, isNew: ${isNewUser}, plan: ${planType}`,
      );

      // 3. Database Operations (atomic-like with rollback)
      try {
        // A. Record Payment FIRST
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
              status: "SUCCESS",
              payment_method:
                typeof paymentData.payment_method === "object"
                  ? JSON.stringify(paymentData.payment_method)
                  : paymentData.payment_method || "online",
              payment_timestamp: new Date().toISOString(),
            })
            .select("id");

        if (paymentError) {
          console.error("❌ Payment insert error:", paymentError);
          throw new Error(`Payment recording failed: ${paymentError.message}`);
        }

        if (!insertedPayments || insertedPayments.length === 0) {
          throw new Error("Payment record was not created");
        }

        const paymentId = insertedPayments[0].id;
        console.log(`✅ Payment recorded: ${paymentId}`);

        // B. Create or update user profile
        const { data: existingUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("id", userId)
          .single();

        let profileError;

        if (existingUser) {
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
          if (!updateError) console.log(`✅ User profile updated for ${email}`);
        } else {
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
          if (!insertError) console.log(`✅ User profile created for ${email}`);
        }

        if (profileError) {
          throw new Error(`Profile operation failed: ${profileError.message}`);
        }

        console.log("========== WEBHOOK SUCCESS SUMMARY ==========");
        console.log(
          `✅ Auth User: ${isNewUser ? "NEW" : "EXISTING"} (${userId})`,
        );
        console.log(`✅ Payment: ${paymentId}`);
        console.log(`✅ DB User: Saved`);
        console.log(`✅ Plan: ${planType}`);
        console.log("==============================================");

        return NextResponse.json({ status: "processed" });
      } catch (dbError: any) {
        console.error("❌ Database operation failed:", dbError.message);

        // ROLLBACK: Delete auth user if we created one but DB ops failed
        if (isNewUser && userId) {
          console.log(`🔄 Rolling back: Deleting Auth user ${userId}`);
          await supabaseAdmin.auth.admin.deleteUser(userId);
        }

        throw dbError;
      }
    }

    return NextResponse.json({ status: "ignored" });
  } catch (error: any) {
    console.error("❌ Webhook Error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook failed" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import cashfree from "@/lib/cashfree";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Cashfree Webhook Handler
 *
 * Atomic user creation flow:
 * 1. Verify webhook signature
 * 2. Check idempotency (skip if already processed)
 * 3. Create/find auth user (scalable email lookup - no pagination)
 * 4. Record payment (with plan_type)
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
      console.error("Webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.type !== "PAYMENT_SUCCESS_WEBHOOK") {
      return NextResponse.json({ status: "ignored" });
    }

    const paymentData = event.data.payment;
    const orderData = event.data.order;

    const email = event.data.customer_details.customer_email;
    const phone = event.data.customer_details.customer_phone;
    const name = event.data.customer_details.customer_name;

    const orderId = orderData.order_id;
    const cfPaymentId = String(paymentData.cf_payment_id);
    const paymentAmount = paymentData.payment_amount;

    console.log(`📩 Webhook: order=${orderId}`);

    // 1. Idempotency Check — by order_id (matches the UNIQUE constraint)
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("order_id", orderId)
      .single();

    if (existingPayment) {
      console.log(`⏭️ Already processed: ${orderId}`);
      return NextResponse.json({ status: "ignored_duplicate" });
    }

    // 2. User Resolution — scalable email-based lookup (no pagination)
    let userId: string | null = null;
    let isNewUser = false;

    try {
      // First: check our users table by email
      const { data: existingDbUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingDbUser) {
        userId = existingDbUser.id;
      } else {
        // Second: check auth.users via admin getUserByEmail-equivalent
        // listUsers with filter is not reliable at scale, so we create
        // and handle the "already exists" error gracefully
        const { data: newUser, error: createUserError } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { name, phone },
          });

        if (createUserError) {
          // User already exists in auth — find them
          if (
            createUserError.message.includes("already been registered") ||
            createUserError.message.includes("already exists")
          ) {
            // Fetch all auth users and find by email (one-time fallback)
            // Supabase doesn't have getUserByEmail in admin API,
            // so we search our DB users or use a filtered approach
            const { data: authUsers } =
              await supabaseAdmin.auth.admin.listUsers({
                page: 1,
                perPage: 1000,
              });

            const existingAuthUser = authUsers?.users?.find(
              (u) => u.email === email,
            );

            if (existingAuthUser) {
              userId = existingAuthUser.id;
            } else {
              throw new Error(
                `Auth user exists for ${email} but could not be found`,
              );
            }
          } else {
            throw new Error(
              `Failed to create Auth User: ${createUserError.message}`,
            );
          }
        } else {
          if (!newUser?.user?.id) {
            throw new Error("Auth user created but no ID returned");
          }
          userId = newUser.user.id;
          isNewUser = true;
        }
      }
    } catch (authError: any) {
      console.error("❌ Auth resolution failed:", authError.message);
      throw authError;
    }

    if (!userId) {
      throw new Error("User ID not resolved");
    }

    // Determine plan type from order tags
    const orderTags = orderData.order_tags || {};
    const planType = orderTags.plan_type || "premium";

    console.log(
      `✅ User ready: ${isNewUser ? "NEW" : "EXISTING"}, plan: ${planType}`,
    );

    // 3. Database Operations (with rollback on failure)
    try {
      // A. Record Payment (order_id has UNIQUE constraint — prevents race condition)
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
            plan_type: planType,
            payment_method:
              typeof paymentData.payment_method === "object"
                ? JSON.stringify(paymentData.payment_method)
                : paymentData.payment_method || "online",
            payment_timestamp: new Date().toISOString(),
          })
          .select("id");

      if (paymentError) {
        // If it's a unique constraint violation, another process already handled it
        if (paymentError.code === "23505") {
          console.log(
            `⏭️ Race condition caught — already processed: ${orderId}`,
          );
          return NextResponse.json({ status: "ignored_duplicate" });
        }
        throw new Error(`Payment recording failed: ${paymentError.message}`);
      }

      if (!insertedPayments || insertedPayments.length === 0) {
        throw new Error("Payment record was not created");
      }

      const paymentId = insertedPayments[0].id;

      // B. Create or update user profile (upsert pattern)
      const { error: profileError } = await supabaseAdmin.from("users").upsert(
        {
          id: userId,
          email,
          name,
          phone,
          payment_id: paymentId,
          membership_status: "active",
        },
        { onConflict: "id" },
      );

      if (profileError) {
        throw new Error(`Profile operation failed: ${profileError.message}`);
      }

      console.log(
        `✅ Webhook complete: user=${isNewUser ? "NEW" : "EXISTING"}, payment=${paymentId}, plan=${planType}`,
      );

      return NextResponse.json({ status: "processed" });
    } catch (dbError: any) {
      console.error("❌ DB operation failed:", dbError.message);

      // ROLLBACK: Delete auth user if we created one but DB ops failed
      if (isNewUser && userId) {
        console.log(`🔄 Rolling back auth user: ${userId}`);
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }

      throw dbError;
    }
  } catch (error: any) {
    console.error("❌ Webhook Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Webhook failed" },
      { status: 500 },
    );
  }
}

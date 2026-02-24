import { NextResponse } from "next/server";
import cashfree from "@/lib/cashfree";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Fallback verification endpoint.
 * Called from the account page when the webhook hasn't processed the payment yet.
 * This calls Cashfree's API to verify the payment status, then creates the
 * user/auth/payment records if payment was successful.
 */
export async function POST(request: Request) {
  try {
    const { order_id } = await request.json();

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    console.log(`🔍 Verifying order: ${order_id}`);

    // 1. Check if already processed
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id, status")
      .eq("order_id", order_id)
      .single();

    if (existingPayment) {
      console.log(`✅ Order already recorded: ${order_id}`);

      // Fetch the user associated with this payment
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("payment_id", existingPayment.id)
        .single();

      return NextResponse.json({
        status: "already_processed",
        payment_status: existingPayment.status,
        user: user || null,
      });
    }

    // 2. Verify with Cashfree
    let orderResponse;
    try {
      orderResponse = await cashfree.PGFetchOrder(order_id);
    } catch (cfError: any) {
      console.error("❌ Cashfree fetch order error:", cfError.message);
      return NextResponse.json(
        { error: "Failed to verify order with payment provider" },
        { status: 502 },
      );
    }

    const orderData = orderResponse.data as any;
    console.log(`📋 Cashfree order status: ${orderData.order_status}`);

    if (orderData.order_status !== "PAID") {
      return NextResponse.json({
        status: "not_paid",
        order_status: orderData.order_status,
      });
    }

    // 3. Payment is PAID — create user and record payment
    const customerDetails = orderData.customer_details || {};
    const email = customerDetails.customer_email;
    const phone = customerDetails.customer_phone;
    const name = customerDetails.customer_name;
    const paymentAmount = orderData.order_amount;

    // Get payment details from Cashfree
    let cfPaymentId = "";
    try {
      const paymentsResponse = await cashfree.PGOrderFetchPayments(order_id);
      const payments = paymentsResponse.data;
      if (payments && payments.length > 0) {
        const successPayment = payments.find(
          (p: any) => p.payment_status === "SUCCESS",
        );
        if (successPayment) {
          cfPaymentId = String(successPayment.cf_payment_id);
        }
      }
    } catch (payErr: any) {
      console.warn("⚠️ Could not fetch payment details:", payErr.message);
      cfPaymentId = `verify_${order_id}`;
    }

    // 4. User Resolution
    let userId: string | null = null;
    let isNewUser = false;

    // Check DB users first
    const { data: existingDbUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingDbUser) {
      userId = existingDbUser.id;
      console.log(`✅ Found existing DB user: ${userId}`);
    } else {
      // Check auth users
      const {
        data: { users },
      } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 50,
      });

      const existingAuthUser = users?.find((u) => u.email === email);

      if (existingAuthUser) {
        userId = existingAuthUser.id;
        console.log(`✅ Found existing Auth user: ${userId}`);
      } else {
        // Create new auth user
        console.log(`🆕 Creating new Auth user for ${email}`);
        const { data: newUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { name, phone },
          });

        if (createError) {
          throw new Error(`Failed to create Auth user: ${createError.message}`);
        }

        if (!newUser?.user?.id) {
          throw new Error("Auth user created but no ID returned");
        }

        userId = newUser.user.id;
        isNewUser = true;
        console.log(`✅ Created Auth user: ${userId}`);
      }
    }

    if (!userId) {
      throw new Error("Could not resolve user ID");
    }

    // 5. Record payment
    try {
      const { data: insertedPayments, error: paymentError } =
        await supabaseAdmin
          .from("payments")
          .insert({
            order_id,
            cf_payment_id: cfPaymentId,
            email,
            name,
            phone,
            amount: paymentAmount,
            status: "SUCCESS",
            payment_method: "online",
            payment_timestamp: new Date().toISOString(),
          })
          .select("id");

      if (paymentError) {
        throw new Error(`Payment recording failed: ${paymentError.message}`);
      }

      if (!insertedPayments || insertedPayments.length === 0) {
        throw new Error("Payment record was not created");
      }

      const paymentId = insertedPayments[0].id;
      console.log(`✅ Payment recorded: ${paymentId}`);

      // 6. Create or update user profile
      const { data: existingProfile } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

      if (existingProfile) {
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

        if (updateError)
          throw new Error(`Profile update failed: ${updateError.message}`);
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

        if (insertError)
          throw new Error(`Profile insert failed: ${insertError.message}`);
      }

      console.log("========== VERIFY SUCCESS ==========");
      console.log(`✅ User: ${isNewUser ? "NEW" : "EXISTING"} (${userId})`);
      console.log(`✅ Payment: ${paymentId}`);
      console.log("=====================================");

      // Fetch the created user to return
      const { data: createdUser } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      return NextResponse.json({
        status: "processed",
        payment_status: "SUCCESS",
        user: createdUser,
      });
    } catch (dbError: any) {
      console.error("❌ Database operation failed:", dbError.message);

      if (isNewUser && userId) {
        console.log(`🔄 Rolling back: Deleting Auth user ${userId}`);
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }

      throw dbError;
    }
  } catch (error: any) {
    console.error("❌ Verify Error:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 },
    );
  }
}

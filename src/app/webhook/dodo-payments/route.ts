import { Webhooks } from "@dodopayments/nextjs";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Dodo Payments Webhook Handler
 * POST /webhook/dodo-payments
 *
 * Handles payment.succeeded events:
 * 1. Idempotency check by payment_id (order_id in our DB)
 * 2. Create/find auth user (scalable — no pagination)
 * 3. Record payment with plan_type
 * 4. Create/update user profile
 * 5. Rollback auth user if DB ops fail
 */
export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,

  onPaymentSucceeded: async (payload: any) => {
    console.log("📩 Dodo webhook: payment.succeeded");

    const data = payload.data || payload;

    // Extract payment details from Dodo webhook payload
    const paymentId = data.payment_id || data.id;
    const customerEmail = data.customer?.email || data.email;
    const customerName = data.customer?.name || data.name || "";
    const customerPhone = data.customer?.phone_number || data.phone_number || "";
    const paymentAmount = data.total_amount || data.amount || 0;
    const metadata = data.metadata || {};
    const planType = metadata.plan_type || "premium";
    const productId = data.product_cart?.[0]?.product_id || "";
    const currency = data.currency || "USD";

    if (!paymentId || !customerEmail) {
      console.error("❌ Missing payment_id or email in webhook payload");
      console.log("Payload keys:", Object.keys(data));
      return;
    }

    console.log(`📩 Processing: payment=${paymentId}, email=${customerEmail}`);

    // 1. Idempotency Check — by payment_id (stored as order_id)
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("order_id", paymentId)
      .single();

    if (existingPayment) {
      console.log(`⏭️ Already processed: ${paymentId}`);
      return;
    }

    // 2. User Resolution — scalable (create-then-catch approach)
    let userId: string | null = null;
    let isNewUser = false;

    try {
      // Check our users table first
      const { data: existingDbUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", customerEmail)
        .single();

      if (existingDbUser) {
        userId = existingDbUser.id;
      } else {
        // Try to create auth user — handle "already exists" gracefully
        const { data: newUser, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: customerEmail,
            email_confirm: true,
            user_metadata: { name: customerName },
          });

        if (createError) {
          if (
            createError.message.includes("already been registered") ||
            createError.message.includes("already exists")
          ) {
            const { data: authUsers } =
              await supabaseAdmin.auth.admin.listUsers({
                page: 1,
                perPage: 1000,
              });

            const found = authUsers?.users?.find(
              (u) => u.email === customerEmail,
            );

            if (found) {
              userId = found.id;
            } else {
              throw new Error(
                `Auth user exists but not found: ${customerEmail}`,
              );
            }
          } else {
            throw new Error(
              `Failed to create Auth user: ${createError.message}`,
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

    console.log(
      `✅ User: ${isNewUser ? "NEW" : "EXISTING"}, plan: ${planType}`,
    );

    // 3. Database Operations (with rollback on failure)
    try {
      // A. Record Payment (order_id UNIQUE constraint prevents race conditions)
      const { data: insertedPayments, error: paymentError } =
        await supabaseAdmin
          .from("payments")
          .insert({
            order_id: paymentId,
            cf_payment_id: paymentId,
            email: customerEmail,
            name: customerName,
            phone: customerPhone,
            amount: paymentAmount / 100,
            status: "SUCCESS",
            plan_type: planType,
            payment_method: "dodo_payments",
            payment_timestamp: new Date().toISOString(),
          })
          .select("id");

      if (paymentError) {
        if (paymentError.code === "23505") {
          console.log(`⏭️ Race condition caught: ${paymentId}`);
          return;
        }
        throw new Error(`Payment recording failed: ${paymentError.message}`);
      }

      if (!insertedPayments || insertedPayments.length === 0) {
        throw new Error("Payment record was not created");
      }

      const dbPaymentId = insertedPayments[0].id;

      // B. Create or update user profile (upsert)
      const { error: profileError } = await supabaseAdmin.from("users").upsert(
        {
          id: userId,
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
          payment_id: dbPaymentId,
          membership_status: "active",
        },
        { onConflict: "id" },
      );

      if (profileError) {
        throw new Error(`Profile operation failed: ${profileError.message}`);
      }

      console.log(
        `✅ Webhook complete: user=${isNewUser ? "NEW" : "EXISTING"}, payment=${dbPaymentId}, plan=${planType}`,
      );
    } catch (dbError: any) {
      console.error("❌ DB operation failed:", dbError.message);

      if (isNewUser && userId) {
        console.log(`🔄 Rolling back auth user`);
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }

      throw dbError;
    }
  },

  onPaymentFailed: async (payload: any) => {
    const data = payload.data || payload;
    console.log(`❌ Payment failed: ${data.payment_id || "unknown"}`);

    // Optionally record failed payments for analytics
    const paymentId = data.payment_id || data.id;
    if (paymentId) {
      await supabaseAdmin.from("payments").insert({
        order_id: paymentId,
        cf_payment_id: paymentId,
        email: data.customer?.email || "",
        name: data.customer?.name || "",
        phone: data.customer?.phone_number || data.phone_number || "",
        amount: (data.total_amount || 0) / 100,
        status: "FAILED",
        plan_type: data.metadata?.plan_type || "premium",
        payment_method: "dodo_payments",
        payment_timestamp: new Date().toISOString(),
      });
    }
  },

  onRefundSucceeded: async (payload: any) => {
    const data = payload.data || payload;
    console.log(`💸 Refund succeeded: ${data.payment_id || "unknown"}`);

    // Update payment status
    const paymentId = data.payment_id || data.id;
    if (paymentId) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "REFUNDED" })
        .eq("order_id", paymentId);

      // Optionally deactivate membership
      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("email")
        .eq("order_id", paymentId)
        .single();

      if (payment?.email) {
        await supabaseAdmin
          .from("users")
          .update({ membership_status: "inactive" })
          .eq("email", payment.email);
      }
    }
  },
});

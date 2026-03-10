import { NextResponse } from "next/server";
import dodo from "@/lib/dodo";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Dodo Payments verification endpoint.
 * Called from the account page after payment redirect.
 * POST /api/verify
 *
 * Body: { payment_id }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_id } = body;

    if (!payment_id) {
      return NextResponse.json(
        { error: "Missing payment_id" },
        { status: 400 },
      );
    }

    console.log(`🔍 Verifying Dodo payment: ${payment_id}`);

    // 1. Check if already processed in our DB
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("id, status")
      .eq("order_id", payment_id)
      .single();

    if (existingPayment) {
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

    // 2. Verify with Dodo Payments API
    let paymentData: any;
    try {
      paymentData = await dodo.payments.retrieve(payment_id);
    } catch (fetchErr: any) {
      console.error("❌ Dodo fetch error:", fetchErr.message);
      return NextResponse.json(
        { error: "Failed to verify payment with Dodo Payments" },
        { status: 502 },
      );
    }

    const paymentStatus = (paymentData as any).status;

    if (paymentStatus !== "succeeded" && paymentStatus !== "SUCCEEDED") {
      return NextResponse.json({
        status: "not_paid",
        order_status: paymentStatus,
      });
    }

    // 3. Payment succeeded — process it
    const customerEmail =
      (paymentData as any).customer?.email || (paymentData as any).email;
    const customerName =
      (paymentData as any).customer?.name || (paymentData as any).name || "";
    const paymentAmount = ((paymentData as any).total_amount || 0) / 100;
    const metadata = (paymentData as any).metadata || {};
    const planType = metadata.plan_type || "premium";

    if (!customerEmail) {
      return NextResponse.json(
        { error: "No customer email found on payment" },
        { status: 400 },
      );
    }

    // 4. User Resolution (scalable)
    let userId: string | null = null;
    let isNewUser = false;

    const { data: existingDbUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .single();

    if (existingDbUser) {
      userId = existingDbUser.id;
    } else {
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
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });

          const found = authUsers?.users?.find(
            (u) => u.email === customerEmail,
          );

          if (found) {
            userId = found.id;
          } else {
            throw new Error(`Auth user exists but not found: ${customerEmail}`);
          }
        } else {
          throw new Error(`Failed to create Auth user: ${createError.message}`);
        }
      } else {
        if (!newUser?.user?.id) {
          throw new Error("Auth user created but no ID returned");
        }
        userId = newUser.user.id;
        isNewUser = true;
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
            order_id: payment_id,
            cf_payment_id: payment_id,
            email: customerEmail,
            name: customerName,
            phone: "",
            amount: paymentAmount,
            status: "SUCCESS",
            plan_type: planType,
            payment_method: "dodo_payments",
            payment_timestamp: new Date().toISOString(),
          })
          .select("id");

      if (paymentError) {
        if (paymentError.code === "23505") {
          // Race condition: webhook already processed
          const { data: racePayment } = await supabaseAdmin
            .from("payments")
            .select("id, status")
            .eq("order_id", payment_id)
            .single();

          const { data: raceUser } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("payment_id", racePayment?.id)
            .single();

          return NextResponse.json({
            status: "already_processed",
            payment_status: racePayment?.status || "SUCCESS",
            user: raceUser || null,
          });
        }
        throw new Error(`Payment recording failed: ${paymentError.message}`);
      }

      if (!insertedPayments || insertedPayments.length === 0) {
        throw new Error("Payment record was not created");
      }

      const dbPaymentId = insertedPayments[0].id;

      // 6. Upsert user profile
      const { error: profileError } = await supabaseAdmin.from("users").upsert(
        {
          id: userId,
          email: customerEmail,
          name: customerName,
          phone: "",
          payment_id: dbPaymentId,
          membership_status: "active",
        },
        { onConflict: "id" },
      );

      if (profileError) {
        throw new Error(`Profile operation failed: ${profileError.message}`);
      }

      const { data: createdUser } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      console.log(`✅ Verify complete: plan=${planType}`);

      return NextResponse.json({
        status: "processed",
        payment_status: "SUCCESS",
        user: createdUser,
      });
    } catch (dbError: any) {
      console.error("❌ DB operation failed:", dbError.message);

      if (isNewUser && userId) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }

      throw dbError;
    }
  } catch (error: any) {
    console.error("❌ Verify Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 },
    );
  }
}

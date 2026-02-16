import { NextResponse } from "next/server";
import { Cashfree } from "cashfree-pg";
import { supabase } from "@/lib/supabase";

Cashfree.XClientId = process.env.CASHFREE_APP_ID!;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
Cashfree.XEnvironment =
  process.env.CASHFREE_ENV === "PROD"
    ? Cashfree.Environment.PRODUCTION
    : Cashfree.Environment.SANDBOX;

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");
    const body = await request.text(); // Raw body for verification

    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify Signature
    try {
      Cashfree.PGVerifyWebhookSignature(signature, body, timestamp);
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

      // 1. Check if user exists, create if not
      const { data: existingUser, error: userFetchError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .single();

      if (!existingUser) {
        const { error: createUserError } = await supabase.from("users").insert({
          name,
          email,
          phone,
          membership_status: "active",
        });

        if (createUserError) {
          console.error("Error creating user:", createUserError);
          return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 },
          );
        }
      } else {
        // Update existing user status if needed
        await supabase
          .from("users")
          .update({ membership_status: "active" })
          .eq("email", email);
      }

      // 2. Record Payment
      const { error: paymentError } = await supabase.from("payments").insert({
        order_id: orderId,
        cf_payment_id: cfPaymentId,
        email,
        amount: paymentAmount,
        status: "SUCCESS",
      });

      if (paymentError) {
        // If duplicate payment ID, likely idempotent retry. Log and ignore.
        if (paymentError.code === "23505") {
          // Unique violation
          console.log("Payment already recorded:", cfPaymentId);
          return NextResponse.json({ status: "ignored" });
        }
        console.error("Error recording payment:", paymentError);
        return NextResponse.json(
          { error: "Failed to record payment" },
          { status: 500 },
        );
      }

      return NextResponse.json({ status: "processed" });
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

import { NextResponse } from "next/server";
import dodo from "@/lib/dodo";

/**
 * Creates a Dodo Payments checkout session.
 * POST /api/checkout
 *
 * Body: { email, name, plan: "premium" | "premium-plus" }
 * Returns: { checkout_url }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, plan } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Missing required fields (email, name)" },
        { status: 400 },
      );
    }

    // Select the product ID based on plan
    const planType = plan === "premium-plus" ? "premium-plus" : "premium";
    const productId =
      planType === "premium-plus"
        ? process.env.DODO_PREMIUM_PLUS_PRODUCT_ID!
        : process.env.DODO_PREMIUM_PRODUCT_ID!;

    if (!productId) {
      console.error(`Missing product ID for plan: ${planType}`);
      return NextResponse.json(
        { error: "Product configuration error" },
        { status: 500 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://auth.crazyui.com";

    // Use Checkout Sessions API (recommended by Dodo)
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email: email,
        name: name,
      },
      return_url: `${baseUrl}/account`,
      metadata: {
        plan_type: planType,
      },
    });

    const checkoutUrl =
      (session as any).checkout_url ||
      (session as any).payment_link ||
      (session as any).url;
    const paymentId =
      (session as any).payment_id ||
      (session as any).id ||
      (session as any).session_id;

    if (!checkoutUrl) {
      console.error("No checkout URL in Dodo response");
      return NextResponse.json(
        { error: "No checkout URL in response" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      checkout_url: checkoutUrl,
      payment_id: paymentId,
    });
  } catch (error: any) {
    console.error("Checkout creation failed:", error.message);
    return NextResponse.json(
      {
        error: error.message || "Failed to create checkout",
      },
      { status: 500 },
    );
  }
}

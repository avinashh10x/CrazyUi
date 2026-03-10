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
      console.error(`❌ Missing product ID for plan: ${planType}`);
      return NextResponse.json(
        { error: "Product configuration error" },
        { status: 500 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://crazyui.com";

    console.log(
      `📦 Creating checkout session: plan=${planType}, product=${productId}`,
    );

    // Use Checkout Sessions API (recommended by Dodo)
    // instead of deprecated payments.create
    let session: any;
    let usedFallback = false;

    try {
      session = await dodo.checkoutSessions.create({
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
    } catch (sdkError: any) {
      console.error("SDK checkoutSessions.create failed:", sdkError.message);
      console.error("Trying raw API call as fallback...");

      // Fallback: direct API call to test auth
      const apiKey = process.env.DODO_PAYMENTS_API_KEY!;
      const env = process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode";
      const baseApiUrl =
        env === "live_mode"
          ? "https://api.dodopayments.com"
          : "https://test.dodopayments.com";

      console.log(`  Using base URL: ${baseApiUrl}`);
      console.log(`  API key prefix: ${apiKey.substring(0, 12)}...`);

      const rawResponse = await fetch(`${baseApiUrl}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          billing: {
            city: "NA",
            country: "US",
            state: "NA",
            street: "NA",
            zipcode: "00000",
          },
          customer: {
            email: email,
            name: name,
          },
          product_cart: [
            {
              product_id: productId,
              quantity: 1,
            },
          ],
          payment_link: true,
          return_url: `${baseUrl}/account`,
          metadata: {
            plan_type: planType,
          },
        }),
      });

      const rawData = await rawResponse.json();
      console.log(
        `  Raw API response (${rawResponse.status}):`,
        JSON.stringify(rawData),
      );

      if (!rawResponse.ok) {
        throw new Error(
          `Dodo API error (${rawResponse.status}): ${JSON.stringify(rawData)}`,
        );
      }

      session = rawData;
      usedFallback = true;
    }

    // Extract checkout URL from response
    const checkoutUrl =
      session.checkout_url || session.payment_link || session.url;
    const paymentId = session.payment_id || session.id || session.session_id;

    console.log(
      `✅ Checkout created (${usedFallback ? "raw API" : "SDK"}): ${paymentId}`,
    );
    console.log(`  Checkout URL: ${checkoutUrl}`);

    if (!checkoutUrl) {
      console.error("  Full response:", JSON.stringify(session));
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
    console.error("❌ Checkout creation failed:", error.message);
    if (error.status) console.error("  Status:", error.status);
    if (error.error)
      console.error("  Error body:", JSON.stringify(error.error));
    return NextResponse.json(
      {
        error: error.message || "Failed to create checkout",
      },
      { status: 500 },
    );
  }
}

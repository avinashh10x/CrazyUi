import { NextResponse } from "next/server";
import cashfree from "@/lib/cashfree";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, plan } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate and get plan amount
    const planType = plan === "premium-plus" ? "premium-plus" : "premium";
    let orderAmount: number;

    if (planType === "premium-plus") {
      orderAmount = parseFloat(
        process.env.NEXT_PUBLIC_PREMIUM_PLUS_AMOUNT || "2",
      );
    } else {
      orderAmount = parseFloat(process.env.NEXT_PUBLIC_PREMIUM_AMOUNT || "1");
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const customerId = email.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40);

    const requestData = {
      order_amount: orderAmount,
      order_currency: process.env.NEXT_PUBLIC_CURRENCY || "INR",
      order_id: orderId,
      customer_details: {
        customer_id: customerId,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://crazyui.com"}/account?order_id={order_id}`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://crazyui.com"}/api/membership/webhook`,
      },
      order_tags: {
        plan_type: planType,
      },
    };

    console.log(`📦 Creating order: plan=${planType}, amount=${orderAmount}`);

    const response = await cashfree.PGCreateOrder(requestData);

    console.log(`✅ Order created: ${orderId}`);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("❌ Order creation failed:", error.message);

    return NextResponse.json(
      {
        error: error.message || "Failed to create order",
        details: error.response?.data?.message || "No additional details",
      },
      { status: 500 },
    );
  }
}

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
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/?order_id={order_id}`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/membership/webhook`,
        plan_type: planType, // Store plan type for reference
      },
    };

    const response = await cashfree.PGCreateOrder(requestData);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 },
    );
  }
}

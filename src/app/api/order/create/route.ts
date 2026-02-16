import { NextResponse } from "next/server";
import { Cashfree } from "cashfree-pg";

Cashfree.XClientId = process.env.CASHFREE_APP_ID!;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const customerId = email.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40); // Sanitize email for customer_id

    const requestData = {
      order_amount: 100.0, // Fixed membership fee
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: customerId,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/account?order_id={order_id}`,
      },
    };

    const response = await Cashfree.PGCreateOrder("2023-08-01", requestData); // Check API version compatibility
    const data = response.data;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 },
    );
  }
}

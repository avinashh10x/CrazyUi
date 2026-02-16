import { NextRequest, NextResponse } from 'next/server';
import { createCashfreeOrder } from '@/lib/cashfree';
import { emailExists } from '@/lib/supabase-admin';
import type { CreateOrderRequest, CreateOrderResponse } from '@/types/membership';

/**
 * POST /api/order/create
 * Creates a payment order with Cashfree
 */
export async function POST(req: NextRequest) {
    try {
        const body: CreateOrderRequest = await req.json();
        const { name, email, phone } = body;

        // Validate input
        if (!name || !email || !phone) {
            return NextResponse.json(
                { success: false, error: 'Name, email, and phone are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate phone format (basic check for digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            return NextResponse.json(
                { success: false, error: 'Phone number must be 10 digits' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const exists = await emailExists(email);
        if (exists) {
            return NextResponse.json(
                { success: false, error: 'Email already registered' },
                { status: 400 }
            );
        }

        // Generate unique order ID
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Get membership amount from environment
        const amount = parseFloat(process.env.NEXT_PUBLIC_MEMBERSHIP_AMOUNT || '999');

        // Create Cashfree order
        const orderResponse = await createCashfreeOrder({
            orderId,
            amount,
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
        });

        const response: CreateOrderResponse = {
            success: true,
            paymentSessionId: orderResponse.payment_session_id,
            orderId: orderResponse.order_id,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
        console.error('Order creation error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create order' },
            { status: 500 }
        );
    }
}

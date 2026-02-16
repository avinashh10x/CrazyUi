import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/cashfree';
import { createUser, createPayment, orderExists } from '@/lib/supabase-admin';
import type { CashfreeWebhookPayload } from '@/types/membership';

/**
 * POST /api/membership/webhook
 * Handles Cashfree payment webhook
 */
export async function POST(req: NextRequest) {
    try {
        // Get webhook headers
        const signature = req.headers.get('x-webhook-signature');
        const timestamp = req.headers.get('x-webhook-timestamp');

        if (!signature || !timestamp) {
            console.error('Missing webhook signature or timestamp');
            return NextResponse.json(
                { error: 'Missing signature or timestamp' },
                { status: 401 }
            );
        }

        // Get raw body for signature verification
        const rawBody = await req.text();

        // Verify webhook signature
        const isValid = verifyWebhookSignature(rawBody, signature, timestamp);
        if (!isValid) {
            console.error('Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Parse webhook payload
        const payload: CashfreeWebhookPayload = JSON.parse(rawBody);

        // Only process successful payments
        if (payload.data.payment.payment_status !== 'SUCCESS') {
            console.log('Payment not successful, ignoring webhook');
            return NextResponse.json({ received: true }, { status: 200 });
        }

        const { order, payment, customer_details } = payload.data;

        // Check idempotency - if order already processed, return success
        const alreadyProcessed = await orderExists(order.order_id);
        if (alreadyProcessed) {
            console.log('Order already processed, returning success');
            return NextResponse.json({ received: true }, { status: 200 });
        }

        // Create payment record first
        await createPayment({
            order_id: order.order_id,
            cf_payment_id: payment.cf_payment_id,
            email: customer_details.customer_email,
            amount: payment.payment_amount,
            status: 'SUCCESS',
        });

        // Create user account
        await createUser({
            name: customer_details.customer_name,
            email: customer_details.customer_email,
            phone: customer_details.customer_phone,
        });

        console.log('User account created successfully for:', customer_details.customer_email);

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error: any) {
        console.error('Webhook processing error:', error);

        // Return 200 to prevent Cashfree from retrying
        // Log error for manual review
        return NextResponse.json(
            { error: 'Internal error', message: error.message },
            { status: 500 }
        );
    }
}

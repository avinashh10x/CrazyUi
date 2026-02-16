import { Cashfree } from 'cashfree-pg';

// Initialize Cashfree SDK
const cashfree = new Cashfree({
    appId: process.env.CASHFREE_APP_ID!,
    secretKey: process.env.CASHFREE_SECRET_KEY!,
    env: process.env.CASHFREE_MODE === 'LIVE' ? 'PROD' : 'TEST',
});

/**
 * Create a payment order with Cashfree
 */
export async function createCashfreeOrder(params: {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
}) {
    try {
        const orderRequest = {
            order_id: params.orderId,
            order_amount: params.amount,
            order_currency: process.env.NEXT_PUBLIC_CURRENCY || 'INR',
            customer_details: {
                customer_id: params.customerEmail,
                customer_name: params.customerName,
                customer_email: params.customerEmail,
                customer_phone: params.customerPhone,
            },
            order_meta: {
                return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/membership/success?order_id={order_id}`,
                notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/membership/webhook`,
            },
        };

        const response = await cashfree.PGCreateOrder('2023-08-01', orderRequest);
        return response.data;
    } catch (error: any) {
        console.error('Cashfree order creation failed:', error);
        throw new Error(error.message || 'Failed to create payment order');
    }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string
): boolean {
    const crypto = require('crypto');
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET!;

    // Cashfree signature format: timestamp + payload
    const signedPayload = timestamp + payload;

    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload)
        .digest('base64');

    return signature === expectedSignature;
}

export { cashfree };

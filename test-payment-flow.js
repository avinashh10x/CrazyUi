// Native fetch used in Node 18+
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || 'YOUR_TEST_SECRET_KEY'; // Load from env or placeholder
const LOG_FILE = path.join(__dirname, 'test_log.txt');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message); // Still log to console just in case
    try {
        fs.appendFileSync(LOG_FILE, logMessage);
    } catch (e) {
        console.error("Failed to write to log file:", e);
    }
}

// Clear log file
try {
    if (fs.existsSync(LOG_FILE)) {
        fs.unlinkSync(LOG_FILE);
    }
} catch (e) { }

async function testPaymentFlow() {
    log('🚀 Starting Payment Flow Test...');

    // 1. Create Order
    log('\n1️⃣ Creating Order...');
    const orderPayload = {
        name: 'Test User',
        email: `test_user_${Date.now()}@example.com`,
        phone: '9999999999',
        plan: 'premium'
    };

    try {
        const createRes = await fetch(`${BASE_URL}/api/order/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        if (!createRes.ok) {
            const errorText = await createRes.text();
            throw new Error(`Create Order failed: ${createRes.status} ${createRes.statusText} - ${errorText}`);
        }

        const createData = await createRes.json();
        log('✅ Order Created: ' + JSON.stringify(createData, null, 2));

        if (!createData.payment_session_id || !createData.order_id) {
            throw new Error('Missing payment_session_id or order_id');
        }

        const orderId = createData.order_id;

        // 2. Simulate Webhook
        log(`\n2️⃣ Simulating Webhook for Order: ${orderId}...`);

        const webhookPayload = {
            data: {
                payment: {
                    cf_payment_id: `pay_${Date.now()}`,
                    payment_amount: 1.00,
                    payment_status: "SUCCESS"
                },
                order: {
                    order_id: orderId,
                    order_amount: 1.00
                },
                customer_details: {
                    customer_email: orderPayload.email,
                    customer_phone: orderPayload.phone,
                    customer_name: orderPayload.name
                }
            },
            type: "PAYMENT_SUCCESS_WEBHOOK",
            event_time: new Date().toISOString()
        };

        const rawBody = JSON.stringify(webhookPayload);
        const timestamp = Math.floor(Date.now() / 1000).toString();

        // Generate Signature: HMAC-SHA256(timestamp + rawBody, secretKey)
        const signaturePayload = timestamp + rawBody;
        const signature = crypto
            .createHmac('sha256', CASHFREE_SECRET_KEY)
            .update(signaturePayload)
            .digest('base64');

        log('Generated Signature: ' + signature);

        const webhookRes = await fetch(`${BASE_URL}/api/membership/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-signature': signature,
                'x-webhook-timestamp': timestamp
            },
            body: rawBody
        });

        const webhookText = await webhookRes.text();
        log('--------------------------------------------------');
        log(`Webhook Response Status: ${webhookRes.status} ${webhookRes.statusText}`);
        log('Webhook Response Body Start:');
        log(webhookText);
        log('Webhook Response Body End');
        log('--------------------------------------------------');

        if (webhookRes.ok) {
            log('\n✅ Test Flow Check Complete! Check Supabase to confirm user and payment were saved.');
        } else {
            log('\n❌ Webhook Failed');
            throw new Error(`Webhook failed with status ${webhookRes.status}`);
        }

    } catch (error) {
        log('\n❌ Test Failed: ' + error.stack);
        process.exit(1);
    }
}

testPaymentFlow();

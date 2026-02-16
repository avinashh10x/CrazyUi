# CrazyUI Membership System - Setup & Testing Guide

## 🚀 Quick Start

### 1. Install Dependencies

Dependencies are already installed:
- `@supabase/supabase-js` - Supabase client
- `cashfree-pg` - Cashfree payment gateway SDK

### 2. Database Setup

Follow the instructions in `DATABASE_SETUP.md` to:
1. Create `users` and `payments` tables in Supabase
2. Set up indexes and RLS policies
3. Get your Supabase credentials

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Cashfree (Get from Cashfree Dashboard)
CASHFREE_APP_ID=your_test_app_id
CASHFREE_SECRET_KEY=your_test_secret_key
CASHFREE_WEBHOOK_SECRET=your_webhook_secret
CASHFREE_MODE=TEST

# Supabase (Get from Supabase Dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_MEMBERSHIP_AMOUNT=999
NEXT_PUBLIC_CURRENCY=INR
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Get Cashfree Credentials

#### For Testing (Sandbox Mode):
1. Sign up at [Cashfree Dashboard](https://merchant.cashfree.com/merchants/signup)
2. Go to **Developers** → **API Keys**
3. Copy **Test App ID** and **Test Secret Key**
4. Go to **Developers** → **Webhooks**
5. Copy **Webhook Secret Key**

#### For Production:
1. Complete KYC verification in Cashfree
2. Switch to **Live Mode** in dashboard
3. Copy **Live App ID** and **Live Secret Key**
4. Update `CASHFREE_MODE=LIVE` in `.env.local`

---

## 🧪 Local Testing with Webhooks

Webhooks require a public URL. For local testing, use **ngrok** or **localtunnel**.

### Option 1: Using ngrok (Recommended)

1. **Install ngrok:**
   ```bash
   brew install ngrok
   # or download from https://ngrok.com/download
   ```

2. **Start your Next.js app:**
   ```bash
   npm run dev
   ```

3. **Start ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Update Cashfree webhook URL:**
   - Go to Cashfree Dashboard → Developers → Webhooks
   - Set webhook URL: `https://abc123.ngrok.io/api/membership/webhook`
   - Save

6. **Update `.env.local`:**
   ```env
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```

7. **Restart your app** to apply new environment variable

### Option 2: Using localtunnel

```bash
# Install
npm install -g localtunnel

# Start tunnel
lt --port 3000 --subdomain crazyui-test

# Use URL: https://crazyui-test.loca.lt
```

---

## ✅ Testing Flow

### 1. Test Successful Payment

1. Visit `http://localhost:3000/membership`
2. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Phone: 9999999999
3. Click **Pay & Join CrazyUI**
4. Use Cashfree test card:
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: Any future date
5. Complete payment
6. Verify:
   - Redirected to success page
   - Check Supabase `users` table for new user
   - Check Supabase `payments` table for payment record

### 2. Test Duplicate Email

1. Try to register with the same email again
2. Should see error: "Email already registered"

### 3. Test Failed Payment

1. Use Cashfree test card for failure:
   - Card: `4012 0010 3714 1112`
2. Payment should fail
3. Verify:
   - No user created in database
   - Redirected to failure page

### 4. Test Webhook Idempotency

1. Complete a successful payment
2. In Cashfree dashboard, manually resend the webhook
3. Verify:
   - No duplicate user created
   - Webhook returns 200 OK
   - Check server logs for "Order already processed"

---

## 🔍 Debugging

### Check Server Logs

Your Next.js console will show:
- Order creation requests
- Webhook signature verification
- User creation success/failure
- Any errors

### Check Supabase Tables

```sql
-- View recent users
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- View recent payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- Check for duplicates
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;
```

### Common Issues

**Issue: "Missing signature or timestamp"**
- Webhook headers not received
- Check ngrok/localtunnel is running
- Verify webhook URL in Cashfree dashboard

**Issue: "Invalid signature"**
- Wrong webhook secret key
- Check `CASHFREE_WEBHOOK_SECRET` in `.env.local`

**Issue: "Failed to create user"**
- Database connection issue
- Check Supabase credentials
- Verify tables exist

**Issue: Cashfree SDK error**
- Wrong App ID or Secret Key
- Check credentials in `.env.local`
- Verify mode (TEST vs LIVE)

---

## 📦 Production Deployment

### 1. Prepare Environment

1. Get Cashfree **Live** credentials
2. Update `.env` in Vercel/hosting:
   ```env
   CASHFREE_MODE=LIVE
   CASHFREE_APP_ID=live_app_id
   CASHFREE_SECRET_KEY=live_secret_key
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

### 2. Update Webhook URL

In Cashfree Dashboard:
- Set webhook URL: `https://your-domain.com/api/membership/webhook`

### 3. Deploy

```bash
# Build locally to test
npm run build

# Deploy to Vercel
vercel --prod
```

### 4. Test Production

1. Make a small test payment (₹1 or minimum)
2. Verify user creation
3. Monitor logs for any errors

---

## 🎯 Architecture Summary

```
User fills form
    ↓
POST /api/order/create
    ↓
Cashfree creates order
    ↓
User redirected to Cashfree checkout
    ↓
User completes payment
    ↓
Cashfree sends webhook → POST /api/membership/webhook
    ↓
Verify signature → Check idempotency → Create user
    ↓
User redirected to success page
```

---

## 📞 Support

For issues:
1. Check server logs
2. Verify environment variables
3. Test database connection
4. Check Cashfree dashboard for payment status

**Cashfree Support:** https://docs.cashfree.com/
**Supabase Support:** https://supabase.com/docs

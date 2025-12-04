# Payment System Documentation

## Overview

GodKnife now supports three payment providers for purchasing post credits:
- **Stripe** - Card payments (recommended)
- **PayPal** - PayPal account payments
- **MyPOS** - Alternative payment processor

## Environment Variables

Add these to your `.env` file:

### Stripe Configuration
```bash
# Get these from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Get this from https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Existing PayPal Configuration
```bash
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox # or 'live' for production
```

### Existing MyPOS Configuration
```bash
MYPOS_MERCHANT_ID=your_merchant_id
MYPOS_PRIVATE_KEY=your_private_key
MYPOS_API_URL=https://mypos.com/vmp/checkout
```

### Pricing Configuration
```bash
# Price per single credit in EUR
POST_PURCHASE_PRICE=1

# Price for boosting a post (10 days)
BOOST_PRICE=10
```

## Credit Packages

The system offers 4 predefined packages with automatic bulk discounts:

| Credits | Base Price | Discount | Final Price | Price/Credit |
|---------|------------|----------|-------------|--------------|
| 5       | €5.00      | 0%       | €5.00       | €1.00        |
| 10      | €10.00     | 10%      | €9.00       | €0.90        |
| 20      | €20.00     | 20%      | €16.00      | €0.80        |
| 50      | €50.00     | 30%      | €35.00      | €0.70        |

## User Flow

1. **Access Payment Page**: `/payment/buy-credits`
2. **Select Credits**: Choose from 5, 10, 20, or 50 credits
3. **Select Provider**: Choose Stripe, PayPal, or MyPOS
4. **Complete Payment**: Redirected to provider checkout
5. **Success/Cancel**: Return to `/payment/success` or `/payment/cancel`

## API Routes

### Create Stripe Session
**POST** `/api/payments/stripe/create-session`

Request:
```json
{
  "type": "POST_CREDITS",
  "quantity": 10
}
```

Response:
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### Stripe Webhook
**POST** `/api/payments/stripe/webhook`

Handles:
- `checkout.session.completed` - Credits user account
- `checkout.session.expired` - Marks payment as failed

### PayPal Create Order
**POST** `/api/payments/paypal/create-order`

Request:
```json
{
  "type": "POST_CREDITS",
  "quantity": 10
}
```

Response:
```json
{
  "orderId": "...",
  "approvalUrl": "https://paypal.com/..."
}
```

### MyPOS Create Payment
**POST** `/api/payments/mypos/create-payment`

Request:
```json
{
  "type": "POST_CREDITS",
  "quantity": 10
}
```

Response:
```json
{
  "paymentUrl": "https://mypos.com/...",
  "paymentData": { /* payment form data */ }
}
```

## Database Schema

### Payment Model
```prisma
model Payment {
  id                String          @id @default(cuid())
  userId            String
  amount            Float
  currency          String          @default("EUR")
  provider          PaymentProvider // PAYPAL, MYPOS, STRIPE
  providerPaymentId String?
  type              PaymentType     // POST_CREDITS, BOOST
  quantity          Int
  status            PaymentStatus   // PENDING, COMPLETED, FAILED, REFUNDED
  user              User            @relation(fields: [userId], references: [id])
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}
```

## Webhook Setup

### Stripe Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Testing Webhooks Locally
Use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/payments/stripe/webhook
```

## Security Notes

1. **Webhook Verification**: All webhooks verify signatures before processing
2. **Idempotency**: Payment records prevent double-crediting
3. **Session Validation**: All payment routes require authentication
4. **Metadata Tracking**: Provider transaction IDs stored for auditing

## Testing

### Test Cards (Stripe)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Use any future expiry date and any 3-digit CVC

### PayPal Sandbox
Use PayPal sandbox accounts from https://developer.paypal.com

## URLs

- Payment Page: `/payment/buy-credits`
- Success Page: `/payment/success?session_id={id}`
- Cancel Page: `/payment/cancel`
- User API: `/api/users/me` (get current credits)

## Translation Keys

All payment-related UI strings are translatable in:
- `messages/en.json`
- `messages/bg.json`

Under the `payment` namespace.

## Post Boost Feature

To boost a post (promote for 10 days):

```json
{
  "type": "BOOST",
  "postId": "post_id_here"
}
```

This will:
1. Charge the boost price (default €10)
2. Set `post.isBoosted = true`
3. Set `post.boostedUntil = now() + 10 days`

# Payment Tests

This directory contains comprehensive tests for the GodKnife payment system.

## Test Files

### `stripe-payments.test.ts`
Tests for Stripe payment integration:
- Session creation with authentication
- Invalid payment type rejection
- Bulk discount calculations (10%, 20%, 30%)
- Payment record creation
- Webhook processing (success and expiry)
- Post boosting functionality

### `paypal-payments.test.ts`
Tests for PayPal payment integration:
- Order creation authentication
- Bulk discount calculations
- Payment record creation
- Payment capture flow
- Missing postId validation for boost payments

### `mypos-payments.test.ts`
Tests for MyPOS payment integration:
- Payment creation authentication
- Bulk discount calculations for all tiers
- Payment record creation

### `payment-flow.test.ts`
Integration tests for complete payment flows:
- Full credit purchase flow (pending → completed → credited)
- Payment failure handling
- Post creation after credit purchase
- Payment history tracking
- Total spent calculations
- Provider statistics
- Complete boost payment flow with post updates

## Running Tests

### Run all payment tests
```bash
npm test -- __tests__/payments
```

### Run specific test file
```bash
npm test -- __tests__/payments/stripe-payments.test.ts
npm test -- __tests__/payments/paypal-payments.test.ts
npm test -- __tests__/payments/mypos-payments.test.ts
npm test -- __tests__/payments/payment-flow.test.ts
```

### Run in watch mode
```bash
npm run test:watch -- __tests__/payments
```

## Test Results

**Status:** ✅ All 21 tests passing

```
Test Suites: 4 passed, 4 total
Tests:       21 passed, 21 total
Time:        ~2.1 seconds
```

## Test Coverage

### Stripe Payment Tests (8 tests)
- ✅ Discount calculations (0%, 10%, 20%, 30%)
- ✅ Database record creation
- ✅ User credit updates
- ✅ Payment status transitions
- ✅ Post boosting with expiry dates

### PayPal Payment Tests (4 tests)
- ✅ Bulk discount calculations
- ✅ Payment record creation
- ✅ Payment capture processing
- ✅ Validation for boost payments

### MyPOS Payment Tests (2 tests)
- ✅ Discount calculations for all tiers
- ✅ Payment record creation

### Integration Flow Tests (7 tests)
- ✅ Complete purchase flow (pending → completed)
- ✅ Failed payment handling
- ✅ Post creation eligibility
- ✅ Payment history maintenance
- ✅ Multi-payment tracking
- ✅ Total spending calculations
- ✅ Provider-based statistics
- ✅ Boost payment flow

## Pricing Test Cases

| Credits | Base Price | Discount | Final Price | Test Coverage |
|---------|-----------|----------|-------------|---------------|
| 5       | €5.00     | 0%       | €5.00       | ✅ All providers |
| 10      | €10.00    | 10%      | €9.00       | ✅ All providers |
| 20      | €20.00    | 20%      | €16.00      | ✅ All providers |
| 50      | €50.00    | 30%      | €35.00      | ✅ All providers |

## Database Cleanup

All tests include proper cleanup:
- `beforeAll`: Creates test users
- `afterAll`: Deletes payments and users
- `beforeEach`: Creates fresh test data per test
- Isolated test data using timestamps

## Prerequisites

- Docker services running (`docker-compose up -d`)
- PostgreSQL database available
- Test environment configured
- Prisma client generated

## Test Data

Tests create isolated users with unique identifiers:
- `test-payments-stripe-${timestamp}@example.com`
- `test-payments-paypal-${timestamp}@example.com`
- `test-payments-mypos-${timestamp}@example.com`
- `test-payment-flow-${timestamp}@example.com`

## Notes

- Tests use actual database (not mocked)
- External payment APIs (Stripe, PayPal, MyPOS) are not called
- Tests verify business logic and database operations
- Webhook signature verification is tested separately
- Test users are automatically cleaned up after tests

## Future Enhancements

- [ ] Mock Stripe API for full integration tests
- [ ] Test webhook signature verification
- [ ] Test concurrent payment processing
- [ ] Test payment refund flows
- [ ] Test currency conversion
- [ ] Test payment analytics
- [ ] Test expired boost cleanup
- [ ] Test payment invoice generation

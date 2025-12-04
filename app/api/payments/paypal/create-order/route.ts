import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addPostCredits } from '@/lib/post-limits'
import paypal from '@paypal/checkout-server-sdk'
import { addDays } from 'date-fns'

// PayPal environment setup
const environment = process.env.PAYPAL_MODE === 'live'
    ? new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID!,
        process.env.PAYPAL_CLIENT_SECRET!
    )
    : new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID!,
        process.env.PAYPAL_CLIENT_SECRET!
    )

const client = new paypal.core.PayPalHttpClient(environment)

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { type, quantity: requestedQuantity, postId } = body // type: 'POST_CREDITS' or 'BOOST'

        let amount: number
        let quantity: number
        let description: string

        if (type === 'POST_CREDITS') {
            const pricePerCredit = parseFloat(process.env.POST_PURCHASE_PRICE || '1')
            quantity = requestedQuantity || 5

            // Apply discounts for bulk purchases
            let discountMultiplier = 1
            if (quantity >= 50) {
                discountMultiplier = 0.7 // 30% discount
            } else if (quantity >= 20) {
                discountMultiplier = 0.8 // 20% discount
            } else if (quantity >= 10) {
                discountMultiplier = 0.9 // 10% discount
            }

            amount = quantity * pricePerCredit * discountMultiplier
            description = `${quantity} Post Credits`
        } else if (type === 'BOOST') {
            if (!postId) {
                return NextResponse.json(
                    { error: 'Post ID is required for boosting' },
                    { status: 400 }
                )
            }
            amount = parseFloat(process.env.BOOST_PRICE || '10')
            quantity = 1
            description = 'Boost Post for 10 days'
        } else {
            return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
        }

        // Create PayPal order
        const request = new paypal.orders.OrdersCreateRequest()
        request.prefer('return=representation')
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'EUR',
                    value: amount.toFixed(2),
                },
                description,
            }],
            application_context: {
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
            },
        })

        const order = await client.execute(request)

        // Create payment record
        await prisma.payment.create({
            data: {
                userId: session.user.id,
                amount,
                currency: 'EUR',
                provider: 'PAYPAL',
                providerPaymentId: order.result.id,
                type,
                quantity,
                status: 'PENDING',
            },
        })

        return NextResponse.json({
            orderId: order.result.id,
            approvalUrl: order.result.links?.find((link: any) => link.rel === 'approve')?.href,
        })
    } catch (error) {
        console.error('PayPal create order error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

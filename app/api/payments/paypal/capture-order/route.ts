import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addPostCredits } from '@/lib/post-limits'
import paypal from '@paypal/checkout-server-sdk'
import { addDays } from 'date-fns'

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
        const { orderId } = body

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            )
        }

        // Capture the payment
        const request = new paypal.orders.OrdersCaptureRequest(orderId)
        request.requestBody({})

        const capture = await client.execute(request)

        // Find payment record
        const payment = await prisma.payment.findFirst({
            where: {
                providerPaymentId: orderId,
                userId: session.user.id,
            },
        })

        if (!payment) {
            return NextResponse.json(
                { error: 'Payment record not found' },
                { status: 404 }
            )
        }

        // Update payment status
        await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'COMPLETED' },
        })

        // Process the purchase
        if (payment.type === 'POST_CREDITS') {
            await addPostCredits(session.user.id, payment.quantity)
        } else if (payment.type === 'BOOST') {
            // Find the post and boost it
            const { searchParams } = new URL(req.url)
            const postId = searchParams.get('postId')

            if (postId) {
                await prisma.post.update({
                    where: { id: postId },
                    data: {
                        isBoosted: true,
                        boostExpiresAt: addDays(new Date(), 10),
                    },
                })
            }
        }

        return NextResponse.json({
            success: true,
            captureId: capture.result.id,
        })
    } catch (error) {
        console.error('PayPal capture order error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

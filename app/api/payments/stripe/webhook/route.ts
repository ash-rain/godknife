import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addPostCredits } from '@/lib/post-limits'
import Stripe from 'stripe'
import { addDays } from 'date-fns'

const getStripeClient = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-11-17.clover',
    })
}

export async function POST(req: NextRequest) {
    try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
        if (!webhookSecret) {
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            )
        }

        const body = await req.text()
        const signature = req.headers.get('stripe-signature')!

        let event: Stripe.Event

        try {
            const stripe = getStripeClient()
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message)
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            )
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session

                const userId = session.metadata?.userId
                const type = session.metadata?.type
                const quantity = parseInt(session.metadata?.quantity || '0')
                const postId = session.metadata?.postId

                if (!userId || !type) {
                    console.error('Missing metadata in Stripe session')
                    return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 })
                }

                // Update payment status
                await prisma.payment.updateMany({
                    where: {
                        providerPaymentId: session.id,
                        status: 'PENDING',
                    },
                    data: {
                        status: 'COMPLETED',
                    },
                })

                // Process the payment
                if (type === 'POST_CREDITS') {
                    await addPostCredits(userId, quantity)
                } else if (type === 'BOOST' && postId) {
                    await prisma.post.update({
                        where: { id: postId },
                        data: {
                            isBoosted: true,
                            boostExpiresAt: addDays(new Date(), 10),
                        },
                    })
                }

                break
            }

            case 'checkout.session.expired': {
                const session = event.data.object as Stripe.Checkout.Session

                await prisma.payment.updateMany({
                    where: {
                        providerPaymentId: session.id,
                        status: 'PENDING',
                    },
                    data: {
                        status: 'FAILED',
                    },
                })

                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Stripe webhook error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

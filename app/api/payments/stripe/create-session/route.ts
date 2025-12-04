import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

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
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { type, quantity, postId } = body // type: 'POST_CREDITS' or 'BOOST', quantity: number of credits

        let amount: number
        let description: string
        let creditsQuantity: number

        if (type === 'POST_CREDITS') {
            // Calculate price based on quantity (e.g., 5 credits = 5 EUR, 10 credits = 9 EUR, etc.)
            const pricePerCredit = parseFloat(process.env.POST_PURCHASE_PRICE || '1')
            creditsQuantity = quantity || 5

            // Apply discounts for bulk purchases
            if (creditsQuantity >= 50) {
                amount = creditsQuantity * pricePerCredit * 0.7 // 30% discount
            } else if (creditsQuantity >= 20) {
                amount = creditsQuantity * pricePerCredit * 0.8 // 20% discount
            } else if (creditsQuantity >= 10) {
                amount = creditsQuantity * pricePerCredit * 0.9 // 10% discount
            } else {
                amount = creditsQuantity * pricePerCredit
            }

            description = `${creditsQuantity} Post Credits`
        } else if (type === 'BOOST') {
            if (!postId) {
                return NextResponse.json(
                    { error: 'Post ID is required for boosting' },
                    { status: 400 }
                )
            }
            amount = parseFloat(process.env.BOOST_PRICE || '10')
            creditsQuantity = 1
            description = 'Boost Post for 10 days'
        } else {
            return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
        }

        // Create Stripe checkout session
        const stripe = getStripeClient()
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: description,
                            description: type === 'POST_CREDITS'
                                ? `Purchase ${creditsQuantity} post credits for GodKnife marketplace`
                                : 'Boost your post to the top for 10 days',
                        },
                        unit_amount: Math.round(amount * 100), // Stripe uses cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
            metadata: {
                userId: session.user.id,
                type,
                quantity: creditsQuantity.toString(),
                postId: postId || '',
            },
        })

        // Create payment record
        await prisma.payment.create({
            data: {
                userId: session.user.id,
                amount,
                currency: 'EUR',
                provider: 'STRIPE',
                providerPaymentId: checkoutSession.id,
                type,
                quantity: creditsQuantity,
                status: 'PENDING',
            },
        })

        return NextResponse.json({
            sessionId: checkoutSession.id,
            url: checkoutSession.url,
        })
    } catch (error) {
        console.error('Stripe create session error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

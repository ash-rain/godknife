import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addPostCredits } from '@/lib/post-limits'
import axios from 'axios'
import crypto from 'crypto'
import { addDays } from 'date-fns'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { type, postId } = body

        let amount: number
        let quantity: number
        let description: string

        if (type === 'POST_CREDITS') {
            amount = parseFloat(process.env.POST_PURCHASE_PRICE || '5')
            quantity = 5
            description = '5 Post Credits'
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

        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                userId: session.user.id,
                amount,
                currency: 'EUR',
                provider: 'MYPOS',
                type,
                quantity,
                status: 'PENDING',
            },
        })

        // Generate MyPOS payment URL
        const merchantId = process.env.MYPOS_MERCHANT_ID
        const privateKey = process.env.MYPOS_PRIVATE_KEY
        const apiUrl = process.env.MYPOS_API_URL

        const orderData = {
            IPCmethod: 'IPCPurchase',
            IPCVersion: '1.4',
            IPCMerchant: merchantId,
            IPCAmount: amount.toFixed(2),
            IPCCurrency: 'EUR',
            OrderID: payment.id,
            URL_OK: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
            URL_Cancel: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
            URL_Notify: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mypos/webhook`,
            CartDesc: description,
            CustomerIP: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
        }

        // Sign the request (simplified - actual implementation depends on MyPOS API)
        const signatureData = Object.values(orderData).join('')
        const signature = crypto
            .createSign('SHA256')
            .update(signatureData)
            .sign(privateKey!, 'base64')

        return NextResponse.json({
            paymentUrl: apiUrl,
            paymentData: {
                ...orderData,
                Signature: signature,
            },
        })
    } catch (error) {
        console.error('MyPOS create payment error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

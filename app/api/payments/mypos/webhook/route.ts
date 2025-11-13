import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addPostCredits } from '@/lib/post-limits'
import { addDays } from 'date-fns'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { OrderID, IPCStatus, Signature } = body

        // Verify signature (simplified - actual implementation depends on MyPOS API)
        const publicKey = process.env.MYPOS_PUBLIC_KEY
        // TODO: Implement proper signature verification

        if (IPCStatus !== '0') {
            // Payment failed
            await prisma.payment.update({
                where: { id: OrderID },
                data: { status: 'FAILED' },
            })
            return NextResponse.json({ status: 'failed' })
        }

        // Find payment
        const payment = await prisma.payment.findUnique({
            where: { id: OrderID },
        })

        if (!payment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            )
        }

        // Update payment status
        await prisma.payment.update({
            where: { id: OrderID },
            data: {
                status: 'COMPLETED',
                providerPaymentId: body.IPC_Trnref,
            },
        })

        // Process the purchase
        if (payment.type === 'POST_CREDITS') {
            await addPostCredits(payment.userId, payment.quantity)
        } else if (payment.type === 'BOOST') {
            // Get postId from metadata (you'd need to store this with the payment)
            // For now, we'll skip this part
        }

        return NextResponse.json({ status: 'success' })
    } catch (error) {
        console.error('MyPOS webhook error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

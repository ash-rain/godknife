import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const [
            totalUsers,
            totalPosts,
            totalRevenue,
            pendingPosts,
            recentPayments,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.post.count(),
            prisma.payment.aggregate({
                where: { status: 'COMPLETED' },
                _sum: { amount: true },
            }),
            prisma.post.count({
                where: { status: 'PENDING' },
            }),
            prisma.payment.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
        ])

        return NextResponse.json({
            totalUsers,
            totalPosts,
            totalRevenue: totalRevenue._sum.amount || 0,
            pendingPosts,
            recentPayments,
        })
    } catch (error) {
        console.error('Admin dashboard error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

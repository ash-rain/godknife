import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/moderation/logs - Get moderation logs (moderators only)
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isModerator: true, isAdmin: true }
        })

        if (!user?.isModerator && !user?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const logs = await prisma.moderationLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip,
            include: {
                moderator: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        image: true,
                    }
                },
                targetUser: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        image: true,
                    }
                },
                thread: {
                    select: {
                        id: true,
                        title: true,
                    }
                },
                comment: {
                    select: {
                        id: true,
                        content: true,
                    }
                }
            }
        })

        const total = await prisma.moderationLog.count()

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching moderation logs:', error)
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }
}

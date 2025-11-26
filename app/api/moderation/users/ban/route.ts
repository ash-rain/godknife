import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const banUserSchema = z.object({
    userId: z.string(),
    reason: z.string().min(10),
    duration: z.number().optional(), // Duration in days, undefined for permanent
    isPermanent: z.boolean().default(false),
})

// Check if user has moderation permissions
async function checkModeratorPermission(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isModerator: true, isAdmin: true }
    })

    return user?.isModerator || user?.isAdmin || false
}

// POST /api/moderation/users/ban - Ban a user
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const isModerator = await checkModeratorPermission(session.user.id)

        if (!isModerator) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { userId, reason, duration, isPermanent } = banUserSchema.parse(body)

        // Cannot ban yourself
        if (userId === session.user.id) {
            return NextResponse.json({ error: 'Cannot ban yourself' }, { status: 400 })
        }

        // Check if user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true, isModerator: true }
        })

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Cannot ban admins or moderators
        if (targetUser.isAdmin || targetUser.isModerator) {
            return NextResponse.json({ error: 'Cannot ban moderators or admins' }, { status: 403 })
        }

        const expiresAt = isPermanent ? null : duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null

        // Create ban and update user in a transaction
        await prisma.$transaction([
            prisma.userBan.create({
                data: {
                    userId,
                    bannedById: session.user.id,
                    reason,
                    expiresAt,
                    isPermanent,
                    isActive: true,
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { isBanned: true }
            }),
            prisma.moderationLog.create({
                data: {
                    action: 'BAN_USER',
                    reason,
                    moderatorId: session.user.id,
                    targetUserId: userId,
                }
            })
        ])

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error('Error banning user:', error)
        return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 })
    }
}

// DELETE /api/moderation/users/ban - Unban a user
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const isModerator = await checkModeratorPermission(session.user.id)

        if (!isModerator) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 })
        }

        // Update all active bans and user status in a transaction
        await prisma.$transaction([
            prisma.userBan.updateMany({
                where: {
                    userId,
                    isActive: true
                },
                data: { isActive: false }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { isBanned: false }
            }),
            prisma.moderationLog.create({
                data: {
                    action: 'UNBAN_USER',
                    moderatorId: session.user.id,
                    targetUserId: userId,
                }
            })
        ])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error unbanning user:', error)
        return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 })
    }
}

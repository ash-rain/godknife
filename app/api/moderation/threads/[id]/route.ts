import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const moderateThreadSchema = z.object({
    action: z.enum(['pin', 'unpin', 'lock', 'unlock', 'flag', 'unflag', 'approve', 'delete', 'restore']),
    reason: z.string().optional(),
})

// Check if user has moderation permissions
async function checkModeratorPermission(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isModerator: true, isAdmin: true }
    })

    return user?.isModerator || user?.isAdmin || false
}

// POST /api/moderation/threads/[id] - Moderate a thread
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const isModerator = await checkModeratorPermission(session.user.id)

        if (!isModerator) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()
        const { action, reason } = moderateThreadSchema.parse(body)

        const thread = await prisma.thread.findUnique({
            where: { id },
            select: { authorId: true }
        })

        if (!thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
        }

        let updateData: any = {}
        let moderationAction: any

        switch (action) {
            case 'pin':
                updateData.isPinned = true
                moderationAction = 'PIN_THREAD'
                break
            case 'unpin':
                updateData.isPinned = false
                moderationAction = 'UNPIN_THREAD'
                break
            case 'lock':
                updateData.isLocked = true
                updateData.status = 'LOCKED'
                moderationAction = 'LOCK_THREAD'
                break
            case 'unlock':
                updateData.isLocked = false
                updateData.status = 'ACTIVE'
                moderationAction = 'UNLOCK_THREAD'
                break
            case 'flag':
                updateData.status = 'FLAGGED'
                moderationAction = 'FLAG_THREAD'
                break
            case 'unflag':
                updateData.status = 'ACTIVE'
                moderationAction = 'UNFLAG_THREAD'
                break
            case 'approve':
                updateData.status = 'ACTIVE'
                moderationAction = 'APPROVE_THREAD'
                break
            case 'delete':
                updateData.status = 'DELETED'
                moderationAction = 'DELETE_THREAD'
                break
            case 'restore':
                updateData.status = 'ACTIVE'
                moderationAction = 'RESTORE_THREAD'
                break
        }

        // Update thread and create moderation log in a transaction
        const [updatedThread] = await prisma.$transaction([
            prisma.thread.update({
                where: { id },
                data: updateData,
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                            image: true,
                        }
                    },
                    forum: true
                }
            }),
            prisma.moderationLog.create({
                data: {
                    action: moderationAction,
                    reason,
                    moderatorId: session.user.id,
                    targetUserId: thread.authorId,
                    threadId: id,
                }
            })
        ])

        return NextResponse.json({ thread: updatedThread })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error('Error moderating thread:', error)
        return NextResponse.json({ error: 'Failed to moderate thread' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const moderateCommentSchema = z.object({
    action: z.enum(['flag', 'unflag', 'approve', 'delete', 'restore']),
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

// POST /api/moderation/comments/[id] - Moderate a comment
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
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

        const { id } = params
        const body = await request.json()
        const { action, reason } = moderateCommentSchema.parse(body)

        const comment = await prisma.threadComment.findUnique({
            where: { id },
            select: { authorId: true, threadId: true }
        })

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
        }

        let updateData: any = {}
        let moderationAction: any

        switch (action) {
            case 'flag':
                updateData.status = 'FLAGGED'
                moderationAction = 'FLAG_COMMENT'
                break
            case 'unflag':
                updateData.status = 'ACTIVE'
                moderationAction = 'UNFLAG_COMMENT'
                break
            case 'approve':
                updateData.status = 'ACTIVE'
                moderationAction = 'APPROVE_COMMENT'
                break
            case 'delete':
                updateData.status = 'DELETED'
                moderationAction = 'DELETE_COMMENT'
                break
            case 'restore':
                updateData.status = 'ACTIVE'
                moderationAction = 'RESTORE_COMMENT'
                break
        }

        // Update comment and create moderation log in a transaction
        const [updatedComment] = await prisma.$transaction([
            prisma.threadComment.update({
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
                    }
                }
            }),
            prisma.moderationLog.create({
                data: {
                    action: moderationAction,
                    reason,
                    moderatorId: session.user.id,
                    targetUserId: comment.authorId,
                    commentId: id,
                    threadId: comment.threadId,
                }
            })
        ])

        return NextResponse.json({ comment: updatedComment })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error('Error moderating comment:', error)
        return NextResponse.json({ error: 'Failed to moderate comment' }, { status: 500 })
    }
}

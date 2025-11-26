import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateThreadSchema = z.object({
    title: z.string().min(5).max(200).optional(),
    content: z.string().min(10).optional(),
})

// GET /api/threads/[id] - Get a specific thread
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        // Increment view count
        await prisma.thread.update({
            where: { id },
            data: { views: { increment: 1 } }
        })

        const thread = await prisma.thread.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        image: true,
                        isBanned: true,
                    }
                },
                forum: true,
                comments: {
                    where: {
                        parentId: null,
                        status: 'ACTIVE'
                    },
                    orderBy: { createdAt: 'asc' },
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                                image: true,
                                isBanned: true,
                            }
                        },
                        replies: {
                            where: { status: 'ACTIVE' },
                            orderBy: { createdAt: 'asc' },
                            include: {
                                author: {
                                    select: {
                                        id: true,
                                        username: true,
                                        name: true,
                                        image: true,
                                        isBanned: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
        }

        return NextResponse.json({ thread })
    } catch (error) {
        console.error('Error fetching thread:', error)
        return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 })
    }
}

// PATCH /api/threads/[id] - Update a thread (author or moderator)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = params
        const body = await request.json()
        const validatedData = updateThreadSchema.parse(body)

        const thread = await prisma.thread.findUnique({
            where: { id },
            select: { authorId: true }
        })

        if (!thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isModerator: true, isAdmin: true }
        })

        // Check if user is the author or a moderator/admin
        if (thread.authorId !== session.user.id && !user?.isModerator && !user?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const updatedThread = await prisma.thread.update({
            where: { id },
            data: validatedData,
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
        })

        return NextResponse.json({ thread: updatedThread })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error('Error updating thread:', error)
        return NextResponse.json({ error: 'Failed to update thread' }, { status: 500 })
    }
}

// DELETE /api/threads/[id] - Delete a thread (author or moderator)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = params

        const thread = await prisma.thread.findUnique({
            where: { id },
            select: { authorId: true }
        })

        if (!thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isModerator: true, isAdmin: true }
        })

        // Check if user is the author or a moderator/admin
        if (thread.authorId !== session.user.id && !user?.isModerator && !user?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Soft delete by changing status
        await prisma.thread.update({
            where: { id },
            data: { status: 'DELETED' }
        })

        // Log moderation action if done by moderator
        if (user?.isModerator || user?.isAdmin) {
            await prisma.moderationLog.create({
                data: {
                    action: 'DELETE_THREAD',
                    moderatorId: session.user.id,
                    threadId: id,
                    targetUserId: thread.authorId,
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting thread:', error)
        return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 })
    }
}

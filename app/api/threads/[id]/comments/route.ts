import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCommentSchema = z.object({
    content: z.string().min(1).max(5000),
    parentId: z.string().optional(),
})

// GET /api/threads/[id]/comments - Get comments for a thread
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        const comments = await prisma.threadComment.findMany({
            where: {
                threadId: id,
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
        })

        return NextResponse.json({ comments })
    } catch (error) {
        console.error('Error fetching comments:', error)
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }
}

// POST /api/threads/[id]/comments - Add a comment to a thread
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is banned
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isBanned: true }
        })

        if (user?.isBanned) {
            return NextResponse.json({ error: 'You are banned from commenting' }, { status: 403 })
        }

        const { id } = params

        // Check if thread exists and is not locked
        const thread = await prisma.thread.findUnique({
            where: { id },
            select: { isLocked: true, status: true }
        })

        if (!thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
        }

        if (thread.isLocked) {
            return NextResponse.json({ error: 'Thread is locked' }, { status: 403 })
        }

        if (thread.status === 'DELETED') {
            return NextResponse.json({ error: 'Thread is deleted' }, { status: 403 })
        }

        const body = await request.json()
        const validatedData = createCommentSchema.parse(body)

        // If replying to a comment, check if parent exists
        if (validatedData.parentId) {
            const parentComment = await prisma.threadComment.findUnique({
                where: { id: validatedData.parentId },
                select: { threadId: true }
            })

            if (!parentComment || parentComment.threadId !== id) {
                return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
            }
        }

        const comment = await prisma.threadComment.create({
            data: {
                content: validatedData.content,
                threadId: id,
                authorId: session.user.id,
                parentId: validatedData.parentId,
            },
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
        })

        return NextResponse.json({ comment }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error('Error creating comment:', error)
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }
}

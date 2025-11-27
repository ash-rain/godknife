import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateForumSchema = z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().min(10).optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    order: z.number().optional(),
    isActive: z.boolean().optional(),
})

// GET /api/forums/[slug] - Get a specific forum with threads
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const forum = await prisma.forum.findUnique({
            where: { slug, isActive: true },
            include: {
                _count: {
                    select: { threads: true }
                }
            }
        })

        if (!forum) {
            return NextResponse.json({ error: 'Forum not found' }, { status: 404 })
        }

        const threads = await prisma.thread.findMany({
            where: {
                forumId: forum.id,
                status: { in: ['ACTIVE', 'LOCKED'] }
            },
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' }
            ],
            take: limit,
            skip,
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        image: true,
                    }
                },
                _count: {
                    select: { comments: true }
                }
            }
        })

        const total = await prisma.thread.count({
            where: {
                forumId: forum.id,
                status: { in: ['ACTIVE', 'LOCKED'] }
            }
        })

        return NextResponse.json({
            forum,
            threads,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching forum:', error)
        return NextResponse.json({ error: 'Failed to fetch forum' }, { status: 500 })
    }
}

// PATCH /api/forums/[slug] - Update a forum (admin only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!session.user.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { slug } = await params
        const body = await request.json()
        const validatedData = updateForumSchema.parse(body)

        const forum = await prisma.forum.update({
            where: { slug },
            data: validatedData
        })

        return NextResponse.json({ forum })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error('Error updating forum:', error)
        return NextResponse.json({ error: 'Failed to update forum' }, { status: 500 })
    }
}

// DELETE /api/forums/[slug] - Delete a forum (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!session.user.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { slug } = await params

        await prisma.forum.delete({
            where: { slug }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting forum:', error)
        return NextResponse.json({ error: 'Failed to delete forum' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createThreadSchema = z.object({
    title: z.string().min(5).max(200),
    content: z.string().min(10),
    forumId: z.string(),
})

// GET /api/forums/[slug]/threads - List threads in a forum
export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const { slug } = params
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit
        const includeAll = searchParams.get('includeAll') === 'true'

        // Check if user is admin for includeAll parameter
        const session = await auth()
        const isAdmin = session?.user?.isAdmin || false

        const forum = await prisma.forum.findUnique({
            where: { slug }
        })

        if (!forum) {
            return NextResponse.json({ error: 'Forum not found' }, { status: 404 })
        }

        // Build where clause based on admin status
        const whereClause: any = { forumId: forum.id }
        
        // For non-admin or when not including all, filter by status
        if (!includeAll || !isAdmin) {
            whereClause.status = { in: ['ACTIVE', 'LOCKED'] }
        }

        const threads = await prisma.thread.findMany({
            where: whereClause,
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
            where: whereClause
        })

        return NextResponse.json({
            threads,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching threads:', error)
        return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
    }
}

// POST /api/forums/[slug]/threads - Create a new thread
export async function POST(
    request: NextRequest,
    { params }: { params: { slug: string } }
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
            return NextResponse.json({ error: 'You are banned from posting' }, { status: 403 })
        }

        const { slug } = params
        const body = await request.json()

        // Find forum by slug
        const forum = await prisma.forum.findUnique({
            where: { slug, isActive: true }
        })

        if (!forum) {
            return NextResponse.json({ error: 'Forum not found' }, { status: 404 })
        }

        const validatedData = createThreadSchema.parse({
            ...body,
            forumId: forum.id
        })

        const thread = await prisma.thread.create({
            data: {
                ...validatedData,
                authorId: session.user.id,
            },
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

        return NextResponse.json({ thread }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error('Error creating thread:', error)
        return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createForumSchema = z.object({
    name: z.string().min(3).max(100),
    slug: z.string().min(3).max(100),
    description: z.string().min(10),
    icon: z.string().optional(),
    color: z.string().optional(),
    order: z.number().default(0),
})

// GET /api/forums - List all forums
export async function GET() {
    try {
        const forums = await prisma.forum.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { threads: true }
                },
                threads: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
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
                }
            }
        })

        return NextResponse.json({ forums })
    } catch (error) {
        console.error('Error fetching forums:', error)
        return NextResponse.json({ error: 'Failed to fetch forums' }, { status: 500 })
    }
}

// POST /api/forums - Create a new forum (admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!session.user.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const validatedData = createForumSchema.parse(body)

        // Check if slug already exists
        const existingForum = await prisma.forum.findUnique({
            where: { slug: validatedData.slug }
        })

        if (existingForum) {
            return NextResponse.json({ error: 'Forum slug already exists' }, { status: 400 })
        }

        const forum = await prisma.forum.create({
            data: validatedData
        })

        return NextResponse.json({ forum }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error('Error creating forum:', error)
        return NextResponse.json({ error: 'Failed to create forum' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const { username } = await params
        const searchParams = req.nextUrl.searchParams
        const type = searchParams.get('type') // 'gallery' or 'marketplace'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '12')
        const skip = (page - 1) * limit

        // Find user first
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Build where clause
        const where: any = {
            authorId: user.id,
        }

        if (type === 'gallery') {
            where.isGallery = true
        } else if (type === 'marketplace') {
            where.isGallery = false
        }

        // Fetch posts
        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            image: true,
                        },
                    },
                    category: {
                        select: {
                            id: true,
                            nameEn: true,
                            nameBg: true,
                            slug: true,
                        },
                    },
                    subcategory: {
                        select: {
                            id: true,
                            nameEn: true,
                            nameBg: true,
                            slug: true,
                        },
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            prisma.post.count({ where }),
        ])

        return NextResponse.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Get user posts error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        } as any)

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }

        // Increment views
        await prisma.post.update({
            where: { id },
            data: { views: { increment: 1 } } as any,
        })

        return NextResponse.json(post)
    } catch (error) {
        console.error('Get post error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const post = await prisma.post.findUnique({
            where: { id },
        })

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }

        if ((post as any).authorId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const { title, description, price } = body

        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                title,
                description,
                price,
            },
        })

        return NextResponse.json(updatedPost)
    } catch (error) {
        console.error('Update post error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const post = await prisma.post.findUnique({
            where: { id },
        })

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 })
        }

        if ((post as any).authorId !== session.user.id && !(session.user as any).isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await prisma.post.delete({
            where: { id },
        })

        return NextResponse.json({ message: 'Post deleted' })
    } catch (error) {
        console.error('Delete post error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

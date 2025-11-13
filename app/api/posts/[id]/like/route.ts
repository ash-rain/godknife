import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if already liked
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId: session.user.id,
                    postId: params.id,
                },
            },
        })

        if (existingLike) {
            // Unlike
            await prisma.like.delete({
                where: {
                    userId_postId: {
                        userId: session.user.id,
                        postId: params.id,
                    },
                },
            })
            return NextResponse.json({ liked: false })
        } else {
            // Like
            await prisma.like.create({
                data: {
                    userId: session.user.id,
                    postId: params.id,
                },
            })
            return NextResponse.json({ liked: true })
        }
    } catch (error) {
        console.error('Toggle like error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ liked: false })
        }

        const like = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId: session.user.id,
                    postId: params.id,
                },
            },
        })

        return NextResponse.json({ liked: !!like })
    } catch (error) {
        console.error('Get like status error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

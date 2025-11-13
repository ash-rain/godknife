import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: { username: string } }
) {
    try {
        const user = await prisma.user.findUnique({
            where: { username: params.username },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                bio: true,
                location: true,
                website: true,
                coverImage: true,
                customTheme: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: true,
                    },
                },
            },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Get user error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { username: string } }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { username: params.username },
        })

        if (!user || user.id !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const { name, bio, location, website, customTheme } = body

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                bio,
                location,
                website,
                customTheme,
            },
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error('Update user error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

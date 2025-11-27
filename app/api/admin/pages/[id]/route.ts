import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET single page by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (!user?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params
        const page = await prisma.staticPage.findUnique({
            where: { id }
        })

        if (!page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 })
        }

        return NextResponse.json({ page })
    } catch (error) {
        console.error('Error fetching page:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT update page
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (!user?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { titleEn, titleBg, contentEn, contentBg, isActive } = await request.json()

        if (!titleEn || !titleBg || !contentEn || !contentBg) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        const { id } = await params
        const page = await prisma.staticPage.update({
            where: { id },
            data: {
                titleEn,
                titleBg,
                contentEn,
                contentBg,
                isActive: isActive !== undefined ? isActive : true
            }
        })

        return NextResponse.json({ page })
    } catch (error) {
        console.error('Error updating page:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE page
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (!user?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params
        await prisma.staticPage.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Page deleted successfully' })
    } catch (error) {
        console.error('Error deleting page:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all pages
export async function GET() {
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

        const pages = await prisma.staticPage.findMany({
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json({ pages })
    } catch (error) {
        console.error('Error fetching pages:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST create new page
export async function POST(request: Request) {
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

        const { slug, titleEn, titleBg, contentEn, contentBg, isActive } = await request.json()

        if (!slug || !titleEn || !titleBg || !contentEn || !contentBg) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        // Check if page with this slug already exists
        const existingPage = await prisma.staticPage.findUnique({
            where: { slug }
        })

        if (existingPage) {
            return NextResponse.json({ error: 'Page with this slug already exists' }, { status: 400 })
        }

        const page = await prisma.staticPage.create({
            data: {
                slug,
                titleEn,
                titleBg,
                contentEn,
                contentBg,
                isActive: isActive !== undefined ? isActive : true
            }
        })

        return NextResponse.json({ page }, { status: 201 })
    } catch (error) {
        console.error('Error creating page:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

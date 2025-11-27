import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET page by slug (public endpoint)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        const page = await prisma.staticPage.findUnique({
            where: {
                slug,
                isActive: true
            }
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

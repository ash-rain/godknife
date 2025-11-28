import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const category = await prisma.category.findUnique({
            where: {
                slug: params.slug,
                isActive: true,
            },
            include: {
                subcategories: {
                    where: {
                        isActive: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                },
            },
        })

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 })
        }

        return NextResponse.json({ category })
    } catch (error) {
        console.error('Error fetching category:', error)
        return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
    }
}

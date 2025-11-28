import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all categories (admin view with all data)
export async function GET() {
    try {
        const session = await auth()

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const categories = await prisma.category.findMany({
            include: {
                subcategories: {
                    orderBy: {
                        order: 'asc',
                    },
                },
                _count: {
                    select: {
                        posts: true,
                    },
                },
            },
            orderBy: {
                order: 'asc',
            },
        })

        return NextResponse.json({ categories })
    } catch (error) {
        console.error('Error fetching categories:', error)
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
}

// POST create new category
export async function POST(request: Request) {
    try {
        const session = await auth()

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            nameEn,
            nameBg,
            slug,
            descriptionEn,
            descriptionBg,
            icon,
            order,
            isActive,
            subcategories,
        } = body

        // Check if slug already exists
        const existing = await prisma.category.findUnique({
            where: { slug },
        })

        if (existing) {
            return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 400 })
        }

        const category = await prisma.category.create({
            data: {
                nameEn,
                nameBg,
                slug,
                descriptionEn: descriptionEn || null,
                descriptionBg: descriptionBg || null,
                icon: icon || null,
                order: order || 0,
                isActive: isActive ?? true,
                subcategories: subcategories?.length > 0 ? {
                    create: subcategories.map((sub: any) => ({
                        nameEn: sub.nameEn,
                        nameBg: sub.nameBg,
                        slug: sub.slug,
                        descriptionEn: sub.descriptionEn || null,
                        descriptionBg: sub.descriptionBg || null,
                        order: sub.order || 0,
                        isActive: sub.isActive ?? true,
                    })),
                } : undefined,
            },
            include: {
                subcategories: true,
            },
        })

        return NextResponse.json({ category }, { status: 201 })
    } catch (error) {
        console.error('Error creating category:', error)
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
}

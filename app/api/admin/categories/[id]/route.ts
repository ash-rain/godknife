import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT update category
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        // Check if slug is being changed and if it already exists
        const existing = await prisma.category.findFirst({
            where: {
                slug,
                NOT: {
                    id: params.id,
                },
            },
        })

        if (existing) {
            return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 400 })
        }

        // Delete existing subcategories and recreate them
        await prisma.subcategory.deleteMany({
            where: {
                categoryId: params.id,
            },
        })

        const category = await prisma.category.update({
            where: { id: params.id },
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

        return NextResponse.json({ category })
    } catch (error) {
        console.error('Error updating category:', error)
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }
}

// DELETE category
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if category has posts
        const category = await prisma.category.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: {
                        posts: true,
                    },
                },
            },
        })

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 })
        }

        // Optional: Prevent deletion if category has posts
        // Uncomment the following if you want to prevent deletion
        // if (category._count.posts > 0) {
        //   return NextResponse.json(
        //     { error: `Cannot delete category with ${category._count.posts} posts` },
        //     { status: 400 }
        //   )
        // }

        // Delete category (subcategories will be cascade deleted)
        await prisma.category.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting category:', error)
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }
}

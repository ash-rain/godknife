import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { minioClient, BUCKET_NAME, initializeBucket } from '@/lib/minio'
import { resizeImage, IMAGE_SIZES } from '@/lib/image-processor'
import { canUserCreatePost, consumePostCredit } from '@/lib/post-limits'
import { z } from 'zod'

const createPostSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10),
    price: z.number().optional(),
    isGallery: z.boolean().default(false),
    images: z.array(z.string()).min(1).max(10),
})

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user can create a post
        const canPost = await canUserCreatePost(session.user.id)
        if (!canPost.canPost) {
            return NextResponse.json(
                {
                    error: canPost.reason,
                    nextFreePostDate: canPost.nextFreePostDate,
                },
                { status: 403 }
            )
        }

        const formData = await req.formData()
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const price = formData.get('price') ? parseFloat(formData.get('price') as string) : undefined
        const isGallery = formData.get('isGallery') === 'true'
        const categoryId = formData.get('categoryId') as string | null
        const subcategoryId = formData.get('subcategoryId') as string | null

        // Get all image files
        const imageFiles: File[] = []
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('image-') && value instanceof File) {
                imageFiles.push(value)
            }
        }

        if (imageFiles.length === 0) {
            return NextResponse.json({ error: 'At least one image is required' }, { status: 400 })
        }

        // Initialize MinIO bucket
        await initializeBucket()

        // Upload images with resizing
        const uploadedImages: string[] = []

        for (const file of imageFiles) {
            const buffer = Buffer.from(await file.arrayBuffer())
            const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

            // Upload original
            await minioClient.putObject(BUCKET_NAME, filename, buffer, buffer.length, {
                'Content-Type': 'image/jpeg',
            })

            // Upload resized versions
            for (const size of IMAGE_SIZES) {
                const resizedBuffer = await resizeImage(buffer, size)
                const resizedFilename = filename.replace('.jpg', `-${size.suffix}.jpg`)

                await minioClient.putObject(
                    BUCKET_NAME,
                    resizedFilename,
                    resizedBuffer,
                    resizedBuffer.length,
                    { 'Content-Type': 'image/jpeg' }
                )
            }

            uploadedImages.push(filename)
        }

        // Create post
        const post = await prisma.post.create({
            data: {
                title,
                description,
                price,
                isGallery,
                images: uploadedImages,
                authorId: session.user.id,
                categoryId: categoryId || null,
                subcategoryId: subcategoryId || null,
            },
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
            },
        })

        // Consume post credit
        await consumePostCredit(session.user.id)

        return NextResponse.json(post, { status: 201 })
    } catch (error) {
        console.error('Create post error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const sort = searchParams.get('sort') || 'newest'
        const authorId = searchParams.get('authorId')
        const categoryId = searchParams.get('categoryId')
        const subcategoryId = searchParams.get('subcategoryId')
        const search = searchParams.get('search')
        const skip = (page - 1) * limit

        let orderBy: any = { createdAt: 'desc' }

        if (sort === 'hottest') {
            // Calculate hotness score based on likes, comments, and recency
            // For simplicity, we'll sort by likes count for now
            orderBy = { likes: { _count: 'desc' } }
        } else if (sort === 'boosted') {
            orderBy = [
                { isBoosted: 'desc' },
                { createdAt: 'desc' },
            ]
        }

        const where: any = {
            status: 'ACTIVE',
        }

        if (authorId) {
            where.authorId = authorId
        }

        if (categoryId) {
            where.categoryId = categoryId
        }

        if (subcategoryId) {
            where.subcategoryId = subcategoryId
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ]
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                orderBy,
                skip,
                take: limit,
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
            }),
            prisma.post.count({ where }),
        ])

        return NextResponse.json({
            posts,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        })
    } catch (error) {
        console.error('Get posts error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

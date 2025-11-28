import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { minioClient, BUCKET_NAME, initializeBucket } from '@/lib/minio'
import { resizeImage, IMAGE_SIZES } from '@/lib/image-processor'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { username } = await params

        // Check if user owns this profile
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        })

        if (!user || user.id !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const formData = await req.formData()
        const file = formData.get('image') as File | null
        const type = formData.get('type') as string // 'profile' or 'cover'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!type || !['profile', 'cover'].includes(type)) {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
        }

        // Initialize MinIO bucket
        console.log('Initializing MinIO bucket:', BUCKET_NAME)
        console.log('MinIO config:', {
            endpoint: process.env.MINIO_ENDPOINT,
            port: process.env.MINIO_PORT,
            useSSL: process.env.MINIO_USE_SSL,
        })
        await initializeBucket()
        console.log('Bucket initialized successfully')

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = `${type}-${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}.jpg`
        console.log('Uploading file:', filename, 'Size:', buffer.length)

        // Upload original image
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
                {
                    'Content-Type': 'image/jpeg',
                }
            )
        }

        // Update user profile with new image
        const updateData =
            type === 'profile' ? { image: filename } : { coverImage: filename }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                coverImage: true,
                bio: true,
                location: true,
                website: true,
            },
        })

        return NextResponse.json({
            success: true,
            filename,
            user: updatedUser,
        })
    } catch (error) {
        console.error('Upload image error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json(
            { error: errorMessage, details: String(error) },
            { status: 500 }
        )
    }
}

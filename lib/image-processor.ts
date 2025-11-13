// Server-side only - do not import in client components
import sharp from 'sharp'

export interface ImageSize {
    width: number
    height: number
    suffix: string
}

export const IMAGE_SIZES: ImageSize[] = [
    { width: 150, height: 150, suffix: 'thumb' },
    { width: 800, height: 800, suffix: 'medium' },
    { width: 1920, height: 1920, suffix: 'large' },
]

export async function resizeImage(
    buffer: Buffer,
    size: ImageSize
): Promise<Buffer> {
    return await sharp(buffer)
        .resize(size.width, size.height, {
            fit: 'inside',
            withoutEnlargement: true,
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer()
}
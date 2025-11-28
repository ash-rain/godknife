// Client-safe utility for image URLs
export function getImageUrl(
    filename: string,
    size: 'thumb' | 'medium' | 'large' | 'original' = 'medium'
): string {
    // Use public environment variables that are safe for client
    const endpoint = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || 'localhost'
    const port = process.env.NEXT_PUBLIC_MINIO_PORT || '9009'
    const bucket = process.env.NEXT_PUBLIC_MINIO_BUCKET || 'godknife-images'
    const useSSL = process.env.NEXT_PUBLIC_MINIO_USE_SSL === 'true'
    const protocol = useSSL ? 'https' : 'http'

    const sizeFilename = size === 'original'
        ? filename
        : filename.replace(/(\.[^.]+)$/, `-${size}$1`)

    return `${protocol}://${endpoint}:${port}/${bucket}/${sizeFilename}`
}

import * as Minio from 'minio'

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
})

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'godknife-images'

export async function initializeBucket() {
    try {
        const bucketExists = await minioClient.bucketExists(BUCKET_NAME)
        if (!bucketExists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1')

            // Set bucket policy to allow public read access
            const policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
                    },
                ],
            }
            await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy))
        }
    } catch (err) {
        console.error('Error initializing MinIO bucket:', err)
    }
}

export { minioClient, BUCKET_NAME }

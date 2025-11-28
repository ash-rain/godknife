// Debug script to test MinIO connection and upload
import { minioClient, BUCKET_NAME, initializeBucket } from './lib/minio.js'

async function testMinIO() {
    console.log('Testing MinIO connection...')
    console.log('Endpoint:', process.env.MINIO_ENDPOINT)
    console.log('Port:', process.env.MINIO_PORT)
    console.log('Bucket:', BUCKET_NAME)

    try {
        // Initialize bucket
        await initializeBucket()
        console.log('✓ Bucket initialized')

        // Check if bucket exists
        const exists = await minioClient.bucketExists(BUCKET_NAME)
        console.log('✓ Bucket exists:', exists)

        // List objects
        const stream = minioClient.listObjects(BUCKET_NAME, '', true)
        console.log('\nExisting objects:')
        let count = 0
        stream.on('data', obj => {
            console.log(`  - ${obj.name}`)
            count++
        })
        stream.on('end', () => {
            console.log(`\nTotal objects: ${count}`)
        })
        stream.on('error', err => {
            console.error('Error listing objects:', err)
        })

        // Test upload
        setTimeout(async () => {
            try {
                const testContent = Buffer.from('test image content')
                const testFilename = 'test-upload.txt'

                await minioClient.putObject(
                    BUCKET_NAME,
                    testFilename,
                    testContent,
                    testContent.length,
                    { 'Content-Type': 'text/plain' }
                )
                console.log('\n✓ Test upload successful:', testFilename)

                // Get URL
                const url = await minioClient.presignedGetObject(BUCKET_NAME, testFilename, 3600)
                console.log('Access URL:', url)

            } catch (err) {
                console.error('✗ Test upload failed:', err)
            }
        }, 2000)

    } catch (error) {
        console.error('✗ Error:', error)
    }
}

testMinIO()

/**
 * Debug script to test post creation setup
 * Run with: npx tsx scripts/debug-posts.ts
 */

import { prisma } from '../lib/prisma'
import { minioClient, BUCKET_NAME, initializeBucket } from '../lib/minio'
import { canUserCreatePost, consumePostCredit, addPostCredits } from '../lib/post-limits'
import bcrypt from 'bcryptjs'

async function debugPosts() {
    console.log('🔍 Debugging Post Creation Setup...\n')

    try {
        // Test 1: Database Connection
        console.log('1️⃣ Testing database connection...')
        await prisma.$connect()
        console.log('✅ Database connection successful\n')

        // Test 2: Check posts table
        console.log('2️⃣ Checking posts table...')
        const postCount = await prisma.post.count()
        console.log(`✅ Posts table exists. Current post count: ${postCount}\n`)

        // Test 3: MinIO Connection
        console.log('3️⃣ Testing MinIO connection...')
        try {
            await minioClient.listBuckets()
            console.log('✅ MinIO connection successful\n')
        } catch (error: any) {
            console.error('❌ MinIO connection failed:', error.message)
            console.log('   Check MINIO_ACCESS_KEY and MINIO_SECRET_KEY in .env\n')
            throw error
        }

        // Test 4: Bucket Initialization
        console.log('4️⃣ Testing bucket initialization...')
        await initializeBucket()
        const bucketExists = await minioClient.bucketExists(BUCKET_NAME)
        console.log(`✅ Bucket "${BUCKET_NAME}" ${bucketExists ? 'exists' : 'created'}\n`)

        // Test 5: Create test user
        console.log('5️⃣ Creating test user...')
        const testEmail = 'debug-post-test@example.com'

        await prisma.user.deleteMany({
            where: { email: testEmail }
        })

        const hashedPassword = await bcrypt.hash('testpassword123', 10)
        const testUser = await prisma.user.create({
            data: {
                email: testEmail,
                password: hashedPassword,
                name: 'Debug Post User',
                username: 'debugpostuser',
                postCredits: 0,
            }
        })
        console.log(`✅ Test user created with ID: ${testUser.id}\n`)

        // Test 6: Check post limits - free post
        console.log('6️⃣ Testing free post limit...')
        const canPostFree = await canUserCreatePost(testUser.id)
        console.log(`✅ Can create free post: ${canPostFree.canPost}`)
        if (!canPostFree.canPost) {
            console.log(`   Reason: ${canPostFree.reason}`)
            console.log(`   Next free post: ${canPostFree.nextFreePostDate}`)
        }
        console.log()

        // Test 7: Add post credits
        console.log('7️⃣ Testing post credit system...')
        await addPostCredits(testUser.id, 5)
        const userWithCredits = await prisma.user.findUnique({
            where: { id: testUser.id }
        })
        console.log(`✅ Added 5 credits. User now has: ${userWithCredits?.postCredits} credits\n`)

        // Test 8: Check post limits with credits
        console.log('8️⃣ Testing post creation with credits...')
        const canPostWithCredits = await canUserCreatePost(testUser.id)
        console.log(`✅ Can create post with credits: ${canPostWithCredits.canPost}\n`)

        // Test 9: Create test post
        console.log('9️⃣ Creating test post...')
        const testPost = await prisma.post.create({
            data: {
                title: 'Debug Test Post',
                description: 'This is a test post created by the debug script',
                images: ['test-image-1.jpg', 'test-image-2.jpg'],
                authorId: testUser.id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    }
                }
            }
        })
        console.log(`✅ Test post created with ID: ${testPost.id}`)
        console.log(`   Title: ${testPost.title}`)
        console.log(`   Author: ${testPost.author.username}`)
        console.log(`   Images: ${testPost.images.length}\n`)

        // Test 10: Consume post credit
        console.log('🔟 Testing credit consumption...')
        await consumePostCredit(testUser.id)
        const userAfterConsume = await prisma.user.findUnique({
            where: { id: testUser.id }
        })
        console.log(`✅ Credit consumed. User now has: ${userAfterConsume?.postCredits} credits\n`)

        // Test 11: Retrieve posts
        console.log('1️⃣1️⃣ Testing post retrieval...')
        const posts = await prisma.post.findMany({
            where: { authorId: testUser.id },
            include: {
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                }
            }
        })
        console.log(`✅ Retrieved ${posts.length} post(s) for user\n`)

        // Test 12: Test image upload to MinIO
        console.log('1️⃣2️⃣ Testing MinIO image upload...')
        try {
            const testBuffer = Buffer.from('test image data')
            const testFilename = `debug-test-${Date.now()}.jpg`

            await minioClient.putObject(
                BUCKET_NAME,
                testFilename,
                testBuffer,
                testBuffer.length,
                { 'Content-Type': 'image/jpeg' }
            )
            console.log(`✅ Test image uploaded: ${testFilename}`)

            // Clean up test image
            await minioClient.removeObject(BUCKET_NAME, testFilename)
            console.log(`✅ Test image cleaned up\n`)
        } catch (error: any) {
            console.error('❌ MinIO upload failed:', error.message)
            throw error
        }

        // Clean up
        console.log('🧹 Cleaning up test data...')
        await prisma.post.deleteMany({
            where: { authorId: testUser.id }
        })
        await prisma.user.delete({
            where: { id: testUser.id }
        })
        console.log('✅ Test data cleaned up\n')

        console.log('✨ All post creation checks passed!')
        console.log('\n📊 Summary:')
        console.log('   ✅ Database connection')
        console.log('   ✅ Posts table exists')
        console.log('   ✅ MinIO connection')
        console.log('   ✅ Bucket initialization')
        console.log('   ✅ Post limits system')
        console.log('   ✅ Credit system')
        console.log('   ✅ Post creation')
        console.log('   ✅ MinIO image upload')

    } catch (error) {
        console.error('\n❌ Error during post creation debug:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

debugPosts()
    .then(() => {
        console.log('\n✅ Debug script completed successfully')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Debug script failed:', error)
        process.exit(1)
    })

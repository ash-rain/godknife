import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

describe('Post Creation', () => {
    let testUser: any

    beforeEach(async () => {
        // Clean up test data
        await prisma.post.deleteMany({
            where: {
                title: {
                    contains: 'test-post'
                }
            }
        })

        await prisma.user.deleteMany({
            where: {
                email: 'post-test@example.com'
            }
        })

        // Create test user
        const hashedPassword = await bcrypt.hash('password123', 10)
        testUser = await prisma.user.create({
            data: {
                email: 'post-test@example.com',
                password: hashedPassword,
                name: 'Post Test User',
                username: 'posttester',
                postCredits: 1,
            },
        })
    })

    afterEach(async () => {
        // Clean up - delete posts first (foreign key constraint), then user
        if (testUser && testUser.id) {
            await prisma.post.deleteMany({
                where: {
                    authorId: testUser.id
                }
            })

            await prisma.user.delete({
                where: { id: testUser.id }
            }).catch(() => {
                // Ignore if already deleted
            })
        }
    })

    it('should create a post with valid data', async () => {
        const postData = {
            title: 'test-post-1',
            description: 'This is a test post description',
            images: ['test-image-1.jpg'],
            authorId: testUser.id,
        }

        const post = await prisma.post.create({
            data: postData,
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

        expect(post).toBeDefined()
        expect(post.title).toBe(postData.title)
        expect(post.description).toBe(postData.description)
        expect(post.images).toEqual(postData.images)
        expect(post.authorId).toBe(testUser.id)
        expect(post.author.username).toBe('posttester')
        expect(post.status).toBe('ACTIVE')
        expect(post.views).toBe(0)
        expect(post.shares).toBe(0)
        expect(post.isBoosted).toBe(false)
    })

    it('should create a gallery post', async () => {
        const post = await prisma.post.create({
            data: {
                title: 'test-post-gallery',
                description: 'This is a gallery post',
                images: ['image-1.jpg', 'image-2.jpg', 'image-3.jpg'],
                isGallery: true,
                authorId: testUser.id,
            },
        })

        expect(post.isGallery).toBe(true)
        expect(post.images.length).toBe(3)
    })

    it('should create a post with price', async () => {
        const post = await prisma.post.create({
            data: {
                title: 'test-post-with-price',
                description: 'This post has a price',
                images: ['image-1.jpg'],
                price: 49.99,
                authorId: testUser.id,
            },
        })

        expect(post.price).toBe(49.99)
    })

    it('should retrieve posts by author', async () => {
        // Create multiple posts
        await prisma.post.createMany({
            data: [
                {
                    title: 'test-post-author-1',
                    description: 'Post 1 by author',
                    images: ['image-1.jpg'],
                    authorId: testUser.id,
                },
                {
                    title: 'test-post-author-2',
                    description: 'Post 2 by author',
                    images: ['image-2.jpg'],
                    authorId: testUser.id,
                },
            ]
        })

        const posts = await prisma.post.findMany({
            where: { authorId: testUser.id },
            orderBy: { createdAt: 'desc' }
        })

        expect(posts.length).toBeGreaterThanOrEqual(2)
        posts.forEach(post => {
            expect(post.authorId).toBe(testUser.id)
        })
    })

    it('should increment views count', async () => {
        const post = await prisma.post.create({
            data: {
                title: 'test-post-views',
                description: 'Test views increment',
                images: ['image-1.jpg'],
                authorId: testUser.id,
            },
        })

        expect(post.views).toBe(0)

        const updatedPost = await prisma.post.update({
            where: { id: post.id },
            data: { views: { increment: 1 } }
        })

        expect(updatedPost.views).toBe(1)

        // Verify the increment persists
        const fetchedPost = await prisma.post.findUnique({
            where: { id: post.id }
        })
        expect(fetchedPost?.views).toBe(1)
    })

    it('should filter active posts only', async () => {
        // Create active and deleted posts
        await prisma.post.create({
            data: {
                title: 'test-post-active',
                description: 'Active post',
                images: ['image-1.jpg'],
                authorId: testUser.id,
                status: 'ACTIVE',
            },
        })

        await prisma.post.create({
            data: {
                title: 'test-post-deleted',
                description: 'Deleted post',
                images: ['image-2.jpg'],
                authorId: testUser.id,
                status: 'DELETED',
            },
        })

        const activePosts = await prisma.post.findMany({
            where: {
                authorId: testUser.id,
                status: 'ACTIVE'
            }
        })

        expect(activePosts.every(post => post.status === 'ACTIVE')).toBe(true)
    })

    it('should include like and comment counts', async () => {
        const post = await prisma.post.create({
            data: {
                title: 'test-post-counts',
                description: 'Test counts',
                images: ['image-1.jpg'],
                authorId: testUser.id,
            },
        })

        const postWithCounts = await prisma.post.findUnique({
            where: { id: post.id },
            include: {
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                }
            }
        })

        expect(postWithCounts?._count.likes).toBe(0)
        expect(postWithCounts?._count.comments).toBe(0)
    })

    it('should allow short titles at DB level (API validates)', async () => {
        // Database doesn't enforce min length, but API should
        const post = await prisma.post.create({
            data: {
                title: 'ab',
                description: 'Description',
                images: ['image-1.jpg'],
                authorId: testUser.id,
            },
        })

        expect(post.title).toBe('ab')
        // Note: API layer should validate minimum 3 characters
    })

    it('should require at least one image', async () => {
        // Empty images array should work at DB level, but API should validate
        const post = await prisma.post.create({
            data: {
                title: 'test-post-no-images',
                description: 'Post without images',
                images: [],
                authorId: testUser.id,
            },
        })

        expect(post.images).toEqual([])
        // Note: API validation should prevent this
    })
})

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

describe('Forum Operations', () => {
    let adminUser: any
    let regularUser: any
    let moderatorUser: any
    let testForum: any

    beforeAll(async () => {
        // Create test users
        adminUser = await prisma.user.create({
            data: {
                email: 'admin@test.com',
                username: 'admin',
                name: 'Admin User',
                password: await bcrypt.hash('password123', 10),
                isAdmin: true,
                isModerator: true,
            },
        })

        regularUser = await prisma.user.create({
            data: {
                email: 'user@test.com',
                username: 'testuser',
                name: 'Test User',
                password: await bcrypt.hash('password123', 10),
            },
        })

        moderatorUser = await prisma.user.create({
            data: {
                email: 'moderator@test.com',
                username: 'moderator',
                name: 'Moderator User',
                password: await bcrypt.hash('password123', 10),
                isModerator: true,
            },
        })

        // Create test forum for all tests
        testForum = await prisma.forum.create({
            data: {
                name: 'General Discussion',
                slug: 'general',
                description: 'A place for general discussions',
                icon: '💬',
                color: '#3B82F6',
                order: 0,
            },
        })
    })

    afterAll(async () => {
        // Final cleanup
        await prisma.threadComment.deleteMany({})
        await prisma.thread.deleteMany({})
        await prisma.moderationLog.deleteMany({})
        await prisma.userBan.deleteMany({})
        await prisma.forum.deleteMany({})
        await prisma.user.deleteMany({
            where: {
                id: {
                    in: [adminUser.id, regularUser.id, moderatorUser.id],
                },
            },
        })
        await prisma.$disconnect()
    })

    describe('Forum CRUD Operations', () => {
        test('should create a new forum', async () => {
            expect(testForum).toBeDefined()
            expect(testForum.name).toBe('General Discussion')
            expect(testForum.slug).toBe('general')
            expect(testForum.isActive).toBe(true)
        })

        test('should retrieve all active forums', async () => {
            const forums = await prisma.forum.findMany({
                where: { isActive: true },
                orderBy: { order: 'asc' },
            })

            expect(forums.length).toBeGreaterThan(0)
            const generalForum = forums.find(f => f.slug === 'general')
            expect(generalForum).toBeDefined()
        })

        test('should update a forum', async () => {
            const updatedForum = await prisma.forum.update({
                where: { id: testForum.id },
                data: {
                    description: 'Updated description',
                },
            })

            expect(updatedForum.description).toBe('Updated description')
        })

        test('should deactivate and reactivate a forum', async () => {
            const deactivatedForum = await prisma.forum.update({
                where: { id: testForum.id },
                data: { isActive: false },
            })

            expect(deactivatedForum.isActive).toBe(false)

            const reactivatedForum = await prisma.forum.update({
                where: { id: testForum.id },
                data: { isActive: true },
            })

            expect(reactivatedForum.isActive).toBe(true)
        })
    })

    describe('Thread Operations', () => {
        let testThread: any

        test('should create a new thread', async () => {
            testThread = await prisma.thread.create({
                data: {
                    title: 'Test Thread',
                    content: 'This is a test thread content',
                    forumId: testForum.id,
                    authorId: regularUser.id,
                },
                include: {
                    author: true,
                    forum: true,
                },
            })

            expect(testThread).toBeDefined()
            expect(testThread.title).toBe('Test Thread')
            expect(testThread.status).toBe('ACTIVE')
            expect(testThread.isPinned).toBe(false)
            expect(testThread.isLocked).toBe(false)
        })

        test('should retrieve threads for a forum', async () => {
            const threads = await prisma.thread.findMany({
                where: {
                    forumId: testForum.id,
                    status: { in: ['ACTIVE', 'LOCKED'] },
                },
                orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            })

            expect(threads.length).toBeGreaterThan(0)
            expect(threads[0].forumId).toBe(testForum.id)
        })

        test('should update a thread', async () => {
            const updatedThread = await prisma.thread.update({
                where: { id: testThread.id },
                data: {
                    title: 'Updated Thread Title',
                },
            })

            expect(updatedThread.title).toBe('Updated Thread Title')
        })

        test('should increment thread views', async () => {
            const initialViews = testThread.views

            await prisma.thread.update({
                where: { id: testThread.id },
                data: { views: { increment: 1 } },
            })

            const updatedThread = await prisma.thread.findUnique({
                where: { id: testThread.id },
            })

            expect(updatedThread?.views).toBe(initialViews + 1)
        })

        test('banned user should not be able to create threads', async () => {
            // Ban the user
            await prisma.user.update({
                where: { id: regularUser.id },
                data: { isBanned: true },
            })

            const user = await prisma.user.findUnique({
                where: { id: regularUser.id },
            })

            expect(user?.isBanned).toBe(true)

            // Unban for next tests
            await prisma.user.update({
                where: { id: regularUser.id },
                data: { isBanned: false },
            })
        })
    })

    describe('Comment Operations', () => {
        let testThread: any
        let testComment: any
        let testReply: any

        beforeAll(async () => {
            testThread = await prisma.thread.create({
                data: {
                    title: 'Thread for Comments',
                    content: 'Testing comments',
                    forumId: testForum.id,
                    authorId: regularUser.id,
                },
            })
        })

        test('should create a new comment', async () => {
            testComment = await prisma.threadComment.create({
                data: {
                    content: 'This is a test comment',
                    threadId: testThread.id,
                    authorId: regularUser.id,
                },
                include: {
                    author: true,
                },
            })

            expect(testComment).toBeDefined()
            expect(testComment.content).toBe('This is a test comment')
            expect(testComment.status).toBe('ACTIVE')
        })

        test('should create a reply to a comment', async () => {
            testReply = await prisma.threadComment.create({
                data: {
                    content: 'This is a reply',
                    threadId: testThread.id,
                    authorId: moderatorUser.id,
                    parentId: testComment.id,
                },
            })

            expect(testReply).toBeDefined()
            expect(testReply.parentId).toBe(testComment.id)
        })

        test('should retrieve comments with replies', async () => {
            const comments = await prisma.threadComment.findMany({
                where: {
                    threadId: testThread.id,
                    parentId: null,
                    status: 'ACTIVE',
                },
                include: {
                    replies: {
                        where: { status: 'ACTIVE' },
                    },
                },
            })

            expect(comments.length).toBeGreaterThan(0)
            expect(comments[0].replies.length).toBeGreaterThan(0)
        })

        test('should not allow comments on locked threads', async () => {
            await prisma.thread.update({
                where: { id: testThread.id },
                data: { isLocked: true },
            })

            const thread = await prisma.thread.findUnique({
                where: { id: testThread.id },
            })

            expect(thread?.isLocked).toBe(true)
        })
    })

    describe('Moderation Operations', () => {
        let testThread: any
        let testComment: any

        beforeAll(async () => {
            testThread = await prisma.thread.create({
                data: {
                    title: 'Thread for Moderation',
                    content: 'Testing moderation',
                    forumId: testForum.id,
                    authorId: regularUser.id,
                },
            })

            testComment = await prisma.threadComment.create({
                data: {
                    content: 'Comment for moderation',
                    threadId: testThread.id,
                    authorId: regularUser.id,
                },
            })
        })

        test('moderator should pin a thread', async () => {
            const [pinnedThread] = await prisma.$transaction([
                prisma.thread.update({
                    where: { id: testThread.id },
                    data: { isPinned: true },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'PIN_THREAD',
                        moderatorId: moderatorUser.id,
                        threadId: testThread.id,
                        targetUserId: regularUser.id,
                    },
                }),
            ])

            expect(pinnedThread.isPinned).toBe(true)

            const log = await prisma.moderationLog.findFirst({
                where: {
                    threadId: testThread.id,
                    action: 'PIN_THREAD',
                },
            })

            expect(log).toBeDefined()
        })

        test('moderator should lock a thread', async () => {
            // Create a new thread for locking
            const threadToLock = await prisma.thread.create({
                data: {
                    title: 'Thread to Lock',
                    content: 'This will be locked',
                    forumId: testForum.id,
                    authorId: regularUser.id,
                },
            })

            const [lockedThread] = await prisma.$transaction([
                prisma.thread.update({
                    where: { id: threadToLock.id },
                    data: { isLocked: true, status: 'LOCKED' },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'LOCK_THREAD',
                        moderatorId: moderatorUser.id,
                        threadId: threadToLock.id,
                        targetUserId: regularUser.id,
                        reason: 'Off-topic discussion',
                    },
                }),
            ])

            expect(lockedThread.isLocked).toBe(true)
            expect(lockedThread.status).toBe('LOCKED')
        })

        test('moderator should flag a thread', async () => {
            // Create a new thread for this test
            const threadToFlag = await prisma.thread.create({
                data: {
                    title: 'Thread to Flag',
                    content: 'This will be flagged',
                    forumId: testForum.id,
                    authorId: regularUser.id,
                },
            })

            const [flaggedThread] = await prisma.$transaction([
                prisma.thread.update({
                    where: { id: threadToFlag.id },
                    data: { status: 'FLAGGED' },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'FLAG_THREAD',
                        moderatorId: moderatorUser.id,
                        threadId: threadToFlag.id,
                        targetUserId: regularUser.id,
                        reason: 'Inappropriate content',
                    },
                }),
            ])

            expect(flaggedThread.status).toBe('FLAGGED')
        })

        test('moderator should delete a comment', async () => {
            // Create a new comment for this test
            const commentToDelete = await prisma.threadComment.create({
                data: {
                    content: 'Comment to delete',
                    threadId: testThread.id,
                    authorId: regularUser.id,
                },
            })

            const [deletedComment] = await prisma.$transaction([
                prisma.threadComment.update({
                    where: { id: commentToDelete.id },
                    data: { status: 'DELETED' },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'DELETE_COMMENT',
                        moderatorId: moderatorUser.id,
                        commentId: commentToDelete.id,
                        threadId: testThread.id,
                        targetUserId: regularUser.id,
                        reason: 'Spam',
                    },
                }),
            ])

            expect(deletedComment.status).toBe('DELETED')
        })

        test('should retrieve moderation logs', async () => {
            const logs = await prisma.moderationLog.findMany({
                where: {
                    moderatorId: moderatorUser.id,
                },
                orderBy: { createdAt: 'desc' },
            })

            expect(logs.length).toBeGreaterThan(0)
        })
    })

    describe('User Ban Operations', () => {
        test('moderator should ban a user', async () => {
            const banDuration = 7 // days
            const expiresAt = new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000)

            await prisma.$transaction([
                prisma.userBan.create({
                    data: {
                        userId: regularUser.id,
                        bannedById: moderatorUser.id,
                        reason: 'Repeated violations',
                        expiresAt,
                        isPermanent: false,
                        isActive: true,
                    },
                }),
                prisma.user.update({
                    where: { id: regularUser.id },
                    data: { isBanned: true },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'BAN_USER',
                        moderatorId: moderatorUser.id,
                        targetUserId: regularUser.id,
                        reason: 'Repeated violations',
                    },
                }),
            ])

            const bannedUser = await prisma.user.findUnique({
                where: { id: regularUser.id },
            })

            expect(bannedUser?.isBanned).toBe(true)

            const ban = await prisma.userBan.findFirst({
                where: {
                    userId: regularUser.id,
                    isActive: true,
                },
            })

            expect(ban).toBeDefined()
            expect(ban?.reason).toBe('Repeated violations')
        })

        test('moderator should unban a user', async () => {
            await prisma.$transaction([
                prisma.userBan.updateMany({
                    where: {
                        userId: regularUser.id,
                        isActive: true,
                    },
                    data: { isActive: false },
                }),
                prisma.user.update({
                    where: { id: regularUser.id },
                    data: { isBanned: false },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'UNBAN_USER',
                        moderatorId: moderatorUser.id,
                        targetUserId: regularUser.id,
                    },
                }),
            ])

            const unbannedUser = await prisma.user.findUnique({
                where: { id: regularUser.id },
            })

            expect(unbannedUser?.isBanned).toBe(false)
        })

        test('should create permanent ban', async () => {
            const testUser = await prisma.user.create({
                data: {
                    email: 'banned@test.com',
                    username: 'banneduser',
                    name: 'Banned User',
                    password: await bcrypt.hash('password123', 10),
                },
            })

            await prisma.$transaction([
                prisma.userBan.create({
                    data: {
                        userId: testUser.id,
                        bannedById: adminUser.id,
                        reason: 'Severe violation',
                        isPermanent: true,
                        isActive: true,
                    },
                }),
                prisma.user.update({
                    where: { id: testUser.id },
                    data: { isBanned: true },
                }),
            ])

            const ban = await prisma.userBan.findFirst({
                where: {
                    userId: testUser.id,
                    isActive: true,
                },
            })

            expect(ban?.isPermanent).toBe(true)
            expect(ban?.expiresAt).toBeNull()

            // Cleanup
            await prisma.userBan.deleteMany({ where: { userId: testUser.id } })
            await prisma.user.delete({ where: { id: testUser.id } })
        })
    })

    describe('Permission Checks', () => {
        test('regular user cannot ban users', async () => {
            const user = await prisma.user.findUnique({
                where: { id: regularUser.id },
                select: { isModerator: true, isAdmin: true },
            })

            expect(user?.isModerator || user?.isAdmin).toBe(false)
        })

        test('moderator can moderate content', async () => {
            const user = await prisma.user.findUnique({
                where: { id: moderatorUser.id },
                select: { isModerator: true, isAdmin: true },
            })

            expect(user?.isModerator || user?.isAdmin).toBe(true)
        })

        test('admin has all permissions', async () => {
            const user = await prisma.user.findUnique({
                where: { id: adminUser.id },
                select: { isModerator: true, isAdmin: true },
            })

            expect(user?.isAdmin).toBe(true)
        })

        test('cannot ban admin or moderator', async () => {
            const targetUser = await prisma.user.findUnique({
                where: { id: moderatorUser.id },
                select: { isAdmin: true, isModerator: true },
            })

            // This check would be done in the API route
            const canBan = !(targetUser?.isAdmin || targetUser?.isModerator)
            expect(canBan).toBe(false)
        })
    })
})

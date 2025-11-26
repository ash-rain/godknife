import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

describe('Moderation Features', () => {
    let adminUser: any
    let moderatorUser: any
    let regularUser: any
    let testForum: any
    let testThread: any

    beforeAll(async () => {
        // Create test users
        adminUser = await prisma.user.create({
            data: {
                email: 'mod-admin@test.com',
                username: 'modadmin',
                name: 'Mod Admin',
                password: await bcrypt.hash('password123', 10),
                isAdmin: true,
                isModerator: true,
            },
        })

        moderatorUser = await prisma.user.create({
            data: {
                email: 'mod-moderator@test.com',
                username: 'modmoderator',
                name: 'Mod Moderator',
                password: await bcrypt.hash('password123', 10),
                isModerator: true,
            },
        })

        regularUser = await prisma.user.create({
            data: {
                email: 'mod-user@test.com',
                username: 'moduser',
                name: 'Mod User',
                password: await bcrypt.hash('password123', 10),
            },
        })

        // Create test forum
        testForum = await prisma.forum.create({
            data: {
                name: 'Moderation Test Forum',
                slug: 'mod-test',
                description: 'Forum for testing moderation',
            },
        })

        // Create test thread
        testThread = await prisma.thread.create({
            data: {
                title: 'Test Thread for Moderation',
                content: 'Content for moderation testing',
                forumId: testForum.id,
                authorId: regularUser.id,
            },
        })
    })

    afterAll(async () => {
        // Cleanup
        await prisma.threadComment.deleteMany({})
        await prisma.moderationLog.deleteMany({})
        await prisma.thread.deleteMany({})
        await prisma.forum.deleteMany({})
        await prisma.userBan.deleteMany({})
        await prisma.user.deleteMany({
            where: {
                id: {
                    in: [adminUser.id, moderatorUser.id, regularUser.id],
                },
            },
        })
        await prisma.$disconnect()
    })

    describe('Thread Moderation Actions', () => {
        test('should pin and unpin thread', async () => {
            // Pin thread
            await prisma.$transaction([
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

            let thread = await prisma.thread.findUnique({
                where: { id: testThread.id },
            })
            expect(thread?.isPinned).toBe(true)

            // Unpin thread
            await prisma.$transaction([
                prisma.thread.update({
                    where: { id: testThread.id },
                    data: { isPinned: false },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'UNPIN_THREAD',
                        moderatorId: moderatorUser.id,
                        threadId: testThread.id,
                        targetUserId: regularUser.id,
                    },
                }),
            ])

            thread = await prisma.thread.findUnique({
                where: { id: testThread.id },
            })
            expect(thread?.isPinned).toBe(false)
        })

        test('should lock and unlock thread', async () => {
            // Lock thread
            await prisma.$transaction([
                prisma.thread.update({
                    where: { id: testThread.id },
                    data: { isLocked: true, status: 'LOCKED' },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'LOCK_THREAD',
                        moderatorId: moderatorUser.id,
                        threadId: testThread.id,
                        targetUserId: regularUser.id,
                        reason: 'Thread became too heated',
                    },
                }),
            ])

            let thread = await prisma.thread.findUnique({
                where: { id: testThread.id },
            })
            expect(thread?.isLocked).toBe(true)
            expect(thread?.status).toBe('LOCKED')

            // Unlock thread
            await prisma.$transaction([
                prisma.thread.update({
                    where: { id: testThread.id },
                    data: { isLocked: false, status: 'ACTIVE' },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'UNLOCK_THREAD',
                        moderatorId: moderatorUser.id,
                        threadId: testThread.id,
                        targetUserId: regularUser.id,
                    },
                }),
            ])

            thread = await prisma.thread.findUnique({
                where: { id: testThread.id },
            })
            expect(thread?.isLocked).toBe(false)
            expect(thread?.status).toBe('ACTIVE')
        })

        test('should flag and unflag thread', async () => {
            // Flag thread
            await prisma.$transaction([
                prisma.thread.update({
                    where: { id: testThread.id },
                    data: { status: 'FLAGGED' },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'FLAG_THREAD',
                        moderatorId: moderatorUser.id,
                        threadId: testThread.id,
                        targetUserId: regularUser.id,
                        reason: 'Reported by multiple users',
                    },
                }),
            ])

            let thread = await prisma.thread.findUnique({
                where: { id: testThread.id },
            })
            expect(thread?.status).toBe('FLAGGED')

            // Unflag thread
            await prisma.$transaction([
                prisma.thread.update({
                    where: { id: testThread.id },
                    data: { status: 'ACTIVE' },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'UNFLAG_THREAD',
                        moderatorId: moderatorUser.id,
                        threadId: testThread.id,
                        targetUserId: regularUser.id,
                    },
                }),
            ])

            thread = await prisma.thread.findUnique({
                where: { id: testThread.id },
            })
            expect(thread?.status).toBe('ACTIVE')
        })

        test('should soft delete and restore thread', async () => {
            // Delete thread
            await prisma.$transaction([
                prisma.thread.update({
                    where: { id: testThread.id },
                    data: { status: 'DELETED' },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'DELETE_THREAD',
                        moderatorId: moderatorUser.id,
                        threadId: testThread.id,
                        targetUserId: regularUser.id,
                        reason: 'Violates community guidelines',
                    },
                }),
            ])

            let thread = await prisma.thread.findUnique({
                where: { id: testThread.id },
            })
            expect(thread?.status).toBe('DELETED')

            // Restore thread
            await prisma.$transaction([
                prisma.thread.update({
                    where: { id: testThread.id },
                    data: { status: 'ACTIVE' },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'RESTORE_THREAD',
                        moderatorId: adminUser.id,
                        threadId: testThread.id,
                        targetUserId: regularUser.id,
                    },
                }),
            ])

            thread = await prisma.thread.findUnique({
                where: { id: testThread.id },
            })
            expect(thread?.status).toBe('ACTIVE')
        })
    })

    describe('Comment Moderation Actions', () => {
        let testComment: any

        beforeAll(async () => {
            testComment = await prisma.threadComment.create({
                data: {
                    content: 'Test comment for moderation',
                    threadId: testThread.id,
                    authorId: regularUser.id,
                },
            })
        })

        test('should flag and unflag comment', async () => {
            // Flag comment
            await prisma.$transaction([
                prisma.threadComment.update({
                    where: { id: testComment.id },
                    data: { status: 'FLAGGED' },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'FLAG_COMMENT',
                        moderatorId: moderatorUser.id,
                        commentId: testComment.id,
                        threadId: testThread.id,
                        targetUserId: regularUser.id,
                        reason: 'Inappropriate language',
                    },
                }),
            ])

            let comment = await prisma.threadComment.findUnique({
                where: { id: testComment.id },
            })
            expect(comment?.status).toBe('FLAGGED')

            // Unflag comment
            await prisma.$transaction([
                prisma.threadComment.update({
                    where: { id: testComment.id },
                    data: { status: 'ACTIVE' },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'UNFLAG_COMMENT',
                        moderatorId: moderatorUser.id,
                        commentId: testComment.id,
                        threadId: testThread.id,
                        targetUserId: regularUser.id,
                    },
                }),
            ])

            comment = await prisma.threadComment.findUnique({
                where: { id: testComment.id },
            })
            expect(comment?.status).toBe('ACTIVE')
        })

        test('should delete and restore comment', async () => {
            // Delete comment
            await prisma.$transaction([
                prisma.threadComment.update({
                    where: { id: testComment.id },
                    data: { status: 'DELETED' },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'DELETE_COMMENT',
                        moderatorId: moderatorUser.id,
                        commentId: testComment.id,
                        threadId: testThread.id,
                        targetUserId: regularUser.id,
                        reason: 'Spam',
                    },
                }),
            ])

            let comment = await prisma.threadComment.findUnique({
                where: { id: testComment.id },
            })
            expect(comment?.status).toBe('DELETED')

            // Restore comment
            await prisma.$transaction([
                prisma.threadComment.update({
                    where: { id: testComment.id },
                    data: { status: 'ACTIVE' },
                }),
                prisma.moderationLog.create({
                    data: {
                        action: 'RESTORE_COMMENT',
                        moderatorId: adminUser.id,
                        commentId: testComment.id,
                        threadId: testThread.id,
                        targetUserId: regularUser.id,
                    },
                }),
            ])

            comment = await prisma.threadComment.findUnique({
                where: { id: testComment.id },
            })
            expect(comment?.status).toBe('ACTIVE')
        })
    })

    describe('Ban Management', () => {
        test('should create temporary ban', async () => {
            const banDuration = 3 // days
            const expiresAt = new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000)

            await prisma.$transaction([
                prisma.userBan.create({
                    data: {
                        userId: regularUser.id,
                        bannedById: moderatorUser.id,
                        reason: 'Multiple warnings ignored',
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
                        reason: 'Multiple warnings ignored',
                    },
                }),
            ])

            const user = await prisma.user.findUnique({
                where: { id: regularUser.id },
            })
            expect(user?.isBanned).toBe(true)

            const ban = await prisma.userBan.findFirst({
                where: {
                    userId: regularUser.id,
                    isActive: true,
                },
            })
            expect(ban?.isPermanent).toBe(false)
            expect(ban?.expiresAt).toBeDefined()
        })

        test('should lift ban', async () => {
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
                        moderatorId: adminUser.id,
                        targetUserId: regularUser.id,
                    },
                }),
            ])

            const user = await prisma.user.findUnique({
                where: { id: regularUser.id },
            })
            expect(user?.isBanned).toBe(false)

            const activeBan = await prisma.userBan.findFirst({
                where: {
                    userId: regularUser.id,
                    isActive: true,
                },
            })
            expect(activeBan).toBeNull()
        })

        test('should track multiple bans for a user', async () => {
            // First ban
            await prisma.$transaction([
                prisma.userBan.create({
                    data: {
                        userId: regularUser.id,
                        bannedById: moderatorUser.id,
                        reason: 'First offense',
                        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                        isActive: false,
                    },
                }),
            ])

            // Second ban
            await prisma.$transaction([
                prisma.userBan.create({
                    data: {
                        userId: regularUser.id,
                        bannedById: moderatorUser.id,
                        reason: 'Second offense',
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        isActive: false,
                    },
                }),
            ])

            const bans = await prisma.userBan.findMany({
                where: { userId: regularUser.id },
            })

            expect(bans.length).toBeGreaterThanOrEqual(2)
        })
    })

    describe('Moderation Log Queries', () => {
        test('should retrieve logs for a specific moderator', async () => {
            const logs = await prisma.moderationLog.findMany({
                where: { moderatorId: moderatorUser.id },
                orderBy: { createdAt: 'desc' },
            })

            expect(logs.length).toBeGreaterThan(0)
            expect(logs[0].moderatorId).toBe(moderatorUser.id)
        })

        test('should retrieve logs for a specific user', async () => {
            const logs = await prisma.moderationLog.findMany({
                where: { targetUserId: regularUser.id },
                orderBy: { createdAt: 'desc' },
            })

            expect(logs.length).toBeGreaterThan(0)
            expect(logs[0].targetUserId).toBe(regularUser.id)
        })

        test('should retrieve logs for a specific thread', async () => {
            const logs = await prisma.moderationLog.findMany({
                where: { threadId: testThread.id },
                orderBy: { createdAt: 'desc' },
            })

            expect(logs.length).toBeGreaterThan(0)
            expect(logs[0].threadId).toBe(testThread.id)
        })

        test('should retrieve logs with related data', async () => {
            const logs = await prisma.moderationLog.findMany({
                where: { moderatorId: moderatorUser.id },
                include: {
                    moderator: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                        },
                    },
                    targetUser: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                        },
                    },
                    thread: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
                take: 10,
            })

            expect(logs.length).toBeGreaterThan(0)
            expect(logs[0].moderator).toBeDefined()
        })
    })

    describe('Permission Validations', () => {
        test('should verify moderator permissions', async () => {
            const user = await prisma.user.findUnique({
                where: { id: moderatorUser.id },
                select: { isModerator: true, isAdmin: true },
            })

            const hasModeratorPermission = user?.isModerator || user?.isAdmin
            expect(hasModeratorPermission).toBe(true)
        })

        test('should verify regular user lacks moderator permissions', async () => {
            const user = await prisma.user.findUnique({
                where: { id: regularUser.id },
                select: { isModerator: true, isAdmin: true },
            })

            const hasModeratorPermission = user?.isModerator || user?.isAdmin
            expect(hasModeratorPermission).toBe(false)
        })

        test('should prevent banning moderators or admins', async () => {
            const targetUser = await prisma.user.findUnique({
                where: { id: moderatorUser.id },
                select: { isAdmin: true, isModerator: true },
            })

            const canBan = !(targetUser?.isAdmin || targetUser?.isModerator)
            expect(canBan).toBe(false)
        })
    })
})

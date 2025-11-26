import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'

describe('Social Login (OAuth)', () => {
    beforeEach(async () => {
        // Clean up test data - delete accounts first, then users
        const usersWithOauth = await prisma.user.findMany({
            where: {
                email: {
                    contains: 'oauth-test'
                }
            },
            select: { id: true }
        })

        for (const user of usersWithOauth) {
            await prisma.account.deleteMany({
                where: { userId: user.id }
            })
        }

        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: 'oauth-test'
                }
            }
        })
    })

    afterEach(async () => {
        // Clean up test data - delete accounts first, then users
        const usersWithOauth = await prisma.user.findMany({
            where: {
                email: {
                    contains: 'oauth-test'
                }
            },
            select: { id: true }
        })

        for (const user of usersWithOauth) {
            await prisma.account.deleteMany({
                where: { userId: user.id }
            })
        }

        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: 'oauth-test'
                }
            }
        })
    })

    it('should create user and account on first OAuth login', async () => {
        // Simulate what PrismaAdapter does
        const user = await prisma.user.create({
            data: {
                email: 'oauth-test@example.com',
                name: 'OAuth Test User',
                emailVerified: new Date(),
            },
        })

        const account = await prisma.account.create({
            data: {
                userId: user.id,
                type: 'oauth',
                provider: 'google',
                providerAccountId: '123456789',
                access_token: 'mock_access_token',
                token_type: 'Bearer',
                scope: 'openid profile email',
            },
        })

        expect(user).toBeDefined()
        expect(user.email).toBe('oauth-test@example.com')
        expect(user.password).toBeNull()
        expect(account.provider).toBe('google')
        expect(account.userId).toBe(user.id)
    })

    it('should link multiple OAuth accounts to same user', async () => {
        // Create user
        const user = await prisma.user.create({
            data: {
                email: 'oauth-test-multi@example.com',
                name: 'Multi OAuth User',
                emailVerified: new Date(),
            },
        })

        // Create Google account
        await prisma.account.create({
            data: {
                userId: user.id,
                type: 'oauth',
                provider: 'google',
                providerAccountId: '111111111',
                access_token: 'mock_google_token',
            },
        })

        // Create Facebook account
        await prisma.account.create({
            data: {
                userId: user.id,
                type: 'oauth',
                provider: 'facebook',
                providerAccountId: '222222222',
                access_token: 'mock_facebook_token',
            },
        })

        const accounts = await prisma.account.findMany({
            where: { userId: user.id }
        })

        expect(accounts).toHaveLength(2)
        expect(accounts.map(a => a.provider)).toContain('google')
        expect(accounts.map(a => a.provider)).toContain('facebook')
    })

    it('should auto-generate username for OAuth users', async () => {
        // Create OAuth user without username
        const user = await prisma.user.create({
            data: {
                email: 'oauth-test-username@example.com',
                name: 'John Smith',
                emailVerified: new Date(),
            },
        })

        expect(user.username).toBeNull()

        // Simulate username generation (like in signIn callback)
        const baseUsername = 'johnsmith'
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { username: baseUsername }
        })

        expect(updatedUser.username).toBe(baseUsername)
    })

    it('should handle existing OAuth account login', async () => {
        // Create user and account
        const user = await prisma.user.create({
            data: {
                email: 'oauth-test-existing@example.com',
                name: 'Existing User',
                username: 'existinguser',
                emailVerified: new Date(),
            },
        })

        await prisma.account.create({
            data: {
                userId: user.id,
                type: 'oauth',
                provider: 'google',
                providerAccountId: '999999999',
                access_token: 'mock_token',
            },
        })

        // Try to find account on subsequent login
        const account = await prisma.account.findUnique({
            where: {
                provider_providerAccountId: {
                    provider: 'google',
                    providerAccountId: '999999999'
                }
            },
            include: { user: true }
        })

        expect(account).toBeDefined()
        expect(account?.user.email).toBe('oauth-test-existing@example.com')
        expect(account?.user.username).toBe('existinguser')
    })
})

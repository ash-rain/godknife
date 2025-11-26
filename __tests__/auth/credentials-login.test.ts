import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

describe('Credentials Login', () => {
    const testUser = {
        email: 'test-login@example.com',
        password: 'password123',
        name: 'Test User',
        username: 'testlogin'
    }

    beforeEach(async () => {
        // Clean up and create test user
        await prisma.user.deleteMany({
            where: { email: testUser.email }
        })

        const hashedPassword = await bcrypt.hash(testUser.password, 10)
        await prisma.user.create({
            data: {
                email: testUser.email,
                password: hashedPassword,
                name: testUser.name,
                username: testUser.username,
            },
        })
    })

    afterEach(async () => {
        await prisma.user.deleteMany({
            where: { email: testUser.email }
        })
    })

    it('should authenticate user with correct credentials', async () => {
        const user = await prisma.user.findUnique({
            where: { email: testUser.email }
        })

        expect(user).toBeDefined()
        expect(user?.email).toBe(testUser.email)

        const isPasswordValid = await bcrypt.compare(
            testUser.password,
            user!.password!
        )

        expect(isPasswordValid).toBe(true)
    })

    it('should reject authentication with wrong password', async () => {
        const user = await prisma.user.findUnique({
            where: { email: testUser.email }
        })

        const isPasswordValid = await bcrypt.compare(
            'wrongpassword',
            user!.password!
        )

        expect(isPasswordValid).toBe(false)
    })

    it('should not find user with non-existent email', async () => {
        const user = await prisma.user.findUnique({
            where: { email: 'nonexistent@example.com' }
        })

        expect(user).toBeNull()
    })

    it('should not authenticate user without password', async () => {
        // Create OAuth user without password
        await prisma.user.create({
            data: {
                email: 'oauth-user@example.com',
                name: 'OAuth User',
                username: 'oauthuser',
            },
        })

        const user = await prisma.user.findUnique({
            where: { email: 'oauth-user@example.com' }
        })

        expect(user?.password).toBeNull()

        // Clean up
        await prisma.user.delete({
            where: { email: 'oauth-user@example.com' }
        })
    })
})

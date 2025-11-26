import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

describe('User Registration', () => {
    beforeEach(async () => {
        // Clean up test data - be more specific
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: { contains: 'test@' } },
                    { email: { contains: 'test-' } }
                ]
            }
        })
    })

    afterEach(async () => {
        // Clean up after each test - be more specific
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: { contains: 'test@' } },
                    { email: { contains: 'test-' } }
                ]
            }
        })
    })

    it('should register a new user with valid data', async () => {
        const userData = {
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            username: 'testuser'
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10)

        const user = await prisma.user.create({
            data: {
                email: userData.email,
                password: hashedPassword,
                name: userData.name,
                username: userData.username,
            },
        })

        expect(user).toBeDefined()
        expect(user.email).toBe(userData.email)
        expect(user.name).toBe(userData.name)
        expect(user.username).toBe(userData.username)
        expect(user.password).toBeDefined()
        expect(user.password).not.toBe(userData.password) // Password should be hashed

        // Verify password
        const isValid = await bcrypt.compare(userData.password, user.password!)
        expect(isValid).toBe(true)
    })

    it('should not register user with duplicate email', async () => {
        const userData = {
            email: 'test-duplicate@example.com',
            password: 'password123',
            name: 'Test User',
            username: 'testuser1'
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10)

        // Create first user
        await prisma.user.create({
            data: {
                email: userData.email,
                password: hashedPassword,
                name: userData.name,
                username: userData.username,
            },
        })

        // Attempt to create duplicate user
        await expect(
            prisma.user.create({
                data: {
                    email: userData.email,
                    password: hashedPassword,
                    name: 'Another User',
                    username: 'testuser2',
                },
            })
        ).rejects.toThrow()
    })

    it('should not register user with duplicate username', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10)

        // Create first user
        await prisma.user.create({
            data: {
                email: 'test-username1@example.com',
                password: hashedPassword,
                name: 'Test User 1',
                username: 'duplicateusername',
            },
        })

        // Attempt to create user with duplicate username
        await expect(
            prisma.user.create({
                data: {
                    email: 'test-username2@example.com',
                    password: hashedPassword,
                    name: 'Test User 2',
                    username: 'duplicateusername',
                },
            })
        ).rejects.toThrow()
    })

    it('should set default values for new user', async () => {
        const userData = {
            email: 'test-defaults@example.com',
            password: await bcrypt.hash('password123', 10),
            name: 'Test User',
            username: 'testdefaults'
        }

        const user = await prisma.user.create({
            data: userData,
        })

        expect(user.isAdmin).toBe(false)
        expect(user.postCredits).toBe(0)
        expect(user.createdAt).toBeDefined()
        expect(user.updatedAt).toBeDefined()
    })
})

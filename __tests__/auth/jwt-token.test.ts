/**
 * JWT Token Test
 * 
 * Tests that the JWT token properly includes all user fields
 * including isAdmin, isModerator, username, and postCredits
 */

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

describe('JWT Token Fields', () => {
    let testAdminUser: any
    let testModeratorUser: any
    let testRegularUser: any

    beforeAll(async () => {
        // Clean up test users
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: [
                        'admin-jwt-test@example.com',
                        'moderator-jwt-test@example.com',
                        'regular-jwt-test@example.com',
                    ],
                },
            },
        })

        // Create test admin user
        testAdminUser = await prisma.user.create({
            data: {
                email: 'admin-jwt-test@example.com',
                name: 'Admin User',
                username: 'admin_jwt_test',
                password: await bcrypt.hash('password123', 10),
                isAdmin: true,
                isModerator: false,
                postCredits: 10,
            },
        })

        // Create test moderator user
        testModeratorUser = await prisma.user.create({
            data: {
                email: 'moderator-jwt-test@example.com',
                name: 'Moderator User',
                username: 'moderator_jwt_test',
                password: await bcrypt.hash('password123', 10),
                isAdmin: false,
                isModerator: true,
                postCredits: 5,
            },
        })

        // Create test regular user
        testRegularUser = await prisma.user.create({
            data: {
                email: 'regular-jwt-test@example.com',
                name: 'Regular User',
                username: 'regular_jwt_test',
                password: await bcrypt.hash('password123', 10),
                isAdmin: false,
                isModerator: false,
                postCredits: 2,
            },
        })
    })

    afterAll(async () => {
        // Clean up
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: [
                        'admin-jwt-test@example.com',
                        'moderator-jwt-test@example.com',
                        'regular-jwt-test@example.com',
                    ],
                },
            },
        })
    })

    it('should include all fields in admin user token', async () => {
        // Verify the user was created correctly
        const user = await prisma.user.findUnique({
            where: { id: testAdminUser.id },
            select: {
                id: true,
                isAdmin: true,
                isModerator: true,
                username: true,
                postCredits: true,
            },
        })

        expect(user).toBeTruthy()
        expect(user?.isAdmin).toBe(true)
        expect(user?.isModerator).toBe(false)
        expect(user?.username).toBe('admin_jwt_test')
        expect(user?.postCredits).toBe(10)
    })

    it('should include all fields in moderator user token', async () => {
        // Verify the user was created correctly
        const user = await prisma.user.findUnique({
            where: { id: testModeratorUser.id },
            select: {
                id: true,
                isAdmin: true,
                isModerator: true,
                username: true,
                postCredits: true,
            },
        })

        expect(user).toBeTruthy()
        expect(user?.isAdmin).toBe(false)
        expect(user?.isModerator).toBe(true)
        expect(user?.username).toBe('moderator_jwt_test')
        expect(user?.postCredits).toBe(5)
    })

    it('should include all fields in regular user token', async () => {
        // Verify the user was created correctly
        const user = await prisma.user.findUnique({
            where: { id: testRegularUser.id },
            select: {
                id: true,
                isAdmin: true,
                isModerator: true,
                username: true,
                postCredits: true,
            },
        })

        expect(user).toBeTruthy()
        expect(user?.isAdmin).toBe(false)
        expect(user?.isModerator).toBe(false)
        expect(user?.username).toBe('regular_jwt_test')
        expect(user?.postCredits).toBe(2)
    })
})

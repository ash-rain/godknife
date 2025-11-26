import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import { canUserCreatePost, consumePostCredit, addPostCredits } from '@/lib/post-limits'
import bcrypt from 'bcryptjs'
import { addWeeks, subWeeks } from 'date-fns'

describe('Post Limits', () => {
    let testUser: any

    beforeEach(async () => {
        // Clean up test data
        const existingUsers = await prisma.user.findMany({
            where: {
                email: 'limits-test@example.com'
            }
        })

        for (const user of existingUsers) {
            await prisma.user.delete({
                where: { id: user.id }
            })
        }

        // Create test user
        const hashedPassword = await bcrypt.hash('password123', 10)
        testUser = await prisma.user.create({
            data: {
                email: 'limits-test@example.com',
                password: hashedPassword,
                name: 'Limits Test User',
                username: 'limitstester',
                postCredits: 0,
            },
        })
    })

    afterEach(async () => {
        // Clean up
        await prisma.user.deleteMany({
            where: {
                email: 'limits-test@example.com'
            }
        })
    })

    describe('Free Post Limits', () => {
        it('should allow first free post when no lastFreePostDate', async () => {
            const result = await canUserCreatePost(testUser.id)

            expect(result.canPost).toBe(true)
            expect(result.reason).toBeUndefined()
        })

        it('should allow free post after one week', async () => {
            // Set last free post to more than a week ago
            await prisma.user.update({
                where: { id: testUser.id },
                data: { lastFreePostDate: subWeeks(new Date(), 2) }
            })

            const result = await canUserCreatePost(testUser.id)

            expect(result.canPost).toBe(true)
        })

        it('should deny free post within one week', async () => {
            // Set last free post to recent date
            const recentDate = new Date()
            await prisma.user.update({
                where: { id: testUser.id },
                data: { lastFreePostDate: recentDate }
            })

            const result = await canUserCreatePost(testUser.id)

            expect(result.canPost).toBe(false)
            expect(result.reason).toBe('Free post limit reached')
            expect(result.nextFreePostDate).toBeDefined()
        })

        it('should return correct nextFreePostDate', async () => {
            const lastPostDate = new Date()
            await prisma.user.update({
                where: { id: testUser.id },
                data: { lastFreePostDate: lastPostDate }
            })

            const result = await canUserCreatePost(testUser.id)

            expect(result.canPost).toBe(false)
            expect(result.nextFreePostDate).toBeDefined()

            const expectedDate = addWeeks(lastPostDate, 1)
            expect(result.nextFreePostDate?.getTime()).toBeCloseTo(expectedDate.getTime(), -1000)
        })
    })

    describe('Paid Post Credits', () => {
        it('should allow post with available credits', async () => {
            await prisma.user.update({
                where: { id: testUser.id },
                data: { postCredits: 5 }
            })

            const result = await canUserCreatePost(testUser.id)

            expect(result.canPost).toBe(true)
        })

        it('should prioritize paid credits over free posts', async () => {
            // Set recent lastFreePostDate (should block free post)
            // But user has credits, so should still allow
            await prisma.user.update({
                where: { id: testUser.id },
                data: {
                    postCredits: 1,
                    lastFreePostDate: new Date()
                }
            })

            const result = await canUserCreatePost(testUser.id)

            expect(result.canPost).toBe(true)
        })
    })

    describe('Consuming Post Credits', () => {
        it('should consume paid credit when available', async () => {
            await prisma.user.update({
                where: { id: testUser.id },
                data: { postCredits: 3 }
            })

            await consumePostCredit(testUser.id)

            const updatedUser = await prisma.user.findUnique({
                where: { id: testUser.id }
            })

            expect(updatedUser?.postCredits).toBe(2)
        })

        it('should update lastFreePostDate when using free post', async () => {
            const beforeDate = new Date()

            await consumePostCredit(testUser.id)

            const updatedUser = await prisma.user.findUnique({
                where: { id: testUser.id }
            })

            expect(updatedUser?.lastFreePostDate).toBeDefined()
            expect(updatedUser?.lastFreePostDate!.getTime()).toBeGreaterThanOrEqual(beforeDate.getTime())
        })

        it('should not modify lastFreePostDate when consuming paid credit', async () => {
            await prisma.user.update({
                where: { id: testUser.id },
                data: {
                    postCredits: 1,
                    lastFreePostDate: null
                }
            })

            await consumePostCredit(testUser.id)

            const updatedUser = await prisma.user.findUnique({
                where: { id: testUser.id }
            })

            expect(updatedUser?.postCredits).toBe(0)
            expect(updatedUser?.lastFreePostDate).toBeNull()
        })

        it('should throw error for non-existent user', async () => {
            await expect(
                consumePostCredit('non-existent-id')
            ).rejects.toThrow('User not found')
        })
    })

    describe('Adding Post Credits', () => {
        it('should add credits to user account', async () => {
            await addPostCredits(testUser.id, 5)

            const updatedUser = await prisma.user.findUnique({
                where: { id: testUser.id }
            })

            expect(updatedUser?.postCredits).toBe(5)
        })

        it('should increment existing credits', async () => {
            await prisma.user.update({
                where: { id: testUser.id },
                data: { postCredits: 3 }
            })

            await addPostCredits(testUser.id, 5)

            const updatedUser = await prisma.user.findUnique({
                where: { id: testUser.id }
            })

            expect(updatedUser?.postCredits).toBe(8)
        })

        it('should handle bulk credit purchases', async () => {
            await addPostCredits(testUser.id, 100)

            const updatedUser = await prisma.user.findUnique({
                where: { id: testUser.id }
            })

            expect(updatedUser?.postCredits).toBe(100)
        })
    })

    describe('Edge Cases', () => {
        it('should handle user not found in canUserCreatePost', async () => {
            const result = await canUserCreatePost('non-existent-id')

            expect(result.canPost).toBe(false)
            expect(result.reason).toBe('User not found')
        })

        it('should handle zero credits correctly', async () => {
            await prisma.user.update({
                where: { id: testUser.id },
                data: { postCredits: 0 }
            })

            // Should fall back to free post check
            const result = await canUserCreatePost(testUser.id)
            expect(result.canPost).toBe(true) // First free post allowed
        })

        it('should handle negative credit addition gracefully', async () => {
            await prisma.user.update({
                where: { id: testUser.id },
                data: { postCredits: 5 }
            })

            // This should technically not happen in production
            await addPostCredits(testUser.id, -2)

            const updatedUser = await prisma.user.findUnique({
                where: { id: testUser.id }
            })

            expect(updatedUser?.postCredits).toBe(3)
        })
    })
})

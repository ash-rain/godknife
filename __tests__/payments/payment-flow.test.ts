import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

describe('Payment Flow Integration Tests', () => {
    let testUser: any
    let testPost: any

    beforeAll(async () => {
        const hashedPassword = await hash('testpassword123', 10)
        testUser = await prisma.user.create({
            data: {
                email: `test-payment-flow-${Date.now()}@example.com`,
                username: `testuser_flow_${Date.now()}`,
                name: 'Test User Flow',
                password: hashedPassword,
                postCredits: 0,
                lastFreePostDate: null,
            },
        })

        testPost = await prisma.post.create({
            data: {
                title: 'Test Post for Payment Flow',
                description: 'Test description',
                authorId: testUser.id,
                images: [],
            },
        })
    })

    afterAll(async () => {
        if (testPost) {
            await prisma.post.delete({ where: { id: testPost.id } })
        }
        if (testUser) {
            await prisma.payment.deleteMany({ where: { userId: testUser.id } })
            await prisma.user.delete({ where: { id: testUser.id } })
        }
    })

    describe('Complete Payment Flow', () => {
        it('should handle full credit purchase flow', async () => {
            // Step 1: User has 0 credits
            let user = await prisma.user.findUnique({ where: { id: testUser.id } })
            expect(user?.postCredits).toBe(0)

            // Step 2: Create pending payment
            const payment = await prisma.payment.create({
                data: {
                    userId: testUser.id,
                    amount: 9.0,
                    currency: 'EUR',
                    provider: 'STRIPE',
                    providerPaymentId: `complete_flow_${Date.now()}`,
                    type: 'POST_CREDITS',
                    quantity: 10,
                    status: 'PENDING',
                },
            })

            expect(payment.status).toBe('PENDING')

            // Step 3: Payment completes
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'COMPLETED' },
            })

            // Step 4: Credits are added
            await prisma.user.update({
                where: { id: testUser.id },
                data: { postCredits: { increment: payment.quantity } },
            })

            // Step 5: Verify final state
            user = await prisma.user.findUnique({ where: { id: testUser.id } })
            expect(user?.postCredits).toBe(10)

            const completedPayment = await prisma.payment.findUnique({
                where: { id: payment.id },
            })
            expect(completedPayment?.status).toBe('COMPLETED')
        })

        it('should handle payment failure correctly', async () => {
            // Get current credits
            const userBefore = await prisma.user.findUnique({ where: { id: testUser.id } })
            const initialCredits = userBefore?.postCredits || 0

            // Create pending payment
            const payment = await prisma.payment.create({
                data: {
                    userId: testUser.id,
                    amount: 16.0,
                    currency: 'EUR',
                    provider: 'STRIPE',
                    providerPaymentId: `failed_flow_${Date.now()}`,
                    type: 'POST_CREDITS',
                    quantity: 20,
                    status: 'PENDING',
                },
            })

            // Payment fails
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'FAILED' },
            })

            // Verify credits were NOT added
            const user = await prisma.user.findUnique({
                where: { id: testUser.id },
            })
            expect(user?.postCredits).toBe(initialCredits)

            const failedPayment = await prisma.payment.findUnique({
                where: { id: payment.id },
            })
            expect(failedPayment?.status).toBe('FAILED')
        })

        it('should allow post creation after credit purchase', async () => {
            // Ensure user has credits
            await prisma.user.update({
                where: { id: testUser.id },
                data: { postCredits: 5 },
            })

            // User should be able to create post
            const user = await prisma.user.findUnique({
                where: { id: testUser.id },
            })
            expect(user?.postCredits).toBeGreaterThan(0)
            expect(user?.postCredits).toBe(5)
        })
    })

    describe('Payment History', () => {
        it('should maintain payment history', async () => {
            // Create multiple payments
            await prisma.payment.createMany({
                data: [
                    {
                        userId: testUser.id,
                        amount: 5.0,
                        currency: 'EUR',
                        provider: 'STRIPE',
                        type: 'POST_CREDITS',
                        quantity: 5,
                        status: 'COMPLETED',
                    },
                    {
                        userId: testUser.id,
                        amount: 9.0,
                        currency: 'EUR',
                        provider: 'PAYPAL',
                        type: 'POST_CREDITS',
                        quantity: 10,
                        status: 'COMPLETED',
                    },
                    {
                        userId: testUser.id,
                        amount: 10.0,
                        currency: 'EUR',
                        provider: 'STRIPE',
                        type: 'BOOST',
                        quantity: 1,
                        status: 'COMPLETED',
                    },
                ],
            })

            const payments = await prisma.payment.findMany({
                where: { userId: testUser.id },
                orderBy: { createdAt: 'desc' },
            })

            expect(payments.length).toBeGreaterThanOrEqual(3)

            // Verify payment types
            const creditPayments = payments.filter(p => p.type === 'POST_CREDITS')
            const boostPayments = payments.filter(p => p.type === 'BOOST')

            expect(creditPayments.length).toBeGreaterThanOrEqual(2)
            expect(boostPayments.length).toBeGreaterThanOrEqual(1)
        })

        it('should calculate total spent correctly', async () => {
            const payments = await prisma.payment.findMany({
                where: {
                    userId: testUser.id,
                    status: 'COMPLETED',
                },
            })

            const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0)
            expect(totalSpent).toBeGreaterThan(0)
        })
    })

    describe('Provider Statistics', () => {
        it('should track payments by provider', async () => {
            const paymentsByProvider = await prisma.payment.groupBy({
                by: ['provider'],
                where: { userId: testUser.id },
                _count: { provider: true },
                _sum: { amount: true },
            })

            expect(paymentsByProvider.length).toBeGreaterThan(0)

            paymentsByProvider.forEach(stat => {
                expect(['STRIPE', 'PAYPAL', 'MYPOS']).toContain(stat.provider)
                expect(stat._count.provider).toBeGreaterThan(0)
            })
        })
    })

    describe('Boost Payment Flow', () => {
        it('should handle complete boost payment', async () => {
            // Verify post is not boosted initially
            let post = await prisma.post.findUnique({ where: { id: testPost.id } })
            expect(post?.isBoosted).toBe(false)

            // Create boost payment
            const payment = await prisma.payment.create({
                data: {
                    userId: testUser.id,
                    amount: 10.0,
                    currency: 'EUR',
                    provider: 'STRIPE',
                    providerPaymentId: `boost_complete_${Date.now()}`,
                    type: 'BOOST',
                    quantity: 1,
                    status: 'PENDING',
                },
            })

            // Payment completes
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'COMPLETED' },
            })

            // Boost the post
            const boostExpiresAt = new Date()
            boostExpiresAt.setDate(boostExpiresAt.getDate() + 10)

            await prisma.post.update({
                where: { id: testPost.id },
                data: {
                    isBoosted: true,
                    boostExpiresAt,
                },
            })

            // Verify post is now boosted
            post = await prisma.post.findUnique({ where: { id: testPost.id } })
            expect(post?.isBoosted).toBe(true)
            expect(post?.boostExpiresAt).toBeInstanceOf(Date)

            const completedPayment = await prisma.payment.findUnique({
                where: { id: payment.id },
            })
            expect(completedPayment?.status).toBe('COMPLETED')
        })
    })
})

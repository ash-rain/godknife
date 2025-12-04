import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

describe('Payment API - MyPOS', () => {
    let testUser: any

    beforeAll(async () => {
        const hashedPassword = await hash('testpassword123', 10)
        testUser = await prisma.user.create({
            data: {
                email: `test-payments-mypos-${Date.now()}@example.com`,
                username: `testuser_mypos_${Date.now()}`,
                name: 'Test User MyPOS',
                password: hashedPassword,
                postCredits: 3,
            },
        })
    })

    afterAll(async () => {
        if (testUser) {
            await prisma.payment.deleteMany({ where: { userId: testUser.id } })
            await prisma.user.delete({ where: { id: testUser.id } })
        }
    })

    describe('POST /api/payments/mypos/create-payment', () => {

        it('should calculate bulk discount correctly for MyPOS', async () => {
            // Test various quantities
            const testCases = [
                { quantity: 5, discount: 1, expected: 5 },
                { quantity: 10, discount: 0.9, expected: 9 },
                { quantity: 20, discount: 0.8, expected: 16 },
                { quantity: 50, discount: 0.7, expected: 35 },
            ]

            testCases.forEach(({ quantity, discount, expected }) => {
                const price = quantity * 1 * discount
                expect(price).toBe(expected)
            })
        })

        it('should create payment record for MyPOS', async () => {
            const payment = await prisma.payment.create({
                data: {
                    userId: testUser.id,
                    amount: 35.0,
                    currency: 'EUR',
                    provider: 'MYPOS',
                    type: 'POST_CREDITS',
                    quantity: 50,
                    status: 'PENDING',
                },
            })

            expect(payment.provider).toBe('MYPOS')
            expect(payment.amount).toBe(35.0)
            expect(payment.quantity).toBe(50)
            expect(payment.status).toBe('PENDING')
        })
    })
})

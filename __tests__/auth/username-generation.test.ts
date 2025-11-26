import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

describe('Username Generation', () => {
    beforeEach(async () => {
        // Clean up test data
        await prisma.user.deleteMany({
            where: {
                username: {
                    startsWith: 'johndoe'
                }
            }
        })
    })

    afterEach(async () => {
        // Clean up after each test
        await prisma.user.deleteMany({
            where: {
                username: {
                    startsWith: 'johndoe'
                }
            }
        })
    })

    async function generateUniqueUsername(name: string | null): Promise<string> {
        // Create base username from name
        let baseUsername = 'user'
        if (name) {
            // Remove special characters and spaces, convert to lowercase
            baseUsername = name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')
                .substring(0, 15) // Limit length
        }

        // If base is empty, use 'user'
        if (!baseUsername) {
            baseUsername = 'user'
        }

        // Try to find available username
        let username = baseUsername
        let attempts = 0
        const maxAttempts = 10

        while (attempts < maxAttempts) {
            // Check if username exists
            const existingUser = await prisma.user.findUnique({
                where: { username }
            })

            if (!existingUser) {
                return username
            }

            // Generate random 4-digit number
            const randomNum = Math.floor(1000 + Math.random() * 9000)
            username = `${baseUsername}${randomNum}`
            attempts++
        }

        // Fallback: use timestamp
        return `${baseUsername}${Date.now().toString().slice(-6)}`
    }

    it('should generate username from full name', async () => {
        const username = await generateUniqueUsername('John Doe')
        expect(username).toBe('johndoe')
    })

    it('should generate unique username when base is taken', async () => {
        // Create user with base username
        await prisma.user.create({
            data: {
                email: 'john1@example.com',
                name: 'John Doe',
                username: 'johndoe',
            },
        })

        const newUsername = await generateUniqueUsername('John Doe')
        expect(newUsername).not.toBe('johndoe')
        expect(newUsername).toMatch(/^johndoe\d{4}$/)
    })

    it('should handle special characters in name', async () => {
        const username = await generateUniqueUsername('John-O\'Connor!')
        expect(username).toBe('johnoconnor')
    })

    it('should handle very long names', async () => {
        const username = await generateUniqueUsername('VeryLongNameThatExceedsTheMaximumLength')
        expect(username.length).toBeLessThanOrEqual(15)
        expect(username).toBe('verylongnametha')
    })

    it('should handle empty or null name', async () => {
        const username1 = await generateUniqueUsername(null)
        expect(username1).toBe('user')

        const username2 = await generateUniqueUsername('')
        expect(username2).toBe('user')
    })

    it('should handle names with only special characters', async () => {
        const username = await generateUniqueUsername('!@#$%^&*()')
        expect(username).toBe('user')
    })
})

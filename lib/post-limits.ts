import { prisma } from '@/lib/prisma'
import { addWeeks, isAfter } from 'date-fns'

export async function canUserCreatePost(userId: string): Promise<{
    canPost: boolean
    reason?: string
    nextFreePostDate?: Date
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            postCredits: true,
            lastFreePostDate: true,
        },
    })

    if (!user) {
        return { canPost: false, reason: 'User not found' }
    }

    // Check if user has purchased post credits
    if (user.postCredits > 0) {
        return { canPost: true }
    }

    // Check free post limit
    const oneWeekAgo = addWeeks(new Date(), -1)

    if (!user.lastFreePostDate || isAfter(oneWeekAgo, user.lastFreePostDate)) {
        return { canPost: true }
    }

    const nextFreePostDate = addWeeks(user.lastFreePostDate, 1)
    return {
        canPost: false,
        reason: 'Free post limit reached',
        nextFreePostDate,
    }
}

export async function consumePostCredit(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            postCredits: true,
            lastFreePostDate: true,
        },
    })

    if (!user) throw new Error('User not found')

    if (user.postCredits > 0) {
        // Consume a purchased post credit
        await prisma.user.update({
            where: { id: userId },
            data: {
                postCredits: user.postCredits - 1,
            },
        })
    } else {
        // Use free post
        await prisma.user.update({
            where: { id: userId },
            data: {
                lastFreePostDate: new Date(),
            },
        })
    }
}

export async function addPostCredits(userId: string, credits: number): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: {
            postCredits: {
                increment: credits,
            },
        },
    })
}

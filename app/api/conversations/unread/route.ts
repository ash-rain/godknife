import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get conversations where the user is a participant and has unread messages
        // Count conversations where user has messages they haven't read yet
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: session.user.id,
                    },
                },
            },
            include: {
                participants: {
                    where: {
                        userId: session.user.id,
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        })

        // Count conversations where:
        // 1. lastReadAt is null (never read), OR
        // 2. Latest message exists and was created after lastReadAt
        const unreadCount = conversations.filter((conv) => {
            const participant = conv.participants[0]
            const lastMessage = conv.messages[0]
            
            if (!lastMessage) return false // No messages = nothing to read
            if (!participant.lastReadAt) return true // Never read = unread
            
            // Check if last message is newer than lastReadAt
            return new Date(lastMessage.createdAt) > new Date(participant.lastReadAt)
        }).length

        return NextResponse.json({ count: unreadCount })
    } catch (error) {
        console.error('Get unread conversations error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

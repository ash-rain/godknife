import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        // Verify user is participant
        const participant = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId: id,
                userId: session.user.id,
            },
        })

        if (!participant) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
            },
        })

        // Mark as read
        await prisma.conversationParticipant.update({
            where: { id: participant.id },
            data: { lastReadAt: new Date() },
        })

        return NextResponse.json(messages)
    } catch (error) {
        console.error('Get messages error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        // Verify user is participant
        const participant = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId: id,
                userId: session.user.id,
            },
        })

        if (!participant) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const { content } = body

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { error: 'Message content is required' },
                { status: 400 }
            )
        }

        const message = await prisma.message.create({
            data: {
                content,
                senderId: session.user.id,
                conversationId: id,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
            },
        })

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() },
        })

        // Send real-time notification via Pusher
        await pusherServer.trigger(
            `conversation-${id}`,
            'new-message',
            message
        )

        // Notify recipient about new message
        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: {
                participants: true,
            },
        })

        const recipient = conversation?.participants.find(
            (p) => p.userId !== session.user.id
        )
        if (recipient) {
            await pusherServer.trigger(
                `user-${recipient.userId}`,
                'new-message',
                {
                    conversationId: id,
                    message,
                }
            )
        }

        return NextResponse.json(message, { status: 201 })
    } catch (error) {
        console.error('Send message error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

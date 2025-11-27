import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

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
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true,
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updatedAt: 'desc' },
        })

        return NextResponse.json(conversations)
    } catch (error) {
        console.error('Get conversations error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { recipientId, postId, message } = body

        if (!recipientId || !message) {
            return NextResponse.json(
                { error: 'Recipient and message are required' },
                { status: 400 }
            )
        }

        // Check if conversation already exists
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    {
                        participants: {
                            some: { userId: session.user.id },
                        },
                    },
                    {
                        participants: {
                            some: { userId: recipientId },
                        },
                    },
                    postId ? { postId } : {},
                ],
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                image: true,
                            },
                        },
                    },
                },
            },
        })

        let conversation

        if (existingConversation) {
            conversation = existingConversation
        } else {
            // Create new conversation
            conversation = await prisma.conversation.create({
                data: {
                    postId,
                    participants: {
                        create: [
                            { userId: session.user.id },
                            { userId: recipientId },
                        ],
                    },
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    username: true,
                                    image: true,
                                },
                            },
                        },
                    },
                },
            })
        }

        // Create message
        const newMessage = await prisma.message.create({
            data: {
                content: message,
                senderId: session.user.id,
                conversationId: conversation.id,
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
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
        })

        // Send real-time notification via Pusher
        await pusherServer.trigger(
            `conversation-${conversation.id}`,
            'new-message',
            newMessage
        )

        // Notify recipient about new message
        const recipient = conversation.participants.find(
            (p) => p.userId !== session.user.id
        )
        if (recipient) {
            await pusherServer.trigger(
                `user-${recipient.userId}`,
                'new-message',
                {
                    conversationId: conversation.id,
                    message: newMessage,
                }
            )
        }

        return NextResponse.json({
            conversation,
            message: newMessage,
        }, { status: 201 })
    } catch (error) {
        console.error('Create conversation/message error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

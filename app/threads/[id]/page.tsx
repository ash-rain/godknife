import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import ThreadPageClient from "./ThreadPageClient"

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()

    // Fetch thread with all related data
    const thread = await prisma.thread.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    image: true,
                    isBanned: true,
                }
            },
            forum: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                }
            },
            comments: {
                where: {
                    parentId: null,
                    status: 'ACTIVE'
                },
                orderBy: { createdAt: 'asc' },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                            image: true,
                            isBanned: true,
                        }
                    },
                    replies: {
                        where: { status: 'ACTIVE' },
                        orderBy: { createdAt: 'asc' },
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    username: true,
                                    name: true,
                                    image: true,
                                    isBanned: true,
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!thread) {
        notFound()
    }

    // Check if user is moderator
    let isModerator = false
    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isModerator: true, isAdmin: true }
        })
        isModerator = user?.isModerator || user?.isAdmin || false
    }

    // Increment view count (in background, don't await)
    prisma.thread.update({
        where: { id },
        data: { views: { increment: 1 } }
    }).catch(() => {})

    // Serialize dates for client component
    const serializedThread = {
        ...thread,
        createdAt: thread.createdAt.toISOString(),
        comments: thread.comments.map(comment => ({
            ...comment,
            createdAt: comment.createdAt.toISOString(),
            replies: comment.replies?.map(reply => ({
                ...reply,
                createdAt: reply.createdAt.toISOString(),
            })) || []
        }))
    }

    return (
        <ThreadPageClient
            thread={serializedThread}
            currentUserId={session?.user?.id}
            isModerator={isModerator}
        />
    )
}

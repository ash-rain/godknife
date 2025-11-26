import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import ThreadDetail from "@/components/ThreadDetail"

export default async function ThreadPage({ params }: { params: { id: string } }) {
    const thread = await prisma.thread.findUnique({
        where: { id: params.id },
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
            forum: true,
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

    // Increment view count
    await prisma.thread.update({
        where: { id: params.id },
        data: { views: { increment: 1 } }
    })

    const session = await auth()
    let isModerator = false

    if (session?.user) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isModerator: true, isAdmin: true }
        })
        isModerator = user?.isModerator || user?.isAdmin || false
    }

    // Convert dates to strings for the component
    const threadData = {
        ...thread,
        createdAt: thread.createdAt.toISOString(),
        comments: thread.comments.map(comment => ({
            ...comment,
            createdAt: comment.createdAt.toISOString(),
            replies: comment.replies?.map(reply => ({
                ...reply,
                createdAt: reply.createdAt.toISOString(),
            }))
        }))
    }

    return (
        <div className="container mx-auto p-6">
            <ThreadDetail
                thread={threadData}
                currentUserId={session?.user?.id}
                isModerator={isModerator}
            />
        </div>
    )
}

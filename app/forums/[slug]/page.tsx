import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import ForumPageClient from "./ForumPageClient"

export default async function ForumPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const forum = await prisma.forum.findUnique({
        where: { slug, isActive: true },
        include: {
            _count: {
                select: { threads: true }
            }
        }
    })

    if (!forum) {
        notFound()
    }

    const threads = await prisma.thread.findMany({
        where: {
            forumId: forum.id,
            status: { in: ['ACTIVE', 'LOCKED'] }
        },
        orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' }
        ],
        take: 50,
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    image: true,
                }
            },
            _count: {
                select: { comments: true }
            }
        }
    })

    const session = await auth()

    // Serialize dates for client component
    const serializedThreads = threads.map(thread => ({
        ...thread,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString()
    }))

    return (
        <ForumPageClient
            forum={forum}
            threads={serializedThreads}
            hasSession={!!session?.user}
        />
    )
}
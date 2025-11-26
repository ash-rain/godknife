import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import ThreadList from "@/components/ThreadList"
import { auth } from "@/lib/auth"

export default async function ForumPage({ params }: { params: { slug: string } }) {
    const forum = await prisma.forum.findUnique({
        where: { slug: params.slug, isActive: true },
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

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <a href="/forums" className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4 inline-block">
                    ← Back to Forums
                </a>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">{forum.name}</h1>
                        <p className="text-gray-600 dark:text-gray-400">{forum.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            {forum._count.threads} threads
                        </p>
                    </div>
                    {session?.user && (
                        <a
                            href={`/forums/${forum.slug}/new-thread`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            New Thread
                        </a>
                    )}
                </div>
            </div>

            <ThreadList threads={threads} forumSlug={forum.slug} />

            {!session?.user && (
                <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                        Sign in to create threads
                    </p>
                    <a
                        href="/auth/signin"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
                    >
                        Sign In
                    </a>
                </div>
            )}
        </div>
    )
}

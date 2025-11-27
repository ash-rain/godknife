import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { formatDistanceToNow } from 'date-fns'
import AdminThreadActions from '@/app/admin/forums/[slug]/threads/AdminThreadActions'

export default async function AdminForumThreadsPage({ 
    params 
}: { 
    params: Promise<{ slug: string }> 
}) {
    const { slug } = await params
    const session = await auth()

    if (!session?.user?.isAdmin) {
        redirect('/admin/forums')
    }

    const forum = await prisma.forum.findUnique({
        where: { slug }
    })

    if (!forum) {
        redirect('/admin/forums')
    }

    // Get all threads including deleted ones for admin
    const threads = await prisma.thread.findMany({
        where: {
            forumId: forum.id
        },
        orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' }
        ],
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                }
            },
            _count: {
                select: { comments: true }
            }
        }
    })

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <Link 
                    href="/admin/forums"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4 inline-block"
                >
                    ← Back to Forums
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">{forum.name} - Threads</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage all threads in this forum
                        </p>
                    </div>
                    <Link
                        href={`/forums/${forum.slug}`}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                        View Forum
                    </Link>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium">Thread</th>
                            <th className="text-left py-3 px-4 font-medium">Author</th>
                            <th className="text-left py-3 px-4 font-medium">Stats</th>
                            <th className="text-left py-3 px-4 font-medium">Status</th>
                            <th className="text-left py-3 px-4 font-medium">Created</th>
                            <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {threads.map((thread) => (
                            <tr key={thread.id} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-3 px-4">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            {thread.isPinned && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded">
                                                    Pinned
                                                </span>
                                            )}
                                            {thread.isLocked && (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 text-xs rounded">
                                                    Locked
                                                </span>
                                            )}
                                            <Link
                                                href={`/threads/${thread.id}`}
                                                className="font-medium hover:text-blue-600 dark:hover:text-blue-400"
                                            >
                                                {thread.title}
                                            </Link>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                    {thread.author.username || thread.author.name}
                                </td>
                                <td className="py-3 px-4 text-sm">
                                    <div className="flex flex-col gap-1">
                                        <span>{thread.views} views</span>
                                        <span>{thread._count.comments} comments</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        thread.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                        thread.status === 'LOCKED' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' :
                                        thread.status === 'FLAGGED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                    }`}>
                                        {thread.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                    {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                                </td>
                                <td className="py-3 px-4">
                                    <AdminThreadActions 
                                        threadId={thread.id}
                                        isPinned={thread.isPinned}
                                        isLocked={thread.isLocked}
                                        status={thread.status}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {threads.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No threads found in this forum yet.
                    </div>
                )}
            </div>
        </div>
    )
}

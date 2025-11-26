'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface Thread {
    id: string
    title: string
    isPinned: boolean
    isLocked: boolean
    status: string
    views: number
    createdAt: string
    author: {
        id: string
        username: string
        name: string
        image?: string
    }
    _count: {
        comments: number
    }
}

interface ThreadListProps {
    threads: Thread[]
    forumSlug: string
}

export default function ThreadList({ threads, forumSlug }: ThreadListProps) {
    const router = useRouter()

    return (
        <div className="space-y-2">
            {threads.map((thread) => (
                <div
                    key={thread.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition cursor-pointer border border-gray-200 dark:border-gray-700"
                    onClick={() => router.push(`/threads/${thread.id}`)}
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                {thread.isPinned && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded">
                                        Pinned
                                    </span>
                                )}
                                {thread.isLocked && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 text-xs rounded">
                                        Locked
                                    </span>
                                )}
                                <h3 className="text-lg font-semibold">{thread.title}</h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>by {thread.author.username || thread.author.name}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-500">
                            <div className="text-center">
                                <div className="font-semibold">{thread._count.comments}</div>
                                <div className="text-xs">replies</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold">{thread.views}</div>
                                <div className="text-xs">views</div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {threads.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No threads yet. Be the first to start a discussion!
                </div>
            )}
        </div>
    )
}

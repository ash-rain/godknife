'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from './LanguageProvider'

interface Forum {
    id: string
    name: string
    slug: string
    description: string
    icon?: string
    color?: string
    _count: {
        threads: number
    }
    threads: Array<{
        id: string
        title: string
        createdAt: string
        author: {
            id: string
            username: string
            name: string
            image?: string
        }
    }>
}

interface ForumListProps {
    initialForums: Forum[]
}

export default function ForumList({ initialForums }: ForumListProps) {
    const router = useRouter()
    const { t } = useLanguage()
    const [forums] = useState<Forum[]>(initialForums)

    return (
        <div className="space-y-4">
            {forums.map((forum) => (
                <div
                    key={forum.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
                    onClick={() => router.push(`/forums/${forum.slug}`)}
                >
                    <div className="flex items-start gap-4">
                        {forum.icon && (
                            <div
                                className="text-4xl w-16 h-16 flex items-center justify-center rounded-lg"
                                style={{ backgroundColor: forum.color || '#e5e7eb' }}
                            >
                                {forum.icon}
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-semibold">{forum.name}</h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/forums/${forum.slug}/new-thread`)
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                                >
                                    {t('forum.newThread')}
                                </button>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">{forum.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                                <span>{forum._count.threads} {t('forum.threads').toLowerCase()}</span>
                                {forum.threads[0] && (
                                    <span className="flex items-center gap-2">
                                        <span>{t('forum.latestThread')}</span>
                                        <span className="font-medium">{forum.threads[0].title}</span>
                                        <span>{t('forum.by')} {forum.threads[0].author.username || forum.threads[0].author.name}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {forums.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    {t('forum.noThreads')}
                </div>
            )}
        </div>
    )
}

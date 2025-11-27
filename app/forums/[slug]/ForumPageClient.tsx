'use client'

import { useLanguage } from '@/components/LanguageProvider'
import Navigation from '@/components/Navigation'
import ThreadList from '@/components/ThreadList'

interface Forum {
    id: string
    name: string
    slug: string
    description: string
    _count: {
        threads: number
    }
}

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
        username: string | null
        name: string | null
        image: string | null
    }
    _count: {
        comments: number
    }
}

interface ForumPageClientProps {
    forum: Forum
    threads: Thread[]
    hasSession: boolean
}

export default function ForumPageClient({ forum, threads, hasSession }: ForumPageClientProps) {
    const { t } = useLanguage()

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <a
                        href="/forums"
                        className="text-blue-600 hover:underline text-sm mb-4 inline-block"
                    >
                        ← {t('forum.backToForums')}
                    </a>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold mb-2 text-gray-900">
                                {forum.name}
                            </h1>
                            <p className="text-gray-600">{forum.description}</p>
                            <p className="text-sm text-gray-500 mt-2">
                                {forum._count.threads} {t('forum.threads').toLowerCase()}
                            </p>
                        </div>
                        {hasSession && (
                            <a
                                href={`/forums/${forum.slug}/new-thread`}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                {t('forum.newThread')}
                            </a>
                        )}
                    </div>
                </div>

                <ThreadList threads={threads} forumSlug={forum.slug} />

                {!hasSession && (
                    <div className="mt-8 bg-gray-100 rounded-lg p-4 text-center">
                        <p className="text-gray-600 mb-3">
                            {t('forum.signInToCreateThreads')}
                        </p>
                        <a
                            href="/auth/signin"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
                        >
                            {t('common.login')}
                        </a>
                    </div>
                )}
            </main>
        </div>
    )
}

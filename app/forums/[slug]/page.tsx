'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import Navigation from '@/components/Navigation'
import ThreadList from '@/components/ThreadList'
import { useRouter } from 'next/navigation'

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

export default function ForumPage({ params }: { params: { slug: string } }) {
    const router = useRouter()
    const { data: session } = useSession()
    const { t } = useLanguage()
    const [forum, setForum] = useState<Forum | null>(null)
    const [threads, setThreads] = useState<Thread[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchForumData()
    }, [params.slug])

    const fetchForumData = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/forums/${params.slug}`)
            if (!response.ok) {
                throw new Error('Forum not found')
            }
            const data = await response.json()
            setForum(data.forum)
            setThreads(data.forum.threads || [])
        } catch (error) {
            console.error('Error fetching forum:', error)
            router.push('/forums')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                    </div>
                ) : forum ? (
                    <>
                        <div className="mb-8">
                            <a 
                                href="/forums" 
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4 inline-block"
                            >
                                ← {t('forum.backToForums')}
                            </a>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                                        {forum.name}
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-400">{forum.description}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                                        {forum._count.threads} {t('forum.threads').toLowerCase()}
                                    </p>
                                </div>
                                {session?.user && (
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

                        {!session?.user && (
                            <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
                                <p className="text-gray-600 dark:text-gray-400 mb-3">
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
                    </>
                ) : null}
            </main>
        </div>
    )
}

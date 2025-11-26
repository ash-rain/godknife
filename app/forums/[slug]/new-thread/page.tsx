'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import Navigation from '@/components/Navigation'

interface Forum {
    id: string
    name: string
    slug: string
    description: string
}

export default function NewThreadPage({ params }: { params: { slug: string } }) {
    const router = useRouter()
    const { data: session, status } = useSession()
    const { t } = useLanguage()
    const [forum, setForum] = useState<Forum | null>(null)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push(`/auth/signin?callbackUrl=/forums/${params.slug}/new-thread`)
            return
        }

        if (status === 'authenticated') {
            fetchForum()
        }
    }, [status, params.slug])

    const fetchForum = async () => {
        try {
            const response = await fetch(`/api/forums/${params.slug}`)
            if (!response.ok) {
                throw new Error('Forum not found')
            }
            const data = await response.json()
            setForum(data.forum)
        } catch (error) {
            console.error('Error fetching forum:', error)
            router.push('/forums')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required')
            return
        }

        try {
            setSubmitting(true)
            setError('')

            const response = await fetch(`/api/forums/${params.slug}/threads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create thread')
            }

            router.push(`/threads/${data.thread.id}`)
        } catch (error: any) {
            setError(error.message || 'Failed to create thread')
        } finally {
            setSubmitting(false)
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navigation />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                    </div>
                </main>
            </div>
        )
    }

    if (!forum) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6">
                        <a 
                            href={`/forums/${forum.slug}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                            ← {t('forum.backToForum')} {forum.name}
                        </a>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                            {t('forum.createThread')}
                        </h1>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-red-800 dark:text-red-200">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label 
                                    htmlFor="title"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    {t('forum.threadTitle')}
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('forum.threadTitle')}
                                    required
                                    disabled={submitting}
                                />
                            </div>

                            <div>
                                <label 
                                    htmlFor="content"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    {t('forum.threadContent')}
                                </label>
                                <textarea
                                    id="content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('forum.threadContent')}
                                    rows={10}
                                    required
                                    disabled={submitting}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting || !title.trim() || !content.trim()}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                                >
                                    {submitting ? t('forum.posting') : t('forum.postThread')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    disabled={submitting}
                                    className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50 transition"
                                >
                                    {t('forum.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    )
}

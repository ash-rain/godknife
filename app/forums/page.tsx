'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import Navigation from '@/components/Navigation'
import ForumList from '@/components/ForumList'

interface Forum {
    id: string
    name: string
    slug: string
    description: string
    icon: string
    color: string
    _count: {
        threads: number
    }
    threads: Array<{
        id: string
        title: string
        createdAt: string
        author: {
            id: string
            username: string | null
            name: string | null
            image: string | null
        }
    }>
}

export default function ForumsPage() {
    const { t } = useLanguage()
    const [forums, setForums] = useState<Forum[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchForums()
    }, [])

    const fetchForums = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/forums')
            const data = await response.json()
            setForums(data.forums || [])
        } catch (error) {
            console.error('Error fetching forums:', error)
            setForums([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100">
                    {t('forum.forums')}
                </h1>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                    </div>
                ) : (
                    <ForumList initialForums={forums} />
                )}
            </main>
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import Navigation from '@/components/Navigation'
import ThreadDetail from '@/components/ThreadDetail'

interface ThreadData {
    id: string
    title: string
    content: string
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
        isBanned: boolean
    }
    forum: {
        id: string
        name: string
        slug: string
    }
    comments: any[]
}

export default function ThreadPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { data: session } = useSession()
    const { t } = useLanguage()
    const [thread, setThread] = useState<ThreadData | null>(null)
    const [isModerator, setIsModerator] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchThread()
    }, [params.id])

    const fetchThread = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/threads/${params.id}`)
            if (!response.ok) {
                throw new Error('Thread not found')
            }
            const data = await response.json()
            setThread(data.thread)
            setIsModerator(data.isModerator || false)
        } catch (error) {
            console.error('Error fetching thread:', error)
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
                ) : thread ? (
                    <ThreadDetail
                        thread={thread}
                        currentUserId={session?.user?.id}
                        isModerator={isModerator}
                    />
                ) : null}
            </main>
        </div>
    )
}

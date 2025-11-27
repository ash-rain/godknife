'use client'

import { useLanguage } from '@/components/LanguageProvider'
import Navigation from '@/components/Navigation'
import ThreadDetail from '@/components/ThreadDetail'

interface Author {
    id: string
    username: string | null
    name: string | null
    image: string | null
    isBanned: boolean
}

interface Comment {
    id: string
    content: string
    createdAt: string
    status: string
    author: Author
    replies?: Comment[]
}

interface ThreadData {
    id: string
    title: string
    content: string
    isPinned: boolean
    isLocked: boolean
    status: string
    views: number
    createdAt: string
    author: Author
    forum: {
        id: string
        name: string
        slug: string
    }
    comments: Comment[]
}

interface ThreadPageClientProps {
    thread: ThreadData
    currentUserId?: string
    isModerator: boolean
}

export default function ThreadPageClient({ thread, currentUserId, isModerator }: ThreadPageClientProps) {
    const { t } = useLanguage()

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ThreadDetail
                    thread={thread}
                    currentUserId={currentUserId}
                    isModerator={isModerator}
                />
            </main>
        </div>
    )
}

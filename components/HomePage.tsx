'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import Navigation from '@/components/Navigation'
import PostCard from '@/components/PostCard'
import PostCreateModal from '@/components/PostCreateModal'

interface Post {
    id: string
    title: string
    description: string
    images: string[]
    price?: number
    createdAt: string
    _count: {
        likes: number
        comments: number
    }
}

export default function HomePage() {
    const { data: session } = useSession()
    const { t } = useLanguage()
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [sort, setSort] = useState<'newest' | 'hottest' | 'boosted'>('boosted')
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        fetchPosts()
    }, [sort])

    const fetchPosts = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/posts?sort=${sort}`)
            const data = await response.json()
            setPosts(data.posts)
        } catch (error) {
            console.error('Error fetching posts:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {t('common.appName')}
                    </h1>

                    {session && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            {t('post.createPost')}
                        </button>
                    )}
                </div>

                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setSort('boosted')}
                        className={`px-4 py-2 rounded-lg ${sort === 'boosted'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {t('post.boosted')}
                    </button>
                    <button
                        onClick={() => setSort('newest')}
                        className={`px-4 py-2 rounded-lg ${sort === 'newest'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {t('nav.home')}
                    </button>
                    <button
                        onClick={() => setSort('hottest')}
                        className={`px-4 py-2 rounded-lg ${sort === 'hottest'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        🔥 Hottest
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">{t('common.loading')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}

                {posts.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500">
                        No posts yet. Be the first to post!
                    </div>
                )}
            </main>

            {showCreateModal && (
                <PostCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false)
                        fetchPosts()
                    }}
                />
            )}
        </div>
    )
}

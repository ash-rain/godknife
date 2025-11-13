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
            setPosts(data.posts || [])
        } catch (error) {
            console.error('Error fetching posts:', error)
            setPosts([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation onCreatePost={() => setShowCreateModal(true)} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    <div className="text-center py-16">
                        <div className="mb-4">
                            <svg
                                className="mx-auto h-24 w-24 text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            {t('post.noPosts')}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {t('post.noPostsDescription')}
                        </p>
                        {session && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                {t('post.createPost')}
                            </button>
                        )}
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

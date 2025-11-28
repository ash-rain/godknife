'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import Navigation from '@/components/Navigation'
import PostCard from '@/components/PostCard'
import PostCreateModal from '@/components/PostCreateModal'
import Link from 'next/link'

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

interface HeroContent {
    title: string
    subtitle: string
}

interface Category {
    id: string
    nameEn: string
    nameBg: string
    slug: string
}

export default function HomePage() {
    const { data: session } = useSession()
    const { t, locale } = useLanguage()
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [sort, setSort] = useState<'newest' | 'hottest' | 'boosted'>('boosted')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [heroContent, setHeroContent] = useState<HeroContent | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')

    useEffect(() => {
        fetchHeroContent()
        fetchCategories()
        fetchPosts()
    }, [sort, locale])

    const fetchHeroContent = async () => {
        try {
            const response = await fetch('/api/pages/hero')
            if (response.ok) {
                const data = await response.json()
                const page = data.page
                setHeroContent({
                    title: locale === 'en' ? page.titleEn : page.titleBg,
                    subtitle: locale === 'en' ? page.contentEn : page.contentBg
                })
            }
        } catch (error) {
            console.error('Error fetching hero content:', error)
        }
    }

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories')
            if (response.ok) {
                const data = await response.json()
                setCategories(data.categories)
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams()
        if (searchQuery) params.append('q', searchQuery)
        if (selectedCategory) params.append('category', selectedCategory)
        window.location.href = `/search?${params.toString()}`
    }

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

            {/* Hero Section */}
            <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            {heroContent?.title || t('pages.hero.title')}
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
                            {heroContent?.subtitle || t('pages.hero.subtitle')}
                        </p>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="max-w-4xl mx-auto mb-8">
                            <div className="flex flex-col sm:flex-row gap-3 bg-white rounded-lg p-2 shadow-lg">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-4 py-3 text-gray-700 border-0 sm:border-r rounded-lg sm:rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">{t('search.allCategories')}</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {locale === 'en' ? cat.nameEn : cat.nameBg}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('search.searchPlaceholder')}
                                    className="flex-1 px-4 py-3 text-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    {t('common.search')}
                                </button>
                            </div>
                        </form>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="#posts"
                                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
                            >
                                {t('pages.hero.browseKnives')}
                            </Link>
                            {session && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition border-2 border-white"
                                >
                                    {t('pages.hero.sellYourKnife')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <main id="posts" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setSort('boosted')}
                        className={`px-4 py-2 rounded-lg ${sort === 'boosted'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {t('home.boosted')}
                    </button>
                    <button
                        onClick={() => setSort('newest')}
                        className={`px-4 py-2 rounded-lg ${sort === 'newest'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {t('home.newest')}
                    </button>
                    <button
                        onClick={() => setSort('hottest')}
                        className={`px-4 py-2 rounded-lg ${sort === 'hottest'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        🔥 {t('home.hottest')}
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

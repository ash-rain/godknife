'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import { usePostCreate } from '@/components/PostCreateProvider'
import Navigation from '@/components/Navigation'
import PostCard from '@/components/PostCard'

interface Post {
    id: string
    title: string
    description: string
    images: string[]
    price?: number
    category?: {
        id: string
        nameEn: string
        nameBg: string
        slug: string
    }
    subcategory?: {
        id: string
        nameEn: string
        nameBg: string
        slug: string
    }
    _count: {
        likes: number
        comments: number
    }
}

interface Subcategory {
    id: string
    nameEn: string
    nameBg: string
    slug: string
    categoryId: string
}

interface Category {
    id: string
    nameEn: string
    nameBg: string
    slug: string
    subcategories?: Subcategory[]
}

function SearchResults() {
    const searchParams = useSearchParams()
    const { t, locale } = useLanguage()
    const { setOnPostCreated } = usePostCreate()
    const [posts, setPosts] = useState<Post[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)

    const search = searchParams.get('q') || ''
    const categoryId = searchParams.get('category') || ''
    const subcategoryId = searchParams.get('subcategory') || ''
    const sort = searchParams.get('sort') || 'newest'

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchPosts()
    }, [search, categoryId, subcategoryId, sort])

    // Set up post creation callback for this page
    useEffect(() => {
        setOnPostCreated(() => fetchPosts)
        return () => setOnPostCreated(undefined)
    }, [])

    // Set up post creation callback for this page
    useEffect(() => {
        setOnPostCreated(() => fetchPosts)
        return () => setOnPostCreated(undefined)
    }, [])

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

    const fetchPosts = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (search) params.append('search', search)
            if (categoryId) params.append('categoryId', categoryId)
            if (subcategoryId) params.append('subcategoryId', subcategoryId)
            params.append('sort', sort)

            const response = await fetch(`/api/posts?${params}`)
            const data = await response.json()
            setPosts(data.posts || [])
        } catch (error) {
            console.error('Error fetching posts:', error)
            setPosts([])
        } finally {
            setLoading(false)
        }
    }

    const selectedCategory = categories.find(c => c.id === categoryId)
    const selectedSubcategory = selectedCategory?.subcategories?.find(s => s.id === subcategoryId)

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">
                        {t('search.searchResults')}
                    </h1>
                    <div className="flex flex-wrap gap-2 items-center text-gray-600">
                        {search && (
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                {t('search.query')}: "{search}"
                            </span>
                        )}
                        {selectedCategory && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                {locale === 'en' ? selectedCategory.nameEn : selectedCategory.nameBg}
                            </span>
                        )}
                        {selectedSubcategory && (
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                {locale === 'en' ? selectedSubcategory.nameEn : selectedSubcategory.nameBg}
                            </span>
                        )}
                    </div>
                </div>

                {/* Sort Options */}
                <div className="flex gap-4 mb-6">
                    <a
                        href={`/search?q=${search}&category=${categoryId}&subcategory=${subcategoryId}&sort=newest`}
                        className={`px-4 py-2 rounded-lg ${sort === 'newest'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {t('home.newest')}
                    </a>
                    <a
                        href={`/search?q=${search}&category=${categoryId}&subcategory=${subcategoryId}&sort=hottest`}
                        className={`px-4 py-2 rounded-lg ${sort === 'hottest'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        🔥 {t('home.hottest')}
                    </a>
                    <a
                        href={`/search?q=${search}&category=${categoryId}&subcategory=${subcategoryId}&sort=boosted`}
                        className={`px-4 py-2 rounded-lg ${sort === 'boosted'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {t('home.boosted')}
                    </a>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">{t('common.loading')}</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-gray-600">
                            {posts.length} {t('search.resultsFound')}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </>
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
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            {t('search.noResults')}
                        </h3>
                        <p className="text-gray-500">
                            {t('search.tryDifferentSearch')}
                        </p>
                    </div>
                )}
            </main>
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <SearchResults />
        </Suspense>
    )
}

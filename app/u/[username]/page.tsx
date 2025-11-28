'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import PostCard from '@/components/PostCard'
import { useLanguage } from '@/components/LanguageProvider'
import { MapPin, Globe, Calendar, Edit2 } from 'lucide-react'
import { getImageUrl } from '@/lib/image-utils'

interface User {
    id: string
    name: string | null
    username: string | null
    image: string | null
    bio: string | null
    location: string | null
    website: string | null
    coverImage: string | null
    createdAt: string
    _count: {
        posts: number
    }
}

interface Post {
    id: string
    title: string
    description: string
    images: string[]
    price?: number
    isBoosted?: boolean
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

export default function UserProfilePage() {
    const params = useParams()
    const username = params.username as string
    const { data: session } = useSession()
    const { t, locale } = useLanguage()
    const [user, setUser] = useState<User | null>(null)
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'gallery' | 'marketplace'>('gallery')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loadingPosts, setLoadingPosts] = useState(false)

    const isOwnProfile = session?.user?.username === username

    useEffect(() => {
        fetchUser()
    }, [username])

    useEffect(() => {
        fetchPosts()
    }, [username, activeTab, page])

    const fetchUser = async () => {
        try {
            const response = await fetch(`/api/users/${username}`)
            if (response.ok) {
                const data = await response.json()
                setUser(data)
            } else {
                console.error('Failed to fetch user')
            }
        } catch (error) {
            console.error('Error fetching user:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchPosts = async () => {
        setLoadingPosts(true)
        try {
            const response = await fetch(
                `/api/users/${username}/posts?type=${activeTab}&page=${page}&limit=12`
            )
            if (response.ok) {
                const data = await response.json()
                setPosts(data.posts)
                setTotalPages(data.pagination.totalPages)
            }
        } catch (error) {
            console.error('Error fetching posts:', error)
        } finally {
            setLoadingPosts(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
        }).format(date)
    }

    if (loading) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-gray-600">{t('common.loading')}</div>
                </div>
            </>
        )
    }

    if (!user) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            {t('errors.notFound')}
                        </h1>
                        <p className="text-gray-600">User not found</p>
                    </div>
                </div>
            </>
        )
    }

    const coverImageUrl = user.coverImage
        ? getImageUrl(user.coverImage, 'large')
        : null
    const profileImageUrl = user.image || '/placeholder-user.jpg'

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-gray-50">
                {/* Cover Image */}
                <div
                    className="h-64 bg-linear-to-r from-blue-500 to-purple-600"
                    style={
                        coverImageUrl
                            ? {
                                backgroundImage: `url(${coverImageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }
                            : undefined
                    }
                />

                {/* Profile Header */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="-mt-16 sm:-mt-24 mb-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
                            {/* Profile Image */}
                            <div className="relative">
                                <img
                                    src={profileImageUrl}
                                    alt={user.name || user.username || 'User'}
                                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-xl object-cover bg-white"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = '/placeholder-user.jpg'
                                    }}
                                />
                            </div>

                            {/* User Info */}
                            <div className="flex-1 pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                            {user.name || user.username}
                                        </h1>
                                        {user.name && user.username && (
                                            <p className="text-white text-shadow-lg text-lg">
                                                @{user.username}
                                            </p>
                                        )}
                                    </div>

                                    {isOwnProfile && (
                                        <Link
                                            href={`/u/${username}/edit`}
                                            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                                        >
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            {t('profile.editProfile')}
                                        </Link>
                                    )}
                                </div>

                                {/* User Details */}
                                <div className="mt-4 space-y-2">
                                    {user.bio && (
                                        <p className="text-gray-700">{user.bio}</p>
                                    )}

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                        {user.location && (
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                {user.location}
                                            </div>
                                        )}
                                        {user.website && (
                                            <a
                                                href={user.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center hover:text-blue-600 transition"
                                            >
                                                <Globe className="w-4 h-4 mr-1" />
                                                {user.website.replace(
                                                    /^https?:\/\//,
                                                    ''
                                                )}
                                            </a>
                                        )}
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {t('profile.joinedOn')}{' '}
                                            {formatDate(user.createdAt)}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 text-sm">
                                        <div>
                                            <span className="font-bold text-gray-900">
                                                {user._count.posts}
                                            </span>{' '}
                                            <span className="text-gray-600">
                                                {t('profile.posts')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-8">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => {
                                    setActiveTab('gallery')
                                    setPage(1)
                                }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'gallery'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {t('profile.gallery')}
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('marketplace')
                                    setPage(1)
                                }}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'marketplace'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {t('profile.marketplace')}
                            </button>
                        </nav>
                    </div>

                    {/* Posts Grid */}
                    {loadingPosts ? (
                        <div className="flex justify-center py-12">
                            <div className="text-gray-600">{t('common.loading')}</div>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600">
                                {activeTab === 'gallery'
                                    ? t('profile.noGalleryPosts')
                                    : t('profile.noMarketplacePosts')}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                                {posts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2 pb-12">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-4 py-2">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setPage((p) => Math.min(totalPages, p + 1))
                                        }
                                        disabled={page === totalPages}
                                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

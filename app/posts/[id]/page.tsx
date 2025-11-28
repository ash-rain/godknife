'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getImageUrl } from '@/lib/image-utils'
import { Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

interface Post {
    id: string
    title: string
    description: string
    images: string[]
    price?: number
    isBoosted?: boolean
    views: number
    authorId: string
    createdAt: string
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
    author: {
        id: string
        name: string
        username: string
        image?: string
    }
    _count: {
        likes: number
        comments: number
    }
}

interface Comment {
    id: string
    content: string
    createdAt: string
    user: {
        id: string
        name: string
        username: string
        image?: string
    }
}

export default function PostDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const { t, locale } = useLanguage()

    const [post, setPost] = useState<Post | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [liked, setLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)
    const [commentContent, setCommentContent] = useState('')
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [submittingComment, setSubmittingComment] = useState(false)
    const [startingChat, setStartingChat] = useState(false)

    useEffect(() => {
        fetchPost()
        fetchComments()
        fetchLikeStatus()
    }, [params.id])

    const fetchPost = async () => {
        try {
            const res = await fetch(`/api/posts/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                setPost(data)
                setLikeCount(data._count.likes)
            } else {
                console.error('Failed to fetch post')
            }
        } catch (error) {
            console.error('Error fetching post:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/posts/${params.id}/comments`)
            if (res.ok) {
                const data = await res.json()
                setComments(data)
            }
        } catch (error) {
            console.error('Error fetching comments:', error)
        }
    }

    const fetchLikeStatus = async () => {
        if (!session) return

        try {
            const res = await fetch(`/api/posts/${params.id}/like`)
            if (res.ok) {
                const data = await res.json()
                setLiked(data.liked)
            }
        } catch (error) {
            console.error('Error fetching like status:', error)
        }
    }

    const handleLike = async () => {
        if (!session) {
            router.push('/auth/signin')
            return
        }

        try {
            const res = await fetch(`/api/posts/${params.id}/like`, {
                method: 'POST',
            })
            if (res.ok) {
                const data = await res.json()
                setLiked(data.liked)
                setLikeCount(prev => data.liked ? prev + 1 : prev - 1)
            }
        } catch (error) {
            console.error('Error toggling like:', error)
        }
    }

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!session) {
            router.push('/auth/signin')
            return
        }

        if (!commentContent.trim()) return

        setSubmittingComment(true)
        try {
            const res = await fetch(`/api/posts/${params.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: commentContent }),
            })

            if (res.ok) {
                const newComment = await res.json()
                setComments([newComment, ...comments])
                setCommentContent('')
            }
        } catch (error) {
            console.error('Error posting comment:', error)
        } finally {
            setSubmittingComment(false)
        }
    }

    const handleShare = async () => {
        const url = window.location.href
        try {
            if (navigator.share) {
                await navigator.share({
                    title: post?.title,
                    text: post?.description,
                    url: url,
                })
            } else {
                await navigator.clipboard.writeText(url)
                alert('Link copied to clipboard!')
            }
        } catch (error) {
            console.error('Error sharing:', error)
        }
    }

    const handleStartChat = async () => {
        if (!session) {
            router.push('/auth/signin')
            return
        }

        if (!post || post.author.id === session.user.id) {
            return
        }

        setStartingChat(true)
        try {
            const postUrl = window.location.href
            const message = `${t('post.chatAboutPost')} ${postUrl}`

            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipientId: post.author.id,
                    postId: post.id,
                    message: message,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                router.push('/messages')
            } else {
                console.error('Failed to start chat')
            }
        } catch (error) {
            console.error('Error starting chat:', error)
        } finally {
            setStartingChat(false)
        }
    }

    const nextImage = () => {
        if (post && post.images.length > 1) {
            setCurrentImageIndex((prev) => (prev + 1) % post.images.length)
        }
    }

    const prevImage = () => {
        if (post && post.images.length > 1) {
            setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length)
        }
    }

    if (loading) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-xl">{t('common.loading')}</div>
                </div>
            </>
        )
    }

    if (!post) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-xl">{t('errors.notFound')}</div>
                </div>
            </>
        )
    }

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Images Section */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            {post.isBoosted && (
                                <div className="bg-linear-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1">
                                    ⭐ {t('post.boosted')}
                                </div>
                            )}

                            <div className="relative aspect-square bg-gray-100">
                                <img
                                    src={getImageUrl(post.images[currentImageIndex], 'large')}
                                    alt={post.title}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = '/placeholder.jpg'
                                    }}
                                />

                                {post.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                                        >
                                            <ChevronLeft className="h-6 w-6" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </button>

                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                            {post.images.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentImageIndex(index)}
                                                    className={`w-2 h-2 rounded-full ${index === currentImageIndex
                                                        ? 'bg-white'
                                                        : 'bg-white/50'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Thumbnail Gallery */}
                            {post.images.length > 1 && (
                                <div className="p-4 flex gap-2 overflow-x-auto">
                                    {post.images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${index === currentImageIndex
                                                ? 'border-blue-600'
                                                : 'border-gray-200'
                                                }`}
                                        >
                                            <img
                                                src={getImageUrl(image, 'thumb')}
                                                alt={`${post.title} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.src = '/placeholder.jpg'
                                                }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                {(post.category || post.subcategory) && (
                                    <div className="mb-4 flex flex-wrap gap-2">
                                        {post.category && (
                                            <Link
                                                href={`/search?category=${post.category.id}`}
                                                className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-200 transition"
                                            >
                                                {locale === 'en' ? post.category.nameEn : post.category.nameBg}
                                            </Link>
                                        )}
                                        {post.subcategory && (
                                            <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                                                {locale === 'en' ? post.subcategory.nameEn : post.subcategory.nameBg}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

                                {post.price && (
                                    <div className="text-3xl font-bold text-blue-600 mb-4">
                                        €{post.price.toFixed(2)}
                                    </div>
                                )}

                                <p className="text-gray-700 mb-6 whitespace-pre-wrap">
                                    {post.description}
                                </p>

                                <div className="flex items-center justify-between border-t border-b py-4 mb-4">
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={handleLike}
                                            className="flex items-center gap-2 hover:text-red-600 transition"
                                        >
                                            <Heart
                                                className={`h-6 w-6 ${liked ? 'fill-red-600 text-red-600' : ''
                                                    }`}
                                            />
                                            <span className="font-semibold">{likeCount}</span>
                                        </button>

                                        <div className="flex items-center gap-2 text-gray-600">
                                            <MessageCircle className="h-6 w-6" />
                                            <span className="font-semibold">{comments.length}</span>
                                        </div>

                                        <button
                                            onClick={handleShare}
                                            className="flex items-center gap-2 hover:text-blue-600 transition"
                                        >
                                            <Share2 className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="text-gray-500 text-sm">
                                        {post.views} {t('post.views')}
                                    </div>
                                </div>

                                {/* Author Info and Chat Button */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between">
                                        {post.author.username ? (
                                            <Link
                                                href={`/users/${post.author.username}`}
                                                className="flex items-center gap-3 hover:opacity-80 transition"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                                    {post.author.image ? (
                                                        <img
                                                            src={post.author.image}
                                                            alt={post.author.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-lg">
                                                            {post.author.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{post.author.name}</div>
                                                    <div className="text-gray-500 text-sm">@{post.author.username}</div>
                                                </div>
                                            </Link>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                                    {post.author.image ? (
                                                        <img
                                                            src={post.author.image}
                                                            alt={post.author.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-lg">
                                                            {post.author.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{post.author.name}</div>
                                                    <div className="text-gray-500 text-sm">No username</div>
                                                </div>
                                            </div>
                                        )}

                                        {session && session.user.id !== post.author.id && (
                                            <button
                                                onClick={handleStartChat}
                                                disabled={startingChat}
                                                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                                <Send className="h-5 w-5" />
                                                {startingChat ? t('common.loading') : t('post.startChat')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {post.price && (
                                    <button
                                        onClick={handleStartChat}
                                        disabled={!session || session.user.id === post.author.id || startingChat}
                                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        {!session ? t('common.login') : startingChat ? t('common.loading') : t('post.contactSeller')}
                                    </button>
                                )}
                            </div>

                            {/* Comments Section */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-bold mb-4">
                                    {t('post.comments')} ({comments.length})
                                </h2>

                                {/* Comment Form */}
                                <form onSubmit={handleComment} className="mb-6">
                                    <textarea
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        placeholder={t('post.addComment')}
                                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        disabled={!session}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!session || !commentContent.trim() || submittingComment}
                                        className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        {submittingComment ? t('common.loading') : t('post.comment')}
                                    </button>
                                    {!session && (
                                        <p className="mt-2 text-sm text-gray-500">
                                            <Link href="/auth/signin" className="text-blue-600 hover:underline">
                                                {t('common.login')}
                                            </Link>
                                            {' '}{t('post.addComment')}
                                        </p>
                                    )}
                                </form>

                                {/* Comments List */}
                                <div className="space-y-4">
                                    {comments.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">
                                            {t('post.noComments')}
                                        </p>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment.id} className="border-b pb-4 last:border-b-0">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                                                        {comment.user.image ? (
                                                            <img
                                                                src={comment.user.image}
                                                                alt={comment.user.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
                                                                {comment.user.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold">
                                                                {comment.user.name}
                                                            </span>
                                                            {comment.user.username ? (
                                                                <Link
                                                                    href={`/users/${comment.user.username}`}
                                                                    className="text-gray-500 text-sm hover:text-blue-600 hover:underline"
                                                                >
                                                                    @{comment.user.username}
                                                                </Link>
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">
                                                                    (no username)
                                                                </span>
                                                            )}
                                                            <span className="text-gray-400 text-sm">
                                                                {new Date(comment.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-700 whitespace-pre-wrap">
                                                            {comment.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

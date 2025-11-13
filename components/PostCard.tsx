'use client'

import Link from 'next/link'
import { getImageUrl } from '@/lib/image-utils'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { useLanguage } from './LanguageProvider'

interface Post {
    id: string
    title: string
    description: string
    images: string[]
    price?: number
    isBoosted?: boolean
    _count: {
        likes: number
        comments: number
    }
}

interface PostCardProps {
    post: Post
}

export default function PostCard({ post }: PostCardProps) {
    const { t, language } = useLanguage()
    const imageUrl = post.images[0] ? getImageUrl(post.images[0], 'medium') : '/placeholder.jpg'

    return (
        <Link href={`/posts/${post.id}`}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer">
                {post.isBoosted && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1">
                        ⭐ {t('post.boosted')}
                    </div>
                )}

                <div className="aspect-square relative">
                    <img
                        src={imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {post.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {post.description}
                    </p>

                    {post.price && (
                        <div className="text-xl font-bold text-blue-600 mb-3">
                            €{post.price.toFixed(2)}
                        </div>
                    )}

                    <div className="flex items-center justify-between text-gray-500 text-sm">
                        <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                                <Heart className="h-4 w-4 mr-1" />
                                {post._count.likes}
                            </span>
                            <span className="flex items-center">
                                <MessageCircle className="h-4 w-4 mr-1" />
                                {post._count.comments}
                            </span>
                        </div>
                        <button className="hover:text-blue-600">
                            <Share2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    )
}

'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useLanguage } from './LanguageProvider'
import { usePostCreate } from './PostCreateProvider'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Menu, X, MessageSquare, User, Settings, LogOut, Home, Plus, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/usePusher'

export default function Navigation() {
    const { data: session } = useSession()
    const { t, language, setLanguage } = useLanguage()
    const { openModal } = usePostCreate()
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [profileMenuOpen, setProfileMenuOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch unread conversations count
    const fetchUnreadCount = useCallback(async () => {
        if (session?.user?.id) {
            try {
                const response = await fetch('/api/conversations/unread')
                if (response.ok) {
                    const data = await response.json()
                    setUnreadCount(data.count || 0)
                }
            } catch (error) {
                console.error('Failed to fetch unread count:', error)
            }
        }
    }, [session?.user?.id])

    useEffect(() => {
        fetchUnreadCount()
    }, [fetchUnreadCount])

    // Real-time updates via Pusher
    useNotifications({
        onNewMessage: fetchUnreadCount,
    })

    const handleCreatePost = () => {
        if (!session) {
            router.push('/auth/signin')
        } else {
            openModal()
        }
    }

    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex items-center">
                            <span className="text-2xl font-bold text-blue-600">
                                {t('common.appName')}
                            </span>
                        </Link>

                        <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition"
                            >
                                <Home className="h-5 w-5" />
                                <span>{t('nav.home')}</span>
                            </Link>

                            <Link
                                href="/forums"
                                className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition"
                            >
                                <Users className="h-5 w-5" />
                                <span>{t('nav.forums')}</span>
                            </Link>

                            {session && (
                                <Link
                                    href="/messages"
                                    className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition"
                                >
                                    <MessageSquare className="h-5 w-5" />
                                    <span>{t('nav.messages')}</span>
                                    {unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-5 text-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                        <button
                            onClick={handleCreatePost}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition"
                        >
                            <Plus className="h-5 w-5" />
                            <span>{t('post.createPost')}</span>
                        </button>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'en' | 'bg')}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                        >
                            <option value="en">EN</option>
                            <option value="bg">BG</option>
                        </select>

                        {session ? (
                            <div
                                className="relative"
                                onMouseEnter={() => {
                                    if (closeTimeoutRef.current) {
                                        clearTimeout(closeTimeoutRef.current)
                                        closeTimeoutRef.current = null
                                    }
                                    setProfileMenuOpen(true)
                                }}
                                onMouseLeave={() => {
                                    closeTimeoutRef.current = setTimeout(() => {
                                        setProfileMenuOpen(false)
                                    }, 200)
                                }}
                            >
                                <button className="flex items-center space-x-2">
                                    <img
                                        src={session.user?.image || '/placeholder-user.jpg'}
                                        alt="Profile"
                                        className="h-8 w-8 rounded-full"
                                    />
                                </button>

                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50">
                                        <div className="px-4 py-3 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">{t('payment.postsRemaining')}</span>
                                                <span className="font-semibold text-blue-600">
                                                    {session.user?.postCredits || 0} {t('payment.credits')}
                                                </span>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/u/${session.user?.username || 'profile'}`}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <User className="inline h-4 w-4 mr-2" />
                                            {t('nav.profile')}
                                        </Link>
                                        <Link
                                            href="/payment/buy-credits"
                                            className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                        >
                                            <span className="inline-block h-4 w-4 mr-2 text-center">💳</span>
                                            {t('payment.buyPostCredits')}
                                        </Link>
                                        {session.user?.isAdmin && (
                                            <Link
                                                href="/admin"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <Settings className="inline h-4 w-4 mr-2" />
                                                {t('nav.admin')}
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => signOut()}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <LogOut className="inline h-4 w-4 mr-2" />
                                            {t('common.logout')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/auth/signin"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                {t('common.login')}
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2"
                        >
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link
                            href="/"
                            className="flex items-center gap-2 pl-3 pr-4 py-2 text-base font-medium text-gray-900"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Home className="h-5 w-5" />
                            <span>{t('nav.home')}</span>
                        </Link>
                        <Link
                            href="/forums"
                            className="flex items-center gap-2 pl-3 pr-4 py-2 text-base font-medium text-gray-900"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Users className="h-5 w-5" />
                            <span>{t('nav.forums')}</span>
                        </Link>
                        <button
                            onClick={() => {
                                setMobileMenuOpen(false)
                                handleCreatePost()
                            }}
                            className="flex items-center gap-2 w-full pl-3 pr-4 py-2 text-base font-medium text-green-600"
                        >
                            <Plus className="h-5 w-5" />
                            <span>{t('post.createPost')}</span>
                        </button>

                        {session && (
                            <>
                                <Link
                                    href="/messages"
                                    className="flex items-center gap-2 pl-3 pr-4 py-2 text-base font-medium text-gray-700"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <MessageSquare className="h-5 w-5" />
                                    <span>{t('nav.messages')}</span>
                                    {unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-5 text-center ml-auto">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>

                                <div className="px-3 py-2 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">{t('payment.postsRemaining')}</span>
                                        <span className="font-semibold text-blue-600">
                                            {session.user?.postCredits || 0} {t('payment.credits')}
                                        </span>
                                    </div>
                                </div>

                                <Link
                                    href={`/u/${session.user?.username || 'profile'}`}
                                    className="flex items-center gap-2 pl-3 pr-4 py-2 text-base font-medium text-gray-700"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <User className="h-5 w-5" />
                                    <span>{t('nav.profile')}</span>
                                </Link>

                                <Link
                                    href="/payment/buy-credits"
                                    className="flex items-center gap-2 pl-3 pr-4 py-2 text-base font-medium text-blue-600"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="h-5 w-5 text-center">💳</span>
                                    <span>{t('payment.buyPostCredits')}</span>
                                </Link>

                                {session.user?.isAdmin && (
                                    <Link
                                        href="/admin"
                                        className="flex items-center gap-2 pl-3 pr-4 py-2 text-base font-medium text-gray-700"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Settings className="h-5 w-5" />
                                        <span>{t('nav.admin')}</span>
                                    </Link>
                                )}

                                <button
                                    onClick={() => {
                                        signOut()
                                        setMobileMenuOpen(false)
                                    }}
                                    className="flex items-center gap-2 w-full pl-3 pr-4 py-2 text-base font-medium text-gray-700"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span>{t('common.logout')}</span>
                                </button>
                            </>
                        )}

                        {!session && (
                            <Link
                                href="/auth/signin"
                                className="flex items-center gap-2 pl-3 pr-4 py-2 text-base font-medium text-blue-600"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <User className="h-5 w-5" />
                                <span>{t('common.login')}</span>
                            </Link>
                        )}

                        <div className="pl-3 pr-4 py-2">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as 'en' | 'bg')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="en">English</option>
                                <option value="bg">Български</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}

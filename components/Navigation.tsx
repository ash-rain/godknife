'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useLanguage } from './LanguageProvider'
import { useState, useRef } from 'react'
import { Menu, X, MessageSquare, User, Settings, LogOut, Home, Plus, Users } from 'lucide-react'

interface NavigationProps {
    onCreatePost?: () => void
}

export default function Navigation({ onCreatePost }: NavigationProps) {
    const { data: session } = useSession()
    const { t, language, setLanguage } = useLanguage()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [profileMenuOpen, setProfileMenuOpen] = useState(false)
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
                                <span>Forums</span>
                            </Link>

                            {session && (
                                <>
                                    <Link
                                        href="/messages"
                                        className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition"
                                    >
                                        <MessageSquare className="h-5 w-5" />
                                        <span>{t('nav.messages')}</span>
                                    </Link>

                                    {onCreatePost && (
                                        <button
                                            onClick={onCreatePost}
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition"
                                        >
                                            <Plus className="h-5 w-5" />
                                            <span>{t('post.createPost')}</span>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
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
                                        src={session.user?.image || '/default-avatar.png'}
                                        alt="Profile"
                                        className="h-8 w-8 rounded-full"
                                    />
                                </button>

                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                        <Link
                                            href={`/u/${session.user?.username || 'profile'}`}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <User className="inline h-4 w-4 mr-2" />
                                            {t('nav.profile')}
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
                            <span>Forums</span>
                        </Link>
                        {session && (
                            <>
                                <Link
                                    href="/messages"
                                    className="flex items-center gap-2 pl-3 pr-4 py-2 text-base font-medium text-gray-700"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <MessageSquare className="h-5 w-5" />
                                    <span>{t('nav.messages')}</span>
                                </Link>

                                {onCreatePost && (
                                    <button
                                        onClick={() => {
                                            onCreatePost()
                                            setMobileMenuOpen(false)
                                        }}
                                        className="flex items-center gap-2 w-full pl-3 pr-4 py-2 text-base font-medium text-blue-600"
                                    >
                                        <Plus className="h-5 w-5" />
                                        <span>{t('post.createPost')}</span>
                                    </button>
                                )}

                                <Link
                                    href={`/u/${session.user?.username || 'profile'}`}
                                    className="flex items-center gap-2 pl-3 pr-4 py-2 text-base font-medium text-gray-700"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <User className="h-5 w-5" />
                                    <span>{t('nav.profile')}</span>
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

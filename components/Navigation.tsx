'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useLanguage } from './LanguageProvider'
import { useState } from 'react'
import { Menu, X, MessageSquare, User, Settings, LogOut } from 'lucide-react'

export default function Navigation() {
    const { data: session } = useSession()
    const { t, language, setLanguage } = useLanguage()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/"
                                className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600"
                            >
                                {t('nav.home')}
                            </Link>
                            <Link
                                href="/explore"
                                className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-900"
                            >
                                {t('nav.explore')}
                            </Link>
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
                            <>
                                <Link
                                    href="/messages"
                                    className="p-2 text-gray-500 hover:text-gray-900"
                                >
                                    <MessageSquare className="h-5 w-5" />
                                </Link>

                                <div className="relative group">
                                    <button className="flex items-center space-x-2">
                                        <img
                                            src={session.user?.image || '/default-avatar.png'}
                                            alt="Profile"
                                            className="h-8 w-8 rounded-full"
                                        />
                                    </button>

                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block">
                                        <Link
                                            href={`/u/${session.user?.username}`}
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
                                </div>
                            </>
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
                            className="block pl-3 pr-4 py-2 text-base font-medium text-gray-900"
                        >
                            {t('nav.home')}
                        </Link>
                        {session && (
                            <>
                                <Link
                                    href="/messages"
                                    className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500"
                                >
                                    {t('nav.messages')}
                                </Link>
                                <Link
                                    href={`/u/${session.user?.username}`}
                                    className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500"
                                >
                                    {t('nav.profile')}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}

'use client'

import Link from 'next/link'
import { useLanguage } from './LanguageProvider'
import { MessageSquare, Home, Users } from 'lucide-react'

export default function Footer() {
    const { t } = useLanguage()

    return (
        <footer className="bg-gray-900 text-gray-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1">
                        <h3 className="text-white text-xl font-bold mb-4">
                            {t('common.appName')}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {t('footer.tagline')}
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t('footer.navigation')}</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-sm hover:text-white transition flex items-center gap-2">
                                    <Home className="h-4 w-4" />
                                    {t('nav.home')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/forums" className="text-sm hover:text-white transition flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    {t('nav.forums')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/messages" className="text-sm hover:text-white transition flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    {t('nav.messages')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Community */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t('footer.community')}</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/forums" className="text-sm hover:text-white transition">
                                    {t('footer.discussionForums')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/auth/signin" className="text-sm hover:text-white transition">
                                    {t('footer.joinCommunity')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">{t('footer.legal')}</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/terms" className="text-sm hover:text-white transition">
                                    {t('footer.termsOfService')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-sm hover:text-white transition">
                                    {t('footer.privacyPolicy')}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} {t('common.appName')}. {t('footer.allRightsReserved')}.</p>
                </div>
            </div>
        </footer>
    )
}

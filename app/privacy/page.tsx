'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import ReactMarkdown from 'react-markdown'

interface StaticPage {
    id: string
    slug: string
    titleEn: string
    titleBg: string
    contentEn: string
    contentBg: string
}

export default function PrivacyPage() {
    const { t, locale } = useLanguage()
    const [page, setPage] = useState<StaticPage | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPage()
    }, [])

    const fetchPage = async () => {
        try {
            const response = await fetch('/api/pages/privacy')
            if (response.ok) {
                const data = await response.json()
                setPage(data.page)
            } else {
                // Fallback to translation if page not in database
                setPage(null)
            }
        } catch (error) {
            console.error('Error fetching page:', error)
        } finally {
            setLoading(false)
        }
    }

    const title = page ? (locale === 'en' ? page.titleEn : page.titleBg) : t('pages.privacy.title')
    const content = page ? (locale === 'en' ? page.contentEn : page.contentBg) : t('pages.privacy.content')

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="text-lg">{t('common.loading')}</div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-4xl font-bold text-gray-900 mb-8">{title}</h1>
                                <div className="prose prose-lg max-w-none">
                                    <ReactMarkdown>{content}</ReactMarkdown>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

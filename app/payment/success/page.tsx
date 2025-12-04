'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { data: session, update } = useSession()
    const { t } = useLanguage()
    const [isVerifying, setIsVerifying] = useState(true)
    const [credits, setCredits] = useState(0)

    useEffect(() => {
        const verifyPayment = async () => {
            const sessionId = searchParams.get('session_id')

            if (!sessionId) {
                setIsVerifying(false)
                return
            }

            try {
                // Fetch user data to get updated credits
                const response = await fetch('/api/users/me')
                if (response.ok) {
                    const userData = await response.json()
                    setCredits(userData.postCredits || 0)

                    // Update the session with new credits
                    await update()
                }
            } catch (error) {
                console.error('Error verifying payment:', error)
            } finally {
                setIsVerifying(false)
            }
        }

        if (session?.user) {
            verifyPayment()
        } else {
            setIsVerifying(false)
        }
    }, [session, searchParams, update])

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
                    {/* Success Icon */}
                    <div className="mb-6">
                        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <svg
                                className="w-10 h-10 text-green-600 dark:text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Success Message */}
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {t('payment.successTitle')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {t('payment.successMessage')}
                    </p>

                    {/* Credits Display */}
                    {credits > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-6">
                            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                                {credits}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {t('payment.creditsAdded')}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            {t('payment.returnHome')}
                        </button>
                        <button
                            onClick={() => router.push('/posts/create')}
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                        >
                            {t('post.createPost')}
                        </button>
                    </div>

                    {/* Additional Info */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
                        {t('payment.successMessage')}
                    </p>
                </div>

                {/* Decorative Elements */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>Secure payment processed</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import Navigation from '@/components/Navigation'

export default function PaymentCancelPage() {
    const router = useRouter()
    const { t } = useLanguage()

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
                        {/* Cancel Icon */}
                        <div className="mb-6">
                            <div className="mx-auto w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-10 h-10 text-yellow-600 dark:text-yellow-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Cancel Message */}
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            {t('payment.cancelTitle')}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            {t('payment.cancelMessage')}
                        </p>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/payment/buy-credits')}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                            >
                                {t('payment.tryAgain')}
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                            >
                                {t('payment.returnHome')}
                            </button>
                        </div>

                        {/* Additional Info */}
                        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                💡 Need help? Contact our support team if you're experiencing issues with payment.
                            </p>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>No charges were made to your account</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

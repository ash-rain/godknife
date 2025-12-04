'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'

const CREDIT_PACKAGES = [
    { quantity: 5, discount: 0, popular: false },
    { quantity: 10, discount: 10, popular: true },
    { quantity: 20, discount: 20, popular: false },
    { quantity: 50, discount: 30, popular: false },
]

type PaymentProvider = 'PAYPAL' | 'MYPOS' | 'STRIPE'

export default function BuyCreditsPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const { t } = useLanguage()
    const [selectedQuantity, setSelectedQuantity] = useState(10)
    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('STRIPE')
    const [isProcessing, setIsProcessing] = useState(false)

    const pricePerCredit = 1 // €1 per credit
    const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.quantity === selectedQuantity)
    const discountMultiplier = selectedPackage ? (100 - selectedPackage.discount) / 100 : 1
    const totalPrice = selectedQuantity * pricePerCredit * discountMultiplier

    const handlePurchase = async () => {
        if (!session?.user?.id) {
            router.push('/auth/signin')
            return
        }

        setIsProcessing(true)

        try {
            let response

            if (selectedProvider === 'STRIPE') {
                response = await fetch('/api/payments/stripe/create-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'POST_CREDITS',
                        quantity: selectedQuantity,
                    }),
                })

                const data = await response.json()

                if (response.ok && data.url) {
                    window.location.href = data.url
                } else {
                    throw new Error(data.error || 'Payment failed')
                }
            } else if (selectedProvider === 'PAYPAL') {
                response = await fetch('/api/payments/paypal/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'POST_CREDITS',
                        quantity: selectedQuantity,
                    }),
                })

                const data = await response.json()

                if (response.ok && data.approvalUrl) {
                    window.location.href = data.approvalUrl
                } else {
                    throw new Error(data.error || 'Payment failed')
                }
            } else if (selectedProvider === 'MYPOS') {
                response = await fetch('/api/payments/mypos/create-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'POST_CREDITS',
                        quantity: selectedQuantity,
                    }),
                })

                const data = await response.json()

                if (response.ok && data.url) {
                    window.location.href = data.url
                } else {
                    throw new Error(data.error || 'Payment failed')
                }
            }
        } catch (error) {
            console.error('Payment error:', error)
            alert(t('payment.paymentFailed'))
            setIsProcessing(false)
        }
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {t('errors.unauthorized')}
                    </h2>
                    <button
                        onClick={() => router.push('/auth/signin')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        {t('common.login')}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {t('payment.buyPostCredits')}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        {t('payment.pageDescription')}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full">
                        <span className="text-blue-800 dark:text-blue-300 font-semibold">
                            {session.user.postCredits || 0} {t('payment.credits')}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 text-sm">
                            {t('payment.postsRemaining')}
                        </span>
                    </div>
                </div>

                {/* Credit Packages */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                        {t('payment.selectQuantity')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {CREDIT_PACKAGES.map((pkg) => {
                            const price = pkg.quantity * pricePerCredit * ((100 - pkg.discount) / 100)
                            const isSelected = selectedQuantity === pkg.quantity

                            return (
                                <button
                                    key={pkg.quantity}
                                    onClick={() => setSelectedQuantity(pkg.quantity)}
                                    className={`relative p-6 rounded-xl border-2 transition-all ${isSelected
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
                                        }`}
                                >
                                    {pkg.popular && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                {t('payment.popularChoice')}
                                            </span>
                                        </div>
                                    )}
                                    {pkg.discount >= 30 && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                {t('payment.bestValue')}
                                            </span>
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                            {pkg.quantity}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            {t('payment.credits')}
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                            €{price.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-500">
                                            €{(price / pkg.quantity).toFixed(2)} {t('payment.perCredit')}
                                        </div>
                                        {pkg.discount > 0 && (
                                            <div className="mt-2">
                                                <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold px-2 py-1 rounded">
                                                    {pkg.discount}% {t('payment.discount')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Payment Provider Selection */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                        {t('payment.selectProvider')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            onClick={() => setSelectedProvider('STRIPE')}
                            className={`p-6 rounded-xl border-2 transition-all ${selectedProvider === 'STRIPE'
                                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
                                }`}
                        >
                            <div className="text-center">
                                <div className="text-3xl mb-2">💳</div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    Stripe
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {t('payment.payWithStripe')}
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setSelectedProvider('PAYPAL')}
                            className={`p-6 rounded-xl border-2 transition-all ${selectedProvider === 'PAYPAL'
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                }`}
                        >
                            <div className="text-center">
                                <div className="text-3xl mb-2">🅿️</div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    PayPal
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {t('payment.payWithPayPal')}
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setSelectedProvider('MYPOS')}
                            className={`p-6 rounded-xl border-2 transition-all ${selectedProvider === 'MYPOS'
                                    ? 'border-green-600 bg-green-50 dark:bg-green-900/20 shadow-lg'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-green-400'
                                }`}
                        >
                            <div className="text-center">
                                <div className="text-3xl mb-2">🏦</div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    MyPOS
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {t('payment.payWithMyPOS')}
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Summary and Purchase Button */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <div className="text-gray-600 dark:text-gray-400 mb-1">
                                {selectedQuantity} {t('payment.credits')}
                            </div>
                            {selectedPackage && selectedPackage.discount > 0 && (
                                <div className="text-sm text-green-600 dark:text-green-400">
                                    {selectedPackage.discount}% {t('payment.discount')}
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                {t('payment.total')}
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                €{totalPrice.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handlePurchase}
                        disabled={isProcessing}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                        {isProcessing ? t('payment.processing') : t('payment.proceedToPayment')}
                    </button>

                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                        {t('payment.selectProvider')}: {selectedProvider}
                    </p>
                </div>
            </div>
        </div>
    )
}

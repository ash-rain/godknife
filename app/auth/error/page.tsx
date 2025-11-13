'use client'

import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import Link from 'next/link'

export default function AuthErrorPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const { t } = useLanguage()

    const getErrorMessage = (error: string | null) => {
        switch (error) {
            case 'Configuration':
                return 'There is a problem with the server configuration. Please check that your OAuth provider credentials are correctly set up.'
            case 'AccessDenied':
                return 'Access denied. You cancelled the authentication or do not have permission.'
            case 'Verification':
                return 'The verification token has expired or has already been used.'
            case 'OAuthSignin':
                return 'Error in constructing an authorization URL.'
            case 'OAuthCallback':
                return 'Error in handling the response from the OAuth provider.'
            case 'OAuthCreateAccount':
                return 'Could not create OAuth provider user in the database.'
            case 'EmailCreateAccount':
                return 'Could not create email provider user in the database.'
            case 'Callback':
                return 'Error in the OAuth callback handler route.'
            case 'OAuthAccountNotLinked':
                return 'The email on the account is already linked, but not with this OAuth provider.'
            case 'EmailSignin':
                return 'Sending the verification email failed.'
            case 'CredentialsSignin':
                return 'Sign in failed. Check the details you provided are correct.'
            case 'SessionRequired':
                return 'Please sign in to access this page.'
            default:
                return 'An unknown error occurred during authentication.'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">
                    🔪 {t('common.appName')}
                </h1>
                <h2 className="text-center text-2xl font-semibold text-gray-900">
                    Authentication Error
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="mb-6">
                        <div className="bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                                <div className="shrink-0">
                                    <svg
                                        className="h-5 w-5 text-red-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        {error ? `Error: ${error}` : 'Authentication Error'}
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{getErrorMessage(error)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error === 'Configuration' && (
                        <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                            <div className="flex">
                                <div className="shrink-0">
                                    <svg
                                        className="h-5 w-5 text-blue-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        Troubleshooting Tips
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env</li>
                                            <li>Check that FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET are set in .env</li>
                                            <li>Verify NEXTAUTH_SECRET is properly configured</li>
                                            <li>Ensure OAuth redirect URIs are set to: http://localhost:3000/api/auth/callback/google and http://localhost:3000/api/auth/callback/facebook</li>
                                            <li>Restart your development server after changing .env</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col space-y-3">
                        <Link
                            href="/auth/signin"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Try Again
                        </Link>
                        <Link
                            href="/"
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Go to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

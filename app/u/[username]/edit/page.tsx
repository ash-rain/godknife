'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import { useLanguage } from '@/components/LanguageProvider'
import { Camera, Save, X, Globe, MapPin } from 'lucide-react'
import { getImageUrl } from '@/lib/image-utils'

interface User {
    id: string
    name: string | null
    username: string | null
    email: string | null
    image: string | null
    bio: string | null
    location: string | null
    website: string | null
    coverImage: string | null
}

export default function EditProfilePage() {
    const params = useParams()
    const username = params.username as string
    const router = useRouter()
    const { data: session, status } = useSession()
    const { t } = useLanguage()

    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingImage, setUploadingImage] = useState<'profile' | 'cover' | null>(
        null
    )
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        location: '',
        website: '',
    })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
            return
        }

        if (status === 'authenticated' && session?.user?.username !== username) {
            router.push(`/u/${username}`)
            return
        }

        if (status === 'authenticated') {
            fetchUser()
        }
    }, [status, session, username])

    const fetchUser = async () => {
        try {
            const response = await fetch(`/api/users/${username}`)
            if (response.ok) {
                const data = await response.json()
                setUser(data)
                setFormData({
                    name: data.name || '',
                    bio: data.bio || '',
                    location: data.location || '',
                    website: data.website || '',
                })
            }
        } catch (error) {
            console.error('Error fetching user:', error)
            setError(t('errors.somethingWrong'))
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'profile' | 'cover'
    ) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError(t('profile.pleaseSelectImage'))
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError(t('profile.imageSizeLimit'))
            return
        }

        setUploadingImage(type)
        setError('')

        try {
            const formData = new FormData()
            formData.append('image', file)
            formData.append('type', type)

            const response = await fetch(`/api/users/${username}/upload-image`, {
                method: 'POST',
                body: formData,
            })

            if (response.ok) {
                const data = await response.json()
                setUser(data.user)
                setSuccess(type === 'profile' ? t('profile.profileImageUpdated') : t('profile.coverImageUpdated'))
                setTimeout(() => setSuccess(''), 3000)
            } else {
                const data = await response.json()
                setError(data.error || t('profile.failedToUpload'))
            }
        } catch (error) {
            console.error('Error uploading image:', error)
            setError(t('errors.somethingWrong'))
        } finally {
            setUploadingImage(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch(`/api/users/${username}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                const data = await response.json()
                setUser(data)
                setSuccess(t('profile.profileUpdated'))
                setTimeout(() => {
                    router.push(`/u/${username}`)
                }, 1500)
            } else {
                const data = await response.json()
                setError(data.error || t('errors.somethingWrong'))
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            setError(t('errors.somethingWrong'))
        } finally {
            setSaving(false)
        }
    }

    if (loading || status === 'loading') {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-gray-600">{t('common.loading')}</div>
                </div>
            </>
        )
    }

    if (!user) {
        return (
            <>
                <Navigation />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            {t('errors.notFound')}
                        </h1>
                    </div>
                </div>
            </>
        )
    }

    const coverImageUrl = user.coverImage
        ? getImageUrl(user.coverImage, 'large')
        : null
    const profileImageUrl = user.image ? getImageUrl(user.image, 'medium') : null

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('profile.editProfile')}
                            </h1>
                            <button
                                onClick={() => router.push(`/u/${username}`)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Cover Image */}
                        <div className="relative h-48 bg-linear-to-r from-blue-500 to-purple-600">
                            {coverImageUrl && (
                                <img
                                    src={coverImageUrl}
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <label className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg cursor-pointer hover:bg-gray-100 transition">
                                <Camera className="w-5 h-5 text-gray-700" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, 'cover')}
                                    disabled={uploadingImage !== null}
                                />
                            </label>
                            {uploadingImage === 'cover' && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <div className="text-white">
                                        {t('common.loading')}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Image */}
                        <div className="px-6 -mt-16 mb-6">
                            <div className="relative inline-block">
                                <img
                                    src={
                                        profileImageUrl ||
                                        user.image ||
                                        '/placeholder-user.jpg'
                                    }
                                    alt={user.name || user.username || 'User'}
                                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = '/placeholder-user.jpg'
                                    }}
                                />
                                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100 transition">
                                    <Camera className="w-4 h-4 text-gray-700" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(e, 'profile')}
                                        disabled={uploadingImage !== null}
                                    />
                                </label>
                                {uploadingImage === 'profile' && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                        <div className="text-white text-xs">
                                            {t('common.loading')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
                            {/* Alerts */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                                    {success}
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    {t('common.name')}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('profile.yourName')}
                                />
                            </div>

                            {/* Bio */}
                            <div>
                                <label
                                    htmlFor="bio"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    {t('profile.bio')}
                                </label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('profile.tellUsAboutYourself')}
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label
                                    htmlFor="location"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    {t('profile.location')}
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('profile.cityCountry')}
                                />
                            </div>

                            {/* Website */}
                            <div>
                                <label
                                    htmlFor="website"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    <Globe className="w-4 h-4 inline mr-1" />
                                    {t('profile.website')}
                                </label>
                                <input
                                    type="url"
                                    id="website"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={t('profile.yourWebsite')}
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center justify-end space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => router.push(`/u/${username}`)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {saving ? t('common.loading') : t('common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

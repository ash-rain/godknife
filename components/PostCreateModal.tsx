'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from './LanguageProvider'
import { X } from 'lucide-react'

interface PostCreateModalProps {
    onClose: () => void
    onSuccess: () => void
}

interface Category {
    id: string
    nameEn: string
    nameBg: string
    slug: string
    subcategories: Subcategory[]
}

interface Subcategory {
    id: string
    nameEn: string
    nameBg: string
    slug: string
}

export default function PostCreateModal({ onClose, onSuccess }: PostCreateModalProps) {
    const { data: session } = useSession()
    const { t, locale } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [checkingLimit, setCheckingLimit] = useState(true)
    const [canPost, setCanPost] = useState(true)
    const [limitReason, setLimitReason] = useState('')
    const [nextFreePostDate, setNextFreePostDate] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        isGallery: false,
        categoryId: '',
        subcategoryId: '',
    })
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [subcategories, setSubcategories] = useState<Subcategory[]>([])

    const checkPostLimit = async () => {
        try {
            const response = await fetch('/api/posts/check-limit')
            if (response.ok) {
                const data = await response.json()
                setCanPost(data.canPost)
                if (!data.canPost) {
                    setLimitReason(data.reason)
                    if (data.nextFreePostDate) {
                        const date = new Date(data.nextFreePostDate)
                        setNextFreePostDate(date.toLocaleDateString(locale))
                    }
                }
            }
        } catch (error) {
            console.error('Error checking post limit:', error)
        } finally {
            setCheckingLimit(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories')
            if (response.ok) {
                const data = await response.json()
                setCategories(data.categories)
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    useEffect(() => {
        checkPostLimit()
        fetchCategories()
    }, [])

    const handleCategoryChange = (categoryId: string) => {
        setFormData({ ...formData, categoryId, subcategoryId: '' })
        const category = categories.find(c => c.id === categoryId)
        setSubcategories(category?.subcategories || [])
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length + images.length > 10) {
            setError('Maximum 10 images allowed')
            return
        }

        setImages([...images, ...files])

        const previews = files.map(file => URL.createObjectURL(file))
        setImagePreviews([...imagePreviews, ...previews])
    }

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index)
        const newPreviews = imagePreviews.filter((_, i) => i !== index)
        setImages(newImages)
        setImagePreviews(newPreviews)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            console.log('Creating post with data:', formData)
            console.log('Images:', images.length, 'files')

            const formDataToSend = new FormData()
            formDataToSend.append('title', formData.title)
            formDataToSend.append('description', formData.description)
            if (formData.price && !formData.isGallery) {
                formDataToSend.append('price', formData.price)
            }
            formDataToSend.append('isGallery', String(formData.isGallery))
            if (formData.categoryId) {
                formDataToSend.append('categoryId', formData.categoryId)
            }
            if (formData.subcategoryId) {
                formDataToSend.append('subcategoryId', formData.subcategoryId)
            }

            images.forEach((image, index) => {
                console.log(`Appending image-${index}:`, image.name, image.size)
                formDataToSend.append(`image-${index}`, image)
            })

            console.log('Sending request to /api/posts...')
            const response = await fetch('/api/posts', {
                method: 'POST',
                body: formDataToSend,
            })

            console.log('Response status:', response.status)
            const data = await response.json()
            console.log('Response data:', data)

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create post')
            }

            console.log('Post created successfully!')
            onSuccess()
        } catch (err: any) {
            console.error('Error creating post:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">{t('post.createPost')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {checkingLimit ? (
                    <div className="p-12 text-center">
                        <div className="text-gray-600">{t('common.loading')}</div>
                    </div>
                ) : !canPost ? (
                    <div className="p-6 space-y-6">
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">📝</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {t('limits.postLimitReached')}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {t('limits.freePostLimit')}
                            </p>
                            {nextFreePostDate && (
                                <p className="text-sm text-gray-500 mb-6">
                                    {t('limits.nextFreePost')}: <span className="font-semibold">{nextFreePostDate}</span>
                                </p>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h4 className="font-semibold text-blue-900 mb-2">
                                {t('payment.buyMorePosts')}
                            </h4>
                            <p className="text-blue-800 text-sm mb-4">
                                {t('payment.postPackage')}
                            </p>
                            <button
                                onClick={() => {
                                    onClose()
                                    window.location.href = '/payment/buy-credits'
                                }}
                                className="w-full bg-blue-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                            >
                                {t('payment.buyPosts')}
                            </button>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('post.title')} *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('post.description')} *
                            </label>
                            <textarea
                                required
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('post.category')}
                            </label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">{t('post.selectCategory')}</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {locale === 'en' ? cat.nameEn : cat.nameBg}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {formData.categoryId && subcategories.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('post.subcategory')}
                                </label>
                                <select
                                    value={formData.subcategoryId}
                                    onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">{t('post.selectSubcategory')}</option>
                                    {subcategories.map((sub) => (
                                        <option key={sub.id} value={sub.id}>
                                            {locale === 'en' ? sub.nameEn : sub.nameBg}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.isGallery}
                                    onChange={(e) => setFormData({ ...formData, isGallery: e.target.checked, price: '' })}
                                    className="mr-2"
                                />
                                <span className="text-sm">{t('post.gallery')}</span>
                            </label>
                        </div>

                        {!formData.isGallery && (
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('post.price')} (€)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('post.uploadImages')} * (Max 10)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="w-full"
                            />

                            <div className="grid grid-cols-3 gap-2 mt-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-32 object-cover rounded"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading || images.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? t('common.loading') : t('post.publish')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

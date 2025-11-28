'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface Subcategory {
    id: string
    nameEn: string
    nameBg: string
    slug: string
    order: number
    isActive: boolean
}

interface Category {
    id: string
    nameEn: string
    nameBg: string
    slug: string
    descriptionEn?: string
    descriptionBg?: string
    icon?: string
    order: number
    isActive: boolean
    subcategories: Subcategory[]
    _count: {
        posts: number
    }
}

export default function CategoriesAdminPage() {
    const router = useRouter()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/categories')
            if (response.ok) {
                const data = await response.json()
                setCategories(data.categories)
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category? This will also delete all subcategories.')) {
            return
        }

        setDeletingId(id)
        try {
            const response = await fetch(`/api/admin/categories/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                await fetchCategories()
            } else {
                alert('Failed to delete category')
            }
        } catch (error) {
            console.error('Error deleting category:', error)
            alert('Error deleting category')
        } finally {
            setDeletingId(null)
        }
    }

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manage Categories</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="h-5 w-5" />
                    Create Category
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Slug
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Order
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Posts
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Subcategories
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {categories.map((category) => (
                                <>
                                    <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {category.icon && <span className="mr-2">{category.icon}</span>}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {category.nameEn}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {category.nameBg}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {category.slug}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {category.order}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {category._count.posts}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${category.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {category.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => toggleCategory(category.id)}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                            >
                                                {category.subcategories.length}
                                                {expandedCategories.has(category.id) ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setEditingCategory(category)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                disabled={deletingId === category.id}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedCategories.has(category.id) && category.subcategories.length > 0 && (
                                        <tr key={`${category.id}-subs`}>
                                            <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                                                <div className="ml-8">
                                                    <h4 className="font-semibold mb-2">Subcategories:</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {category.subcategories.map((sub) => (
                                                            <div
                                                                key={sub.id}
                                                                className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700"
                                                            >
                                                                <div className="text-sm">
                                                                    <div className="font-medium">{sub.nameEn}</div>
                                                                    <div className="text-gray-500 text-xs">{sub.nameBg}</div>
                                                                </div>
                                                                <span className={`text-xs px-2 py-1 rounded ${sub.isActive
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {sub.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>

                    {categories.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">No categories found</p>
                        </div>
                    )}
                </div>
            )}

            {showCreateModal && (
                <CategoryModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false)
                        fetchCategories()
                    }}
                />
            )}

            {editingCategory && (
                <CategoryModal
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onSuccess={() => {
                        setEditingCategory(null)
                        fetchCategories()
                    }}
                />
            )}
        </div>
    )
}

interface CategoryModalProps {
    category?: Category
    onClose: () => void
    onSuccess: () => void
}

function CategoryModal({ category, onClose, onSuccess }: CategoryModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        nameEn: category?.nameEn || '',
        nameBg: category?.nameBg || '',
        slug: category?.slug || '',
        descriptionEn: category?.descriptionEn || '',
        descriptionBg: category?.descriptionBg || '',
        icon: category?.icon || '',
        order: category?.order || 0,
        isActive: category?.isActive ?? true,
    })

    const [subcategories, setSubcategories] = useState<Array<{
        id?: string
        nameEn: string
        nameBg: string
        slug: string
        order: number
        isActive: boolean
    }>>(category?.subcategories || [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const url = category
                ? `/api/admin/categories/${category.id}`
                : '/api/admin/categories'

            const method = category ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    subcategories,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to save category')
            }

            onSuccess()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const addSubcategory = () => {
        setSubcategories([
            ...subcategories,
            {
                nameEn: '',
                nameBg: '',
                slug: '',
                order: subcategories.length,
                isActive: true,
            },
        ])
    }

    const removeSubcategory = (index: number) => {
        setSubcategories(subcategories.filter((_, i) => i !== index))
    }

    const updateSubcategory = (index: number, field: string, value: any) => {
        const updated = [...subcategories]
        updated[index] = { ...updated[index], [field]: value }
        setSubcategories(updated)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full my-8">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-2xl font-bold">
                        {category ? 'Edit Category' : 'Create Category'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Name (English) *</label>
                            <input
                                type="text"
                                required
                                value={formData.nameEn}
                                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Name (Bulgarian) *</label>
                            <input
                                type="text"
                                required
                                value={formData.nameBg}
                                onChange={(e) => setFormData({ ...formData, nameBg: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Slug *</label>
                            <input
                                type="text"
                                required
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Icon (Emoji)</label>
                            <input
                                type="text"
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Order</label>
                            <input
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Description (English)</label>
                            <textarea
                                rows={3}
                                value={formData.descriptionEn}
                                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Description (Bulgarian)</label>
                            <textarea
                                rows={3}
                                value={formData.descriptionBg}
                                onChange={(e) => setFormData({ ...formData, descriptionBg: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="mr-2"
                            />
                            <span className="text-sm">Active</span>
                        </label>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Subcategories</h3>
                            <button
                                type="button"
                                onClick={addSubcategory}
                                className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                + Add Subcategory
                            </button>
                        </div>

                        <div className="space-y-3">
                            {subcategories.map((sub, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 dark:bg-gray-900 rounded">
                                    <div className="col-span-3">
                                        <label className="block text-xs font-medium mb-1">Name (EN)</label>
                                        <input
                                            type="text"
                                            required
                                            value={sub.nameEn}
                                            onChange={(e) => updateSubcategory(index, 'nameEn', e.target.value)}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-medium mb-1">Name (BG)</label>
                                        <input
                                            type="text"
                                            required
                                            value={sub.nameBg}
                                            onChange={(e) => updateSubcategory(index, 'nameBg', e.target.value)}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-medium mb-1">Slug</label>
                                        <input
                                            type="text"
                                            required
                                            value={sub.slug}
                                            onChange={(e) => updateSubcategory(index, 'slug', e.target.value)}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-medium mb-1">Order</label>
                                        <input
                                            type="number"
                                            value={sub.order}
                                            onChange={(e) => updateSubcategory(index, 'order', parseInt(e.target.value))}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>
                                    <div className="col-span-1 flex items-center">
                                        <label className="flex items-center text-xs">
                                            <input
                                                type="checkbox"
                                                checked={sub.isActive}
                                                onChange={(e) => updateSubcategory(index, 'isActive', e.target.checked)}
                                                className="mr-1"
                                            />
                                            Active
                                        </label>
                                    </div>
                                    <div className="col-span-1">
                                        <button
                                            type="button"
                                            onClick={() => removeSubcategory(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : category ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

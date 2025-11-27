'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'

interface StaticPage {
    id: string
    slug: string
    titleEn: string
    titleBg: string
    contentEn: string
    contentBg: string
    isActive: boolean
    updatedAt: string
}

export default function AdminPagesPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { t, locale } = useLanguage()
    const [pages, setPages] = useState<StaticPage[]>([])
    const [loading, setLoading] = useState(true)
    const [editingPage, setEditingPage] = useState<StaticPage | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        slug: '',
        titleEn: '',
        titleBg: '',
        contentEn: '',
        contentBg: '',
        isActive: true
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
        }
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated') {
            fetchPages()
        }
    }, [status])

    const fetchPages = async () => {
        try {
            const response = await fetch('/api/admin/pages')
            if (!response.ok) throw new Error('Failed to fetch pages')
            const data = await response.json()
            setPages(data.pages || [])
        } catch (error) {
            console.error('Error fetching pages:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (page: StaticPage) => {
        setEditingPage(page)
        setFormData({
            slug: page.slug,
            titleEn: page.titleEn,
            titleBg: page.titleBg,
            contentEn: page.contentEn,
            contentBg: page.contentBg,
            isActive: page.isActive
        })
        setShowForm(true)
    }

    const handleCreate = () => {
        setEditingPage(null)
        setFormData({
            slug: '',
            titleEn: '',
            titleBg: '',
            contentEn: '',
            contentBg: '',
            isActive: true
        })
        setShowForm(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const url = editingPage
                ? `/api/admin/pages/${editingPage.id}`
                : '/api/admin/pages'

            const method = editingPage ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to save page')
            }

            setShowForm(false)
            fetchPages()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this page?')) return

        try {
            const response = await fetch(`/api/admin/pages/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to delete page')

            fetchPages()
        } catch (error) {
            console.error('Error deleting page:', error)
            alert('Failed to delete page')
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-lg text-white">{t('common.loading')}</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white">
                        {t('pages.managePages')}
                    </h1>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {t('pages.createPage')}
                    </button>
                </div>

                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
                        <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-white">
                                    {editingPage ? t('pages.editPage') : t('pages.createPage')}
                                </h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        {t('pages.slug')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        disabled={!!editingPage}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-600 disabled:text-gray-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        {t('pages.titleEn')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.titleEn}
                                        onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        {t('pages.titleBg')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.titleBg}
                                        onChange={(e) => setFormData({ ...formData, titleBg: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        {t('pages.contentEn')}
                                    </label>
                                    <textarea
                                        value={formData.contentEn}
                                        onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-48 font-mono text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        {t('pages.contentBg')}
                                    </label>
                                    <textarea
                                        value={formData.contentBg}
                                        onChange={(e) => setFormData({ ...formData, contentBg: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-48 font-mono text-sm"
                                        required
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                                    />
                                    <label className="ml-2 block text-sm text-gray-300">
                                        {t('pages.isActive')}
                                    </label>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {saving ? t('common.loading') : t('pages.saveChanges')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-750">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {t('pages.slug')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {locale === 'en' ? t('pages.titleEn') : t('pages.titleBg')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {t('pages.isActive')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {t('pages.lastUpdated')}
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {t('pages.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {pages.map((page) => (
                                <tr key={page.id} className="hover:bg-gray-750 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                        {page.slug}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {locale === 'en' ? page.titleEn : page.titleBg}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        <span className={`px-2 py-1 rounded-full text-xs ${page.isActive ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                                            }`}>
                                            {page.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {new Date(page.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(page)}
                                            className="text-blue-400 hover:text-blue-300 mr-4 transition-colors"
                                        >
                                            {t('common.edit')}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(page.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            {t('common.delete')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {pages.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            No pages yet. Create your first page!
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

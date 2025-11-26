'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useLanguage } from './LanguageProvider'

interface ThreadComment {
    id: string
    content: string
    createdAt: string
    author: {
        id: string
        username: string | null
        name: string | null
        image?: string | null
        isBanned: boolean
    }
    replies?: ThreadComment[]
}

interface ThreadDetailProps {
    thread: {
        id: string
        title: string
        content: string
        isPinned: boolean
        isLocked: boolean
        status: string
        views: number
        createdAt: string
        author: {
            id: string
            username: string | null
            name: string | null
            image?: string | null
            isBanned: boolean
        }
        forum: {
            id: string
            name: string
            slug: string
        }
        comments: ThreadComment[]
    }
    currentUserId?: string
    isModerator?: boolean
}

export default function ThreadDetail({ thread, currentUserId, isModerator }: ThreadDetailProps) {
    const { t } = useLanguage()
    const [comments, setComments] = useState(thread.comments)
    const [newComment, setNewComment] = useState('')
    const [replyTo, setReplyTo] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmitComment = async (parentId?: string) => {
        if (!newComment.trim()) return

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/threads/${thread.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment,
                    parentId
                })
            })

            if (response.ok) {
                const { comment } = await response.json()
                // Refresh the page to show the new comment
                window.location.reload()
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to post comment')
            }
        } catch (error) {
            console.error('Error posting comment:', error)
            alert('Failed to post comment')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleModerateThread = async (action: string) => {
        if (!isModerator) return

        const reason = action === 'delete' || action === 'flag'
            ? prompt(`Reason for ${action}:`)
            : undefined

        if ((action === 'delete' || action === 'flag') && !reason) return

        try {
            const response = await fetch(`/api/moderation/threads/${thread.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason })
            })

            if (response.ok) {
                window.location.reload()
            } else {
                const error = await response.json()
                alert(error.error || 'Moderation action failed')
            }
        } catch (error) {
            console.error('Error moderating thread:', error)
            alert('Moderation action failed')
        }
    }

    const handleModerateComment = async (commentId: string, action: string) => {
        if (!isModerator) return

        const reason = action === 'delete' || action === 'flag'
            ? prompt(`Reason for ${action}:`)
            : undefined

        if ((action === 'delete' || action === 'flag') && !reason) return

        try {
            const response = await fetch(`/api/moderation/comments/${commentId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason })
            })

            if (response.ok) {
                window.location.reload()
            } else {
                const error = await response.json()
                alert(error.error || 'Moderation action failed')
            }
        } catch (error) {
            console.error('Error moderating comment:', error)
            alert('Moderation action failed')
        }
    }

    const renderComment = (comment: ThreadComment, isReply = false) => (
        <div key={comment.id} className={`${isReply ? 'ml-12' : ''} mb-4`}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3 mb-3">
                    {comment.author.image ? (
                        <img
                            src={comment.author.image}
                            alt={comment.author.name || comment.author.username || 'User'}
                            className="w-10 h-10 rounded-full"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold">
                                {(comment.author.name || comment.author.username || 'U')[0].toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">
                                {comment.author.username || comment.author.name}
                            </span>
                            {comment.author.isBanned && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 text-xs rounded">
                                    Banned
                                </span>
                            )}
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                        <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {comment.content}
                        </p>
                        <div className="mt-3 flex gap-3">
                            {currentUserId && !thread.isLocked && (
                                <button
                                    onClick={() => setReplyTo(comment.id)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {t('forum.reply')}
                                </button>
                            )}
                            {isModerator && (
                                <>
                                    <button
                                        onClick={() => handleModerateComment(comment.id, 'delete')}
                                        className="text-sm text-red-600 dark:text-red-400 hover:underline"
                                    >
                                        {t('common.delete')}
                                    </button>
                                    <button
                                        onClick={() => handleModerateComment(comment.id, 'flag')}
                                        className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline"
                                    >
                                        {t('forum.flag')}
                                    </button>
                                </>
                            )}
                        </div>
                        {replyTo === comment.id && (
                            <div className="mt-3">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={t('forum.writeReply')}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                    rows={3}
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleSubmitComment(comment.id)}
                                        disabled={isSubmitting || !newComment.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                                    >
                                        {isSubmitting ? t('forum.posting') : t('forum.postReply')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setReplyTo(null)
                                            setNewComment('')
                                        }}
                                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                                    >
                                        {t('forum.cancel')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {comment.replies && comment.replies.map((reply) => renderComment(reply, true))}
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto">
            {/* Thread Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
                <div className="mb-4">
                    <a
                        href={`/forums/${thread.forum.slug}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                        ← {t('forum.backToForum')} {thread.forum.name}
                    </a>
                </div>
                <div className="flex items-start gap-2 mb-4">
                    {thread.isPinned && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded">
                            {t('forum.pinned')}
                        </span>
                    )}
                    {thread.isLocked && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 text-xs rounded">
                            {t('forum.locked')}
                        </span>
                    )}
                    <h1 className="text-3xl font-bold flex-1">{thread.title}</h1>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span>{t('forum.by')} {thread.author.username || thread.author.name}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                    <span>•</span>
                    <span>{thread.views} {t('forum.views')}</span>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{thread.content}</p>
                </div>

                {/* Moderation Actions */}
                {isModerator && (
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold mb-3">{t('forum.moderationActions')}</h3>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => handleModerateThread(thread.isPinned ? 'unpin' : 'pin')}
                                className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 text-sm"
                            >
                                {thread.isPinned ? t('forum.unpin') : t('forum.pin')}
                            </button>
                            <button
                                onClick={() => handleModerateThread(thread.isLocked ? 'unlock' : 'lock')}
                                className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-sm"
                            >
                                {thread.isLocked ? t('forum.unlock') : t('forum.lock')}
                            </button>
                            <button
                                onClick={() => handleModerateThread('flag')}
                                className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 text-sm"
                            >
                                {t('forum.flag')}
                            </button>
                            <button
                                onClick={() => handleModerateThread('delete')}
                                className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 text-sm"
                            >
                                {t('forum.deleteThread')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Comments */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">{t('forum.comments')} ({comments.length})</h2>
                {comments.map((comment) => renderComment(comment))}
            </div>

            {/* New Comment Form */}
            {currentUserId && !thread.isLocked && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold mb-3">{t('forum.addComment')}</h3>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('forum.writeComment')}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        rows={4}
                    />
                    <button
                        onClick={() => handleSubmitComment()}
                        disabled={isSubmitting || !newComment.trim()}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                    >
                        {isSubmitting ? t('forum.posting') : t('forum.postComment')}
                    </button>
                </div>
            )}

            {thread.isLocked && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center text-gray-600 dark:text-gray-400">
                    {t('forum.threadLocked')}
                </div>
            )}

            {!currentUserId && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {t('forum.signInToComment')}
                    </p>
                    <a
                        href="/auth/signin"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
                    >
                        {t('common.login')}
                    </a>
                </div>
            )}
        </div>
    )
}

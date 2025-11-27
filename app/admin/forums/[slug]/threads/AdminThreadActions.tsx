'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminThreadActionsProps {
    threadId: string
    isPinned: boolean
    isLocked: boolean
    status: string
}

export default function AdminThreadActions({ 
    threadId, 
    isPinned, 
    isLocked, 
    status 
}: AdminThreadActionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleModerateThread = async (action: string) => {
        if (loading) return

        const confirmActions = ['delete', 'flag']
        if (confirmActions.includes(action)) {
            const confirmed = window.confirm(`Are you sure you want to ${action} this thread?`)
            if (!confirmed) return
        }

        try {
            setLoading(true)
            const response = await fetch(`/api/moderation/threads/${threadId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action, 
                    reason: action === 'delete' || action === 'flag' ? 'Admin action' : undefined 
                })
            })

            if (!response.ok) {
                throw new Error('Moderation action failed')
            }

            router.refresh()
        } catch (error) {
            console.error('Error moderating thread:', error)
            alert('Failed to perform action')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            {status !== 'DELETED' && (
                <>
                    <button
                        onClick={() => handleModerateThread(isPinned ? 'unpin' : 'pin')}
                        disabled={loading}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs disabled:opacity-50"
                    >
                        {isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                        onClick={() => handleModerateThread(isLocked ? 'unlock' : 'lock')}
                        disabled={loading}
                        className="text-gray-600 dark:text-gray-400 hover:underline text-xs disabled:opacity-50"
                    >
                        {isLocked ? 'Unlock' : 'Lock'}
                    </button>
                    {status === 'FLAGGED' ? (
                        <button
                            onClick={() => handleModerateThread('approve')}
                            disabled={loading}
                            className="text-green-600 dark:text-green-400 hover:underline text-xs disabled:opacity-50"
                        >
                            Approve
                        </button>
                    ) : (
                        <button
                            onClick={() => handleModerateThread('flag')}
                            disabled={loading}
                            className="text-yellow-600 dark:text-yellow-400 hover:underline text-xs disabled:opacity-50"
                        >
                            Flag
                        </button>
                    )}
                    <button
                        onClick={() => handleModerateThread('delete')}
                        disabled={loading}
                        className="text-red-600 dark:text-red-400 hover:underline text-xs disabled:opacity-50"
                    >
                        Delete
                    </button>
                </>
            )}
            {status === 'DELETED' && (
                <button
                    onClick={() => handleModerateThread('restore')}
                    disabled={loading}
                    className="text-green-600 dark:text-green-400 hover:underline text-xs disabled:opacity-50"
                >
                    Restore
                </button>
            )}
        </div>
    )
}

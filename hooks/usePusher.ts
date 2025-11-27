'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getPusherClient } from '@/lib/pusher'
import type PusherClient from 'pusher-js'

export function usePusher() {
    const { data: session } = useSession()
    const [pusher, setPusher] = useState<PusherClient | null>(null)

    useEffect(() => {
        if (session?.user?.id) {
            const client = getPusherClient()
            setPusher(client)

            // Connect to Pusher
            client.connection.bind('connected', () => {
                console.log('Connected to Pusher')
            })

            client.connection.bind('error', (error: any) => {
                console.error('Pusher connection error:', error)
            })

            return () => {
                client.disconnect()
            }
        }
    }, [session?.user?.id])

    return pusher
}

interface UseNotificationsOptions {
    onNewMessage?: () => void
}

export function useNotifications({ onNewMessage }: UseNotificationsOptions = {}) {
    const { data: session } = useSession()
    const pusher = usePusher()

    useEffect(() => {
        if (!pusher || !session?.user?.id) return

        // Subscribe to user's notification channel
        const channel = pusher.subscribe(`user-${session.user.id}`)

        // Listen for new message events
        channel.bind('new-message', (data: any) => {
            console.log('New message received:', data)
            if (onNewMessage) {
                onNewMessage()
            }
        })

        return () => {
            channel.unbind('new-message')
            pusher.unsubscribe(`user-${session.user.id}`)
        }
    }, [pusher, session?.user?.id, onNewMessage])
}

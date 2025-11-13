import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Soketi configuration (self-hosted Pusher alternative)
export const pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID || 'godknife-app',
    key: process.env.PUSHER_KEY || 'godknife-key',
    secret: process.env.PUSHER_SECRET || 'godknife-secret',
    host: process.env.PUSHER_HOST || 'localhost',
    port: process.env.PUSHER_PORT || '6001',
    useTLS: process.env.PUSHER_USE_TLS === 'true',
})

export function getPusherClient() {
    return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || 'godknife-key', {
        wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST || 'localhost',
        wsPort: parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT || '6001'),
        forceTLS: process.env.NEXT_PUBLIC_PUSHER_USE_TLS === 'true',
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        cluster: 'mt1', // Required by type but not used with custom wsHost
    })
}

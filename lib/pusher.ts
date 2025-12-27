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
    const useTLS = process.env.NEXT_PUBLIC_PUSHER_USE_TLS === 'true'
    const host = process.env.NEXT_PUBLIC_PUSHER_HOST || 'localhost'
    const port = process.env.NEXT_PUBLIC_PUSHER_PORT || '6001'

    // For production with TLS on standard port 443, don't specify wsPort
    // For local development or non-standard ports, specify wsPort
    const config: any = {
        wsHost: host,
        forceTLS: useTLS,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        cluster: 'mt1', // Required by type but not used with custom wsHost
    }

    // Only add wsPort if not using standard TLS port (443) or standard WS port (80)
    if (!(useTLS && port === '443') && !(!useTLS && port === '80')) {
        config.wsPort = parseInt(port)
    }

    return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || 'godknife-key', config)
}

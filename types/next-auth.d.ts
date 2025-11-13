import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            username?: string | null
            isAdmin?: boolean
            postCredits?: number
        } & DefaultSession["user"]
    }

    interface User {
        username?: string | null
        isAdmin?: boolean
        postCredits?: number
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        username?: string | null
        isAdmin?: boolean
        postCredits?: number
    }
}

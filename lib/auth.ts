import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import EmailProvider from "next-auth/providers/email"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Helper function to generate a unique username
async function generateUniqueUsername(name: string | null): Promise<string> {
    // Create base username from name
    let baseUsername = 'user'
    if (name) {
        // Remove special characters and spaces, convert to lowercase
        baseUsername = name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 15) // Limit length
    }

    // If base is empty, use 'user'
    if (!baseUsername) {
        baseUsername = 'user'
    }

    // Try to find available username
    let username = baseUsername
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
        // Check if username exists
        const existingUser = await prisma.user.findUnique({
            where: { username }
        })

        if (!existingUser) {
            return username
        }

        // Generate random 4-digit number
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        username = `${baseUsername}${randomNum}`
        attempts++
    }

    // Fallback: use timestamp
    return `${baseUsername}${Date.now().toString().slice(-6)}`
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    debug: process.env.NODE_ENV === 'development',
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
        }),
        EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM,
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email as string,
                    },
                }) as any

                if (!user || !user.password) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (!isPasswordValid) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    callbacks: {
        async signIn({ user, account }) {
            // Auto-generate username for new OAuth users
            if (account?.provider !== 'credentials' && user.id) {
                const existingUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { username: true, name: true }
                })

                if (existingUser && !existingUser.username) {
                    const newUsername = await generateUniqueUsername(existingUser.name)
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { username: newUsername }
                    })
                }
            }
            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string
            }

            // Fetch user's admin status and add to token
            if (token.id) {
                const userData = await prisma.user.findUnique({
                    where: { id: token.id as string },
                }) as any
                if (userData) {
                    token.isAdmin = userData.isAdmin
                }
            }

            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string

                // Fetch additional user data
                const userData = await prisma.user.findUnique({
                    where: { id: token.id as string },
                }) as any

                if (userData) {
                    // Auto-generate username if not exists
                    if (!userData.username) {
                        const newUsername = await generateUniqueUsername(userData.name)
                        await prisma.user.update({
                            where: { id: token.id as string },
                            data: { username: newUsername }
                        })
                        session.user.username = newUsername
                    } else {
                        session.user.username = userData.username
                    }

                    session.user.isAdmin = userData.isAdmin
                    session.user.postCredits = userData.postCredits
                }
            }
            return session
        },
    },
})

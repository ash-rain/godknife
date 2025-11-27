import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
    // Use the same secret configuration as NextAuth
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        // Specify the cookie name explicitly to match NextAuth behavior
        cookieName: process.env.NODE_ENV === 'production' 
            ? '__Secure-next-auth.session-token' 
            : 'next-auth.session-token'
    })
    
    const isAuth = !!token
    const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
    const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
    const isApiAdminRoute = request.nextUrl.pathname.startsWith('/api/admin')

    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
        if (isAuth) {
            return NextResponse.redirect(new URL('/', request.url))
        }
        return NextResponse.next()
    }

    // Protect admin routes
    if (isAdminPage || isApiAdminRoute) {
        if (!isAuth) {
            return NextResponse.redirect(new URL('/auth/signin', request.url))
        }

        // Check if user is admin (you'll need to add this to the token)
        if (!token.isAdmin) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/admin/:path*',
        '/auth/:path*',
    ],
}

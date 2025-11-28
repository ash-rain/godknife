import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { canUserCreatePost } from '@/lib/post-limits'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await canUserCreatePost(session.user.id)
        
        return NextResponse.json(result)
    } catch (error) {
        console.error('Check post limit error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

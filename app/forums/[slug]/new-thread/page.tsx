import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import NewThreadPageClient from "./NewThreadPageClient"

export default async function NewThreadPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const session = await auth()

    if (!session?.user) {
        redirect(`/auth/signin?callbackUrl=/forums/${slug}/new-thread`)
    }

    const forum = await prisma.forum.findUnique({
        where: { slug, isActive: true },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true
        }
    })

    if (!forum) {
        notFound()
    }

    return <NewThreadPageClient forum={forum} />
}

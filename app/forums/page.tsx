import { prisma } from "@/lib/prisma"
import ForumList from "@/components/ForumList"

export default async function ForumsPage() {
    const forums = await prisma.forum.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
            _count: {
                select: { threads: true }
            },
            threads: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                            image: true,
                        }
                    }
                }
            }
        }
    })

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <h1 className="text-4xl font-bold mb-8">Forums</h1>
            <ForumList initialForums={forums} />
        </div>
    )
}

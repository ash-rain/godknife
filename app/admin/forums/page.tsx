import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function AdminForumsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/auth/signin')
    }

    if (!session.user.isAdmin) {
        redirect('/')
    }

    const forums = await prisma.forum.findMany({
        orderBy: { order: 'asc' },
        include: {
            _count: {
                select: { threads: true }
            }
        }
    })

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manage Forums</h1>
                <a
                    href="/admin/forums/create"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Create Forum
                </a>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium">Order</th>
                            <th className="text-left py-3 px-4 font-medium">Name</th>
                            <th className="text-left py-3 px-4 font-medium">Slug</th>
                            <th className="text-left py-3 px-4 font-medium">Threads</th>
                            <th className="text-left py-3 px-4 font-medium">Status</th>
                            <th className="text-left py-3 px-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {forums.map((forum) => (
                            <tr key={forum.id} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-3 px-4">{forum.order}</td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        {forum.icon && <span>{forum.icon}</span>}
                                        <span className="font-medium">{forum.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{forum.slug}</td>
                                <td className="py-3 px-4">{forum._count.threads}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded text-xs ${forum.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                        {forum.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex gap-2">
                                        <a
                                            href={`/admin/forums/${forum.slug}/edit`}
                                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                        >
                                            Edit
                                        </a>
                                        <a
                                            href={`/admin/forums/${forum.slug}/threads`}
                                            className="text-purple-600 dark:text-purple-400 hover:underline text-sm"
                                        >
                                            Threads
                                        </a>
                                        <a
                                            href={`/forums/${forum.slug}`}
                                            className="text-gray-600 dark:text-gray-400 hover:underline text-sm"
                                        >
                                            View
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {forums.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No forums found. Create your first forum to get started.
                    </div>
                )}
            </div>
        </div>
    )
}

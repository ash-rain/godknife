import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function AdminPostsPage({
    searchParams,
}: {
    searchParams: { page?: string; status?: string }
}) {
    const page = Number(searchParams.page) || 1
    const status = searchParams.status || 'all'
    const perPage = 20

    // Build where clause for status filter
    const where = status !== 'all' ? { status: status as any } : {}

    const [posts, totalPosts, statusCounts] = await Promise.all([
        prisma.post.findMany({
            where,
            skip: (page - 1) * perPage,
            take: perPage,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        }),
        prisma.post.count({ where }),
        prisma.post.groupBy({
            by: ['status'],
            _count: true,
        }),
    ])

    const totalPages = Math.ceil(totalPosts / perPage)

    const statusOptions = [
        { value: 'all', label: 'All Posts' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'REJECTED', label: 'Rejected' },
        { value: 'DELETED', label: 'Deleted' },
    ]

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Posts Management</h1>
                <div className="text-sm text-gray-500">
                    Total Posts: {totalPosts}
                </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {statusOptions.map((option) => {
                    const count = option.value === 'all' 
                        ? statusCounts.reduce((sum: number, s: any) => sum + s._count, 0)
                        : statusCounts.find((s: any) => s.status === option.value)?._count || 0
                    
                    return (
                        <Link
                            key={option.value}
                            href={`/admin/posts?status=${option.value}`}
                            className={`px-4 py-2 rounded-lg ${
                                status === option.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            {option.label} ({count})
                        </Link>
                    )
                })}
            </div>

            {/* Posts Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Title</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Author</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Engagement</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Views</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Created</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((post: any) => (
                                <tr key={post.id} className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="py-3 px-4">
                                        <div className="max-w-xs">
                                            <div className="font-medium truncate">{post.title}</div>
                                            <div className="text-xs text-gray-500 truncate mt-1">
                                                {post.description.substring(0, 60)}...
                                            </div>
                                            {post.isBoosted && (
                                                <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded mt-1 inline-block">
                                                    Boosted
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm">
                                            <div className="font-medium">{post.author.name}</div>
                                            <div className="text-gray-500">@{post.author.username}</div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`text-xs px-2 py-1 rounded ${
                                            post.status === 'ACTIVE'
                                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                : post.status === 'PENDING'
                                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                                : post.status === 'REJECTED'
                                                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                        }`}>
                                            {post.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                        {post._count.likes} likes · {post._count.comments} comments
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {post.views.toLocaleString()}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4">
                                        <Link
                                            href={`/posts/${post.id}`}
                                            className="text-blue-600 hover:text-blue-700 text-sm"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                        {page > 1 && (
                            <Link
                                href={`/admin/posts?page=${page - 1}${status !== 'all' ? `&status=${status}` : ''}`}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Previous
                            </Link>
                        )}
                        <span className="px-4 py-2">
                            Page {page} of {totalPages}
                        </span>
                        {page < totalPages && (
                            <Link
                                href={`/admin/posts?page=${page + 1}${status !== 'all' ? `&status=${status}` : ''}`}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Next
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

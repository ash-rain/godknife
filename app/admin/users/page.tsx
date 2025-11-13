import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: { page?: string; search?: string }
}) {
    const page = Number(searchParams.page) || 1
    const search = searchParams.search || ''
    const perPage = 20

    // Build where clause for search
    const where = search
        ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
                { username: { contains: search, mode: 'insensitive' as const } },
            ],
        }
        : {}

    const [users, totalUsers] = await Promise.all([
        prisma.user.findMany({
            where,
            skip: (page - 1) * perPage,
            take: perPage,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                createdAt: true,
                isAdmin: true,
                _count: {
                    select: {
                        posts: true,
                        likes: true,
                        comments: true,
                    },
                },
            },
        }),
        prisma.user.count({ where }),
    ])

    const totalPages = Math.ceil(totalUsers / perPage)

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Users Management</h1>
                <div className="text-sm text-gray-500">
                    Total Users: {totalUsers}
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <form method="get" className="flex gap-2">
                    <input
                        type="text"
                        name="search"
                        defaultValue={search}
                        placeholder="Search by name, email, or username..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Search
                    </button>
                    {search && (
                        <Link
                            href="/admin/users"
                            className="px-6 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
                        >
                            Clear
                        </Link>
                    )}
                </form>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold text-sm">User</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Username</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Posts</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Activity</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Joined</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Role</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user: any) => (
                                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="py-3 px-4">
                                        <div className="font-medium">{user.name || 'N/A'}</div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                        {user.email}
                                    </td>
                                    <td className="py-3 px-4">
                                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                            {user.username || 'N/A'}
                                        </code>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {user._count.posts}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                        {user._count.likes} likes · {user._count.comments} comments
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4">
                                        {user.isAdmin ? (
                                            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                                                Admin
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                                                User
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <Link
                                            href={`/u/${user.username}`}
                                            className="text-blue-600 hover:text-blue-700 text-sm"
                                        >
                                            View Profile
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
                                href={`/admin/users?page=${page - 1}${search ? `&search=${search}` : ''}`}
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
                                href={`/admin/users?page=${page + 1}${search ? `&search=${search}` : ''}`}
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

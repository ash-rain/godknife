import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function AdminPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/auth/signin')
    }

    if (!session.user.isAdmin) {
        redirect('/')
    }

    // Fetch admin dashboard data
    const [totalUsers, totalPosts, recentUsers] = await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.user.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                createdAt: true,
                isAdmin: true,
            }
        })
    ])

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Users</h3>
                    <p className="text-3xl font-bold mt-2">{totalUsers}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Posts</h3>
                    <p className="text-3xl font-bold mt-2">{totalPosts}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Admin Users</h3>
                    <p className="text-3xl font-bold mt-2">
                        {recentUsers.filter((u: any) => u.isAdmin).length}
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/admin/users"
                        className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        <h3 className="font-medium">Manage Users</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and manage all users</p>
                    </a>
                    <a
                        href="/admin/posts"
                        className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        <h3 className="font-medium">Manage Posts</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and moderate posts</p>
                    </a>
                    <a
                        href="/admin/settings"
                        className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        <h3 className="font-medium">Settings</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure system settings</p>
                    </a>
                </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4">Name</th>
                                <th className="text-left py-3 px-4">Username</th>
                                <th className="text-left py-3 px-4">Email</th>
                                <th className="text-left py-3 px-4">Joined</th>
                                <th className="text-left py-3 px-4">Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentUsers.map((user: any) => (
                                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800">
                                    <td className="py-3 px-4">{user.name || 'N/A'}</td>
                                    <td className="py-3 px-4">{user.username || 'N/A'}</td>
                                    <td className="py-3 px-4">{user.email}</td>
                                    <td className="py-3 px-4">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4">
                                        {user.isAdmin ? (
                                            <span className="text-green-600 dark:text-green-400">Yes</span>
                                        ) : (
                                            <span className="text-gray-500">No</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

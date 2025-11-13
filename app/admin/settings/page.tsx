import { prisma } from "@/lib/prisma"

export default async function AdminSettingsPage() {
    // Fetch some system stats
    const [
        totalUsers,
        totalPosts,
        totalPayments,
        recentPayments,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.payment.count(),
        prisma.payment.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        }),
    ])

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="space-y-6">
                {/* System Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">System Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
                            <div className="text-2xl font-bold mt-1">{totalUsers.toLocaleString()}</div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Posts</div>
                            <div className="text-2xl font-bold mt-1">{totalPosts.toLocaleString()}</div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Payments</div>
                            <div className="text-2xl font-bold mt-1">{totalPayments.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Recent Payments */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Payments</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="text-left py-2 text-sm font-semibold">User</th>
                                    <th className="text-left py-2 text-sm font-semibold">Type</th>
                                    <th className="text-left py-2 text-sm font-semibold">Amount</th>
                                    <th className="text-left py-2 text-sm font-semibold">Status</th>
                                    <th className="text-left py-2 text-sm font-semibold">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPayments.map((payment: any) => (
                                    <tr key={payment.id} className="border-b border-gray-100 dark:border-gray-700">
                                        <td className="py-3">
                                            <div className="text-sm">
                                                <div className="font-medium">{payment.user.name}</div>
                                                <div className="text-gray-500 text-xs">{payment.user.email}</div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-sm">{payment.type}</td>
                                        <td className="py-3 text-sm font-medium">
                                            ${payment.amount.toFixed(2)}
                                        </td>
                                        <td className="py-3">
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                payment.status === 'COMPLETED'
                                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                    : payment.status === 'PENDING'
                                                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                                    : payment.status === 'FAILED'
                                                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                            }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(payment.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Site Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Site Settings</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                                <div className="font-medium">Maintenance Mode</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Disable site for maintenance
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500">
                                Disabled
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                                <div className="font-medium">User Registration</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Allow new users to register
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                                Enabled
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                                <div className="font-medium">Post Moderation</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Require admin approval for new posts
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500">
                                Disabled
                            </button>
                        </div>
                    </div>
                </div>

                {/* Environment Variables Status */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Environment Status</h2>
                    <div className="space-y-2">
                        <EnvStatus name="DATABASE_URL" value={process.env.DATABASE_URL} />
                        <EnvStatus name="NEXTAUTH_SECRET" value={process.env.NEXTAUTH_SECRET} />
                        <EnvStatus name="NEXTAUTH_URL" value={process.env.NEXTAUTH_URL} />
                        <EnvStatus name="MINIO_ENDPOINT" value={process.env.MINIO_ENDPOINT} />
                        <EnvStatus name="MINIO_ACCESS_KEY" value={process.env.MINIO_ACCESS_KEY} />
                        <EnvStatus name="PAYPAL_CLIENT_ID" value={process.env.PAYPAL_CLIENT_ID} />
                        <EnvStatus name="PUSHER_APP_ID" value={process.env.PUSHER_APP_ID} />
                    </div>
                </div>
            </div>
        </div>
    )
}

function EnvStatus({ name, value }: { name: string; value?: string }) {
    const isSet = !!value
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <code className="text-sm">{name}</code>
            <span className={`text-xs px-2 py-1 rounded ${
                isSet
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
                {isSet ? 'Set' : 'Not Set'}
            </span>
        </div>
    )
}

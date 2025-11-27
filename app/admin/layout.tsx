import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Users, FileText, Settings, MessageSquare, FileCode } from "lucide-react"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect('/auth/signin')
    }

    if (!session.user.isAdmin) {
        redirect('/')
    }

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/posts', label: 'Posts', icon: FileText },
        { href: '/admin/forums', label: 'Forums', icon: MessageSquare },
        { href: '/admin/pages', label: 'Pages', icon: FileCode },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {session.user.name}
                        </p>
                    </div>
                    <nav className="px-4 pb-4">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center px-4 py-3 mb-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Icon className="h-5 w-5 mr-3" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>
                    <div className="px-4 mt-auto">
                        <Link
                            href="/"
                            className="flex items-center px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            ← Back to Site
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/components/LanguageProvider'
import Navigation from '@/components/Navigation'
import { Send, Search, ArrowLeft } from 'lucide-react'
import { getPusherClient } from '@/lib/pusher'

interface User {
    id: string
    name: string
    username: string
    image: string | null
}

interface Message {
    id: string
    content: string
    senderId: string
    conversationId: string
    createdAt: string
    sender: User
}

interface Conversation {
    id: string
    participants: Array<{
        user: User
    }>
    messages: Message[]
    updatedAt: string
}

export default function MessagesPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { t } = useLanguage()
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showMobileConversations, setShowMobileConversations] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const pusherRef = useRef<any>(null)
    const channelRef = useRef<any>(null)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
        }
    }, [status, router])

    // Fetch conversations
    useEffect(() => {
        if (status === 'authenticated') {
            fetchConversations()
        }
    }, [status])

    // Setup Pusher for real-time messages
    useEffect(() => {
        if (!selectedConversation || !session?.user?.id) return

        pusherRef.current = getPusherClient()
        channelRef.current = pusherRef.current.subscribe(
            `conversation-${selectedConversation.id}`
        )

        channelRef.current.bind('new-message', (message: Message) => {
            setMessages((prev) => [...prev, message])
        })

        return () => {
            if (channelRef.current) {
                channelRef.current.unbind('new-message')
                pusherRef.current?.unsubscribe(`conversation-${selectedConversation.id}`)
            }
        }
    }, [selectedConversation, session])

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchConversations = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/conversations')
            if (res.ok) {
                const data = await res.json()
                setConversations(data)
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchMessages = async (conversationId: string) => {
        try {
            const res = await fetch(`/api/conversations/${conversationId}/messages`)
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        }
    }

    const handleSelectConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation)
        setMessages([])
        fetchMessages(conversation.id)
        setShowMobileConversations(false)
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedConversation || sending) return

        setSending(true)
        try {
            const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: newMessage,
                }),
            })

            if (res.ok) {
                setNewMessage('')
            }
        } catch (error) {
            console.error('Failed to send message:', error)
        } finally {
            setSending(false)
        }
    }

    const getOtherParticipant = (conversation: Conversation) => {
        return conversation.participants.find(
            (p) => p.user.id !== session?.user?.id
        )?.user
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInMs = now.getTime() - date.getTime()
        const diffInHours = diffInMs / (1000 * 60 * 60)

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } else if (diffInHours < 168) {
            return date.toLocaleDateString([], { weekday: 'short' })
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
        }
    }

    const linkifyText = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const parts = text.split(urlRegex)

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:opacity-80"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                )
            }
            return part
        })
    }

    const filteredConversations = conversations.filter((conv) => {
        const otherUser = getOtherParticipant(conv)
        return (
            otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })

    if (status === 'loading' || loading) {
        return (
            <>
                <Navigation />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-gray-500">{t('common.loading')}</div>
                </div>
            </>
        )
    }

    return (
        <>
            <Navigation />
            <div className="flex h-[calc(100vh-64px)] bg-white">
                {/* Conversations Sidebar */}
                <div
                    className={`${showMobileConversations ? 'block' : 'hidden'
                        } md:block md:w-[360px] border-r border-gray-200 flex flex-col w-full`}
                >
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-gray-200">
                        <h1 className="text-2xl font-bold mb-4">{t('messages.conversations')}</h1>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('common.search')}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                <p className="text-gray-500 mb-2">{t('messages.noConversations')}</p>
                                <p className="text-sm text-gray-400">{t('messages.startConversation')}</p>
                            </div>
                        ) : (
                            filteredConversations.map((conversation) => {
                                const otherUser = getOtherParticipant(conversation)
                                const lastMessage = conversation.messages[0]
                                const isSelected = selectedConversation?.id === conversation.id

                                return (
                                    <div
                                        key={conversation.id}
                                        onClick={() => handleSelectConversation(conversation)}
                                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition ${isSelected ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden">
                                                {otherUser?.image ? (
                                                    <img
                                                        src={otherUser.image}
                                                        alt={otherUser.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold text-lg">
                                                        {otherUser?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Online indicator (can be implemented later) */}
                                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                        </div>

                                        {/* Conversation Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {otherUser?.name || 'Unknown User'}
                                                </h3>
                                                {lastMessage && (
                                                    <span className="text-xs text-gray-500 ml-2 shrink-0">
                                                        {formatTime(lastMessage.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            {lastMessage && (
                                                <p className="text-sm text-gray-600 truncate">
                                                    {lastMessage.senderId === session?.user?.id && 'You: '}
                                                    {lastMessage.content}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div
                    className={`${showMobileConversations ? 'hidden' : 'flex'
                        } md:flex flex-1 flex-col`}
                >
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                                <div className="flex items-center gap-3">
                                    {/* Back button for mobile */}
                                    <button
                                        onClick={() => setShowMobileConversations(true)}
                                        className="md:hidden p-2 hover:bg-gray-100 rounded-full"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>

                                    {/* User Info */}
                                    {getOtherParticipant(selectedConversation)?.username ? (
                                        <Link
                                            href={`/users/${getOtherParticipant(selectedConversation)!.username}`}
                                            className="flex items-center gap-3 hover:opacity-80 transition"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                {getOtherParticipant(selectedConversation)?.image ? (
                                                    <img
                                                        src={getOtherParticipant(selectedConversation)!.image!}
                                                        alt={getOtherParticipant(selectedConversation)?.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
                                                        {getOtherParticipant(selectedConversation)?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h2 className="font-semibold text-gray-900">
                                                    {getOtherParticipant(selectedConversation)?.name}
                                                </h2>
                                                <p className="text-xs text-green-600">Active now</p>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                {getOtherParticipant(selectedConversation)?.image ? (
                                                    <img
                                                        src={getOtherParticipant(selectedConversation)!.image!}
                                                        alt={getOtherParticipant(selectedConversation)?.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-semibold">
                                                        {getOtherParticipant(selectedConversation)?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h2 className="font-semibold text-gray-900">
                                                    {getOtherParticipant(selectedConversation)?.name}
                                                </h2>
                                                <p className="text-xs text-green-600">Active now</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                <div className="max-w-4xl mx-auto space-y-2">
                                    {messages.map((message) => {
                                        const isOwn = message.senderId === session?.user?.id
                                        return (
                                            <div
                                                key={message.id}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${isOwn
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white text-gray-900'
                                                        }`}
                                                >
                                                    <p className="break-all whitespace-pre-wrap">
                                                        {linkifyText(message.content)}
                                                    </p>
                                                    <p
                                                        className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'
                                                            }`}
                                                    >
                                                        {formatTime(message.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Message Input */}
                            <div className="p-4 bg-white border-t border-gray-200">
                                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder={t('messages.typeMessage')}
                                                className="flex-1 bg-transparent outline-none"
                                                disabled={sending}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || sending}
                                            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                                        >
                                            <Send className="h-5 w-5" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Send className="h-12 w-12 text-gray-400" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                    {t('messages.conversations')}
                                </h2>
                                <p className="text-gray-500">{t('messages.startConversation')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

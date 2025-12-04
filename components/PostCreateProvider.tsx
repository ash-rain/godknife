'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import PostCreateModal from './PostCreateModal'

interface PostCreateContextType {
    showModal: boolean
    openModal: () => void
    closeModal: () => void
    onPostCreated?: () => void
    setOnPostCreated: (callback: (() => void) | undefined) => void
}

const PostCreateContext = createContext<PostCreateContextType | undefined>(undefined)

export function usePostCreate() {
    const context = useContext(PostCreateContext)
    if (!context) {
        throw new Error('usePostCreate must be used within PostCreateProvider')
    }
    return context
}

interface PostCreateProviderProps {
    children: ReactNode
}

export function PostCreateProvider({ children }: PostCreateProviderProps) {
    const [showModal, setShowModal] = useState(false)
    const [onPostCreated, setOnPostCreated] = useState<(() => void) | undefined>(undefined)

    const openModal = () => setShowModal(true)
    const closeModal = () => {
        setShowModal(false)
        setOnPostCreated(undefined)
    }

    const handleSuccess = () => {
        if (onPostCreated) {
            onPostCreated()
        }
        closeModal()
    }

    return (
        <PostCreateContext.Provider
            value={{
                showModal,
                openModal,
                closeModal,
                onPostCreated,
                setOnPostCreated,
            }}
        >
            {children}
            {showModal && (
                <PostCreateModal
                    onClose={closeModal}
                    onSuccess={handleSuccess}
                />
            )}
        </PostCreateContext.Provider>
    )
}

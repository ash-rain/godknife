'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

type Language = 'en' | 'bg'

interface LanguageContextType {
    language: Language
    locale: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en')
    const [translations, setTranslations] = useState<any>({})
    const pathname = usePathname()

    useEffect(() => {
        // Load language from cookie
        const savedLang = document.cookie
            .split('; ')
            .find(row => row.startsWith('language='))
            ?.split('=')[1] as Language | undefined

        if (savedLang && (savedLang === 'en' || savedLang === 'bg')) {
            setLanguageState(savedLang)
        }
    }, [])

    useEffect(() => {
        // Load translations
        import(`@/messages/${language}.json`).then(module => {
            setTranslations(module.default)
        })
    }, [language])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        document.cookie = `language=${lang}; path=/; max-age=31536000`
    }

    const t = (key: string): string => {
        const keys = key.split('.')
        let value = translations

        for (const k of keys) {
            value = value?.[k]
        }

        return value || key
    }

    return (
        <LanguageContext.Provider value={{ language, locale: language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider')
    }
    return context
}

import { createContext, useContext } from 'react'
import type { ActivityEvent, ContentItem } from '../shared/types/product'
import type { TranslationKey } from './translations'

export type InterfaceLanguage = 'en' | 'ru' | 'ro'
export function outputLanguageForInterface(language: InterfaceLanguage) {
  return { en: 'English', ru: 'Russian', ro: 'Romanian' }[language]
}
export type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string

export type I18nContextValue = {
  language: InterfaceLanguage
  setLanguage: (language: InterfaceLanguage) => void
  t: Translate
  label: (value: string) => string
  activity: (event: ActivityEvent) => string
  formatDateTime: (value: string) => string
  contentTime: (item: ContentItem) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('I18nProvider is missing')
  return context
}

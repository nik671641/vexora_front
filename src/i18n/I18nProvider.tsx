import { useEffect, useState, type ReactNode } from 'react'
import type { ActivityCode } from '../shared/types/product'
import { translations, type TranslationKey } from './translations'
import { I18nContext, type InterfaceLanguage, type Translate } from './context'

const localeTags: Record<InterfaceLanguage, string> = { en: 'en-US', ru: 'ru-RU', ro: 'ro-RO' }
const statusKeys: Record<string, TranslationKey> = {
  draft: 'Draft',
  awaiting_company: 'Awaiting company',
  awaiting_company_confirmation: 'Awaiting company confirmation',
  researching: 'Researching',
  idea_ready: 'Idea ready',
  generating: 'Generating',
  preview_ready: 'Preview ready',
  publishing: 'Publishing',
  scheduled: 'Scheduled',
  published: 'Published',
  failed: 'Failed',
  cancelled: 'Cancelled',
}
const activityKeys: Record<ActivityCode, TranslationKey> = {
  briefStarted: 'Brief started.',
  researchStarted: 'Research started from brief and company profile.',
  researchFinished: 'Research finished. Idea is ready for review.',
  generationStarted: 'Idea approved. Preview generation started.',
  previewReady: 'Preview package is ready for editing.',
  filesAttached: '{count} local reference files attached.',
  ideaRegenerated: 'Idea regeneration requested.',
  workflowCancelled: 'Workflow cancelled.',
  newIdeaRequested: 'New idea requested from the brief.',
  draftSaved: 'Preview draft saved locally.',
  scheduledDemo: 'Scheduled locally for the selected time (demo).',
  publishedDemo: 'Marked as published locally (demo).',
  contentEdited: 'Caption and hashtags edited in Content.',
  sampleScheduled: 'Scheduled for the next publishing slot.',
  sampleApproved: 'Preview approved.',
  sampleWaiting: 'Preview waiting for approval.',
  sampleFailed: 'Sample publishing attempt failed.',
}

function initialLanguage(): InterfaceLanguage {
  try {
    const stored = localStorage.getItem('vexora-interface-language')
    if (stored === 'en' || stored === 'ru' || stored === 'ro') return stored
  } catch {
    // Private browsing can block storage. Language selection still works in memory.
  }
  const browser = navigator.language.slice(0, 2)
  return browser === 'ru' || browser === 'ro' ? browser : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<InterfaceLanguage>(initialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    try {
      localStorage.setItem('vexora-interface-language', language)
    } catch {
      // Keep the current language even when storage is unavailable.
    }
  }, [language])

  const t: Translate = (key, params) => {
    const template = language === 'en' ? key : translations[key][language]
    return template.replace(/\{(\w+)\}/g, (match, name: string) => String(params?.[name] ?? match))
  }

  const label = (value: string) => {
    const key = statusKeys[value] ?? (Object.hasOwn(translations, value) ? value as TranslationKey : null)
    return key ? t(key) : value
  }

  const formatDateTime = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat(localeTags[language], { dateStyle: 'medium', timeStyle: 'short' }).format(date)
  }

  return (
    <I18nContext.Provider value={{
      language,
      setLanguage,
      t,
      label,
      activity: (event) => t(activityKeys[event.code], { count: event.count ?? 0 }),
      formatDateTime,
      contentTime: (item) => item.scheduledFor ? formatDateTime(item.scheduledFor) : label(item.time),
    }}>
      {children}
    </I18nContext.Provider>
  )
}

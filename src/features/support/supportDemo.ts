import type { Translate } from '../../i18n/context'
import type { TranslationKey } from '../../i18n/translations'

export type SupportMessage = {
  id: number
  role: 'user' | 'assistant'
  text?: string
  replyKey?: TranslationKey
}

export const suggestedQuestions = [
  'How do I create content?',
  'Are my changes saved?',
  'Can Vexora publish real posts now?',
] as const satisfies readonly TranslationKey[]

const demoAnswers = {
  'How do I create content?': 'Start with a company profile, open Create, write a brief and move through the review steps.',
  'Are my changes saved?': 'This prototype keeps workspace changes only until the page is reloaded. Interface language is saved in this browser.',
  'Can Vexora publish real posts now?': 'Generation and scheduling use the backend. Real publishing requires a connected provider account and a successful readiness check.',
  'Where can I change my profile picture?': 'Open My profile from the avatar menu and choose a PNG, JPG or WebP image.',
} as const satisfies Partial<Record<TranslationKey, TranslationKey>>

export function getDemoReply(question: string, t: Translate): TranslationKey {
  const normalized = question.trim().toLocaleLowerCase()
  const match = (Object.keys(demoAnswers) as (keyof typeof demoAnswers)[])
    .find((key) => key.toLocaleLowerCase() === normalized || t(key).toLocaleLowerCase() === normalized)
  return match ? demoAnswers[match] : 'Demo replies cover the suggested questions only. AI support is not connected yet.'
}

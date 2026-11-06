import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useI18n, type Translate } from '../../i18n/context'
import { suggestedQuestions, type SupportMessage } from './supportDemo'
import './SupportChat.css'

type SupportChatProps = {
  mode: 'page' | 'widget'
  messages: SupportMessage[]
  onSend: (text: string) => void
  /** Override translator. Useful on the marketing landing, which is always English. */
  t?: Translate
}

function ChatBody({ messages, onSend, mode, onClose, active = true, t: tOverride }: SupportChatProps & { onClose?: () => void; active?: boolean }) {
  const { t: contextT } = useI18n()
  const t = tOverride ?? contextT
  const [draft, setDraft] = useState('')
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (messages.length && messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages.length])
  useEffect(() => { if (mode === 'widget' && active) inputRef.current?.focus() }, [mode, active])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const question = draft.trim()
    if (!question) return
    onSend(question)
    setDraft('')
    inputRef.current?.focus()
  }

  return (
    <section className={`support-chat support-chat--${mode}`} aria-label={t('Support chat')}>
      <header className="support-chat-header">
        <div><h3>{t('Support chat')}</h3><span>{t('Demo assistant')}</span></div>
        {onClose && <button className="support-chat-close" type="button" onClick={onClose} aria-label={t('Close chat')}>×</button>}
      </header>
      <p className="support-chat-disclaimer">{t('This chat shows demo answers only. AI support will be connected later.')}</p>
      <div className="support-chat-messages" ref={messagesRef} role="log" aria-live="polite" aria-relevant="additions text">
        <div className="support-chat-bubble support-chat-bubble--assistant">{t('Hi! I can help with a few questions about this Vexora demo.')}</div>
        {messages.map((message) => (
          <div className={`support-chat-bubble support-chat-bubble--${message.role}`} key={message.id}>
            {message.replyKey ? t(message.replyKey) : message.text}
          </div>
        ))}
      </div>
      {messages.length === 0 && <div className="support-chat-suggestions">
        {suggestedQuestions.map((question) => <button key={question} type="button" onClick={() => onSend(t(question))}>{t(question)}</button>)}
      </div>}
      <form className="support-chat-form" onSubmit={submit}>
        <input ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t('Ask about Vexora...')} aria-label={t('Your question')} maxLength={500} />
        <button type="submit" disabled={!draft.trim()} aria-label={t('Send message')}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 12 16-8-4 16-3.5-6.5L4 12Zm8.5 1.5L20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </form>
    </section>
  )
}

export function SupportChat({ mode, messages, onSend, t: tOverride }: SupportChatProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const launcherRef = useRef<HTMLButtonElement>(null)

  function closeChat() {
    setOpen(false)
    requestAnimationFrame(() => launcherRef.current?.focus())
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        requestAnimationFrame(() => launcherRef.current?.focus())
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (mode === 'page') return <ChatBody mode="page" messages={messages} onSend={onSend} t={tOverride} />

  return <div className={`support-chat-widget${open ? ' is-open' : ''}`}>
    <div className="support-chat-widget-panel" inert={!open} aria-hidden={!open}>
      <ChatBody mode="widget" messages={messages} onSend={onSend} onClose={closeChat} active={open} t={tOverride} />
    </div>
    <button ref={launcherRef} className="support-chat-launcher" type="button" onClick={() => setOpen(true)} aria-label={t('Open support chat')} aria-expanded={open}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.8-3.2A7.5 7.5 0 1 1 20 11.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M9 11.5h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
    </button>
  </div>
}

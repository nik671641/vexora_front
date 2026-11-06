import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { removeAvatar, toWorkspaceUser, updateProfile, uploadAvatar as uploadAvatarFile } from '../../api/auth'
import { useI18n } from '../../i18n/context'
import type { TranslationKey } from '../../i18n/translations'
import type { AccountPageId, Company, DemoUser, ViewId } from '../../shared/types/product'
import type { SupportMessage } from '../support/supportDemo'
import { SupportChat } from '../support/SupportChat'
import './AccountPages.css'

const SETTINGS_SECTIONS: { id: AccountPageId; icon: string; title: TranslationKey }[] = [
  { id: 'general', icon: 'tune', title: 'General' },
  { id: 'plan', icon: 'workspace_premium', title: 'Plan & Credits' },
  { id: 'credits', icon: 'receipt_long', title: 'Credit Costs' },
  { id: 'usage', icon: 'insights', title: 'Usage' },
]

type AccountPagesProps = {
  page: AccountPageId
  currentCompany: Company
  user: DemoUser
  onUserChange: (changes: Partial<DemoUser>) => void
  onPageChange: (page: AccountPageId) => void
  onSupportSend: (text: string) => void
  onViewChange: (view: ViewId) => void
  onSignOut: () => void
  supportMessages: SupportMessage[]
}

const imageTypes = ['image/png', 'image/jpeg', 'image/webp']
const maxImageBytes = 2 * 1024 * 1024

export function AccountPages({ page, currentCompany, user, onUserChange, onPageChange, onSignOut, onViewChange, supportMessages, onSupportSend }: AccountPagesProps) {
  const { language, t } = useI18n()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [message, setMessage] = useState<TranslationKey | null>(null)
  const [imageError, setImageError] = useState<TranslationKey | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)
  const avatarLetter = Array.from(user.name.trim())[0]?.toLocaleUpperCase(language) ?? 'G'

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApiError(null)
    setMessage(null)
    if (name.trim().length < 2) {
      setMessage('Enter at least 2 characters.')
      return
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage('Enter a valid email address.')
      return
    }
    if (!user.id) {
      onUserChange({ name: name.trim(), email: email.trim() })
      setMessage('Profile saved for this session.')
      return
    }
    setBusy(true)
    try {
      const profile = await updateProfile({ name: name.trim(), email: email.trim() })
      onUserChange(toWorkspaceUser(profile))
      setMessage('Profile saved to your account.')
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!imageTypes.includes(file.type) || file.size > maxImageBytes) {
      setImageError('Choose a PNG, JPG or WebP image under 2 MB.')
      return
    }
    setImageError(null)
    setApiError(null)
    setMessage(null)
    if (user.id) {
      setBusy(true)
      try {
        const profile = await uploadAvatarFile(file)
        onUserChange(toWorkspaceUser(profile, true))
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Upload failed')
      } finally {
        setBusy(false)
      }
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onUserChange({ avatarUrl: reader.result })
      else setImageError('Could not read this image. Try another file.')
    }
    reader.onerror = () => setImageError('Could not read this image. Try another file.')
    reader.readAsDataURL(file)
  }

  async function deleteAvatar() {
    setMessage(null)
    if (!user.id) {
      onUserChange({ avatarUrl: undefined })
      return
    }
    setApiError(null)
    setBusy(true)
    try {
      await removeAvatar()
      onUserChange({ avatarUrl: undefined })
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  const sectionDescription: Record<AccountPageId, TranslationKey> = {
    general: 'How you appear in the app and to your team.',
    plan: 'Your plan, credits balance and what you use them for.',
    credits: 'How many credits each AI action uses.',
    usage: 'Credits spend and transaction history.',
    support: 'Find answers and learn your way around the demo.',
  }

  /* The support page keeps its own standalone layout. */
  if (page === 'support') {
    return (
      <>
        <div className="account-page account-page--support">
          <header className="page-hero account-page-hero">
            <div>
              <p className="eyebrow">{t('YOUR ACCOUNT')}</p>
              <h2>{t('Help and support')}</h2>
              <p>{t('Find answers and learn your way around the demo.')}</p>
            </div>
            <span className="account-page-badge">{user.id ? t('Vexora account') : t('Local demo')}</span>
          </header>
          <div className="account-page-grid">
            <section className="panel account-card account-help">
              <h3>{t('Frequently asked questions')}</h3>
              <details><summary>{t('How do I create content?')}</summary><p>{t('Start with a company profile, open Create, write a brief and move through the review steps.')}</p></details>
              <details><summary>{t('Are my changes saved?')}</summary><p>{t('This prototype keeps workspace changes only until the page is reloaded. Interface language is saved in this browser.')}</p></details>
              <details><summary>{t('Can Vexora publish real posts now?')}</summary><p>{t('Generation and scheduling use the backend. Real publishing requires a connected provider account and a successful readiness check.')}</p></details>
              <details><summary>{t('Where can I change my profile picture?')}</summary><p>{t('Open My profile from the avatar menu and choose a PNG, JPG or WebP image.')}</p></details>
            </section>
            <aside className="panel account-side-card">
              <span className="account-side-icon" aria-hidden="true">?</span>
              <h3>{t('Need a starting point?')}</h3>
              <p>{t('Explore the creation flow or set up your first company profile.')}</p>
              <div className="account-side-actions">
                <button className="secondary-button" onClick={() => onViewChange('create')} type="button">{t('Open Create')}</button>
                <button className="account-text-button" onClick={() => onViewChange('companies')} type="button">{t('Open Companies')} →</button>
              </div>
              <p className="account-support-note">{t('Direct support requests are not connected yet.')}</p>
            </aside>
          </div>
        </div>
        <SupportChat mode="page" messages={supportMessages} onSend={onSupportSend} />
      </>
    )
  }

  const current = SETTINGS_SECTIONS.find((section) => section.id === page) ?? SETTINGS_SECTIONS[0]
  const fieldError = apiError || (imageError ? t(imageError) : null)

  return (
    <div className="account-page">
      <header className="page-hero account-page-hero">
        <div>
          <p className="eyebrow">{t('SETTINGS')}</p>
          <h2>{t(current.title)}</h2>
          <p>{t(sectionDescription[page])}</p>
        </div>
        <span className="account-page-badge">{user.id ? t('Vexora account') : t('Local demo')}</span>
      </header>

      <div className="settings-layout">
        <aside className="settings-nav" aria-label={t('Settings sections')}>
          <nav className="settings-nav-list">
            {SETTINGS_SECTIONS.map((section) => (
              <button
                aria-current={page === section.id ? 'page' : undefined}
                className={`settings-nav-item ${page === section.id ? 'settings-nav-item--active' : ''}`}
                key={section.id}
                onClick={() => onPageChange(section.id)}
                type="button"
              >
                <span className="material-symbols-outlined" aria-hidden="true">{section.icon}</span>
                <span>{t(section.title)}</span>
              </button>
            ))}
          </nav>
          <button className="settings-nav-item settings-nav-logout" onClick={onSignOut} type="button">
            <span className="material-symbols-outlined" aria-hidden="true">logout</span>
            <span>{t('Log out')}</span>
          </button>
        </aside>

        <section className="settings-content">
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex flex-col gap-1">
              <h3 className="text-headline-md font-headline-md font-semibold text-text-primary">{t(current.title)}</h3>
              <p className="text-body-sm font-body-sm text-text-muted">{t(sectionDescription[page])}</p>
            </div>

            {page === 'general' && (
              <div className="rounded-xl bg-surface-layer-1 border border-border-structural p-6 flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-border-structural/50">
                  <button
                    className="account-avatar-preview account-avatar-preview--button"
                    type="button"
                    onClick={() => uploadRef.current?.click()}
                    aria-label={t('Choose profile picture')}
                  >
                    {user.avatarUrl ? <img alt="" src={user.avatarUrl} /> : avatarLetter}
                    <span className="account-avatar-overlay" aria-hidden="true">
                      <span className="material-symbols-outlined">photo_camera</span>
                    </span>
                  </button>
                  <div className="flex flex-col gap-2.5 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <input accept="image/png,image/jpeg,image/webp" aria-label={t('Choose profile picture')} className="visually-hidden" onChange={uploadAvatar} ref={uploadRef} type="file" />
                      <button className="secondary-button" disabled={busy} onClick={() => uploadRef.current?.click()} type="button">{t('Upload new')}</button>
                      {user.avatarUrl && <button className="ghost-button" disabled={busy} onClick={deleteAvatar} type="button">{t('Remove')}</button>}
                    </div>
                    <p className="text-body-sm font-body-sm text-text-muted">{t('JPEG, PNG, or WEBP. Max 2 MB. Square images look best.')}</p>
                  </div>
                </div>

                {fieldError && <p className="text-label-sm font-label-sm font-bold text-status-critical" role="alert">{fieldError}</p>}

                <form className="flex flex-col gap-4" onSubmit={saveProfile}>
                  <div className="grid gap-1.5">
                    <span className="text-label-md font-label-md text-text-primary">{t('Full Name')}</span>
                    <input autoComplete="name" className="h-11 rounded-lg px-3" onChange={(event) => { setName(event.target.value); setMessage(null) }} value={name} />
                  </div>
                  <div className="grid gap-1.5">
                    <span className="text-label-md font-label-md text-text-primary">{t('Email Address')}</span>
                    <input autoComplete="email" className="h-11 rounded-lg px-3" onChange={(event) => { setEmail(event.target.value); setMessage(null) }} type="email" value={email} />
                    <span className="text-body-sm font-body-sm text-text-muted">{t('Managed by your sign-in provider.')}</span>
                  </div>
                  <div className="flex items-center gap-3.5 mt-1">
                    <button className="primary-button" disabled={busy} type="submit">{t('Save Changes')}</button>
                    {message && <span aria-live="polite" className="text-label-md font-label-md font-semibold text-status-operational">{t(message)}</span>}
                  </div>
                </form>
              </div>
            )}

            {page === 'plan' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-surface-layer-1 border border-border-structural p-6 flex flex-col gap-3.5 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-accent-orange-core/10 blur-2xl pointer-events-none" />
                  <span className="text-[11px] font-bold tracking-wider text-text-muted uppercase">{t('Your plan')}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-headline-xl font-headline-xl font-bold text-text-primary tracking-tight">{t('Planned')}</span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-status-operational/15 text-status-operational border border-status-operational/30">{t('Active')}</span>
                  </div>
                  <p className="text-body-sm font-body-sm text-text-muted leading-relaxed">{t('A few credits to try the studio. No card required.')}</p>
                  <span className="text-label-sm font-label-sm text-text-muted">{t('Pricing is a product preview; automated billing is not enabled yet.')}</span>
                  <button className="self-start h-10 px-4 rounded-lg bg-accent-orange-core hover:bg-accent-orange-deep text-text-primary text-label-md font-label-md font-bold amber-glow-btn transition-colors" type="button" disabled>{t('Upgrade plan')}</button>
                </div>

                <div className="rounded-xl bg-surface-layer-1 border border-border-structural p-6 flex flex-col gap-3.5 relative overflow-hidden">
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-accent-amber-glow/10 blur-2xl pointer-events-none" />
                  <span className="text-[11px] font-bold tracking-wider text-text-muted uppercase">{t('AI credits')}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-metric-num font-metric-num font-bold text-text-primary">{new Intl.NumberFormat(language).format(currentCompany.credits ?? 0)}</span>
                    <span className="text-label-md font-label-md text-text-muted">{t('remaining')}</span>
                  </div>
                  <p className="text-body-sm font-body-sm text-text-muted leading-relaxed">{currentCompany.name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <button className="h-10 px-4 rounded-lg bg-surface-layer-2 hover:bg-surface-layer-3 border border-border-interactive text-text-primary text-label-md font-label-md font-bold transition-colors" type="button" disabled>{t('Buy credits')}</button>
                    <button className="text-label-md font-label-md font-bold text-accent-amber-glow hover:underline" type="button" onClick={() => onViewChange('models')}>{t('What things cost')}</button>
                  </div>
                </div>
              </div>
            )}

            {page === 'credits' && (
              <div className="rounded-xl bg-surface-layer-1 border border-border-structural p-6 flex flex-col">
                <p>{t('Estimate uses the selected model price. Final billing is confirmed by the server.')}</p>
                <button className="secondary-button" type="button" onClick={() => onViewChange('models')}>{t('Models')} →</button>
                <p className="text-body-sm font-body-sm text-text-muted mt-4">{t('Pricing is a product preview; automated billing is not enabled yet.')}</p>
              </div>
            )}

            {page === 'usage' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-surface-layer-1 border border-border-structural p-6 flex flex-col gap-3.5 relative overflow-hidden">
                  <span className="text-[11px] font-bold tracking-wider text-text-muted uppercase">{t('Usage')}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-metric-num font-metric-num font-bold text-text-primary">—</span>
                    <span className="text-label-md font-label-md text-text-muted">{t('credits used in the last 30 days')}</span>
                  </div>
                  <p className="text-body-sm font-body-sm text-text-muted leading-relaxed">{t('Frontend and backend integration pending')}</p>
                </div>
                <div className="rounded-xl bg-surface-layer-1 border border-border-structural p-6 flex flex-col gap-3 relative overflow-hidden">
                  <span className="text-[11px] font-bold tracking-wider text-text-muted uppercase">{t('Recent Activity')}</span>
                  <p className="text-body-sm font-body-sm text-text-muted">{t('Last 50 credit transactions.')}</p>
                  <div className="mt-1 flex flex-col items-center justify-center gap-2 border border-dashed border-border-structural rounded-lg py-9 text-text-muted">
                    <span className="material-symbols-outlined text-[26px]" aria-hidden="true">receipt_long</span>
                    <span className="text-label-md font-label-md">{t('Frontend and backend integration pending')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AccountPageId, Company, DemoUser, ViewId } from '../../shared/types/product'
import { navItems } from '../navigation'
import { Select } from '../../shared/components/Select'
import { useI18n, type InterfaceLanguage } from '../../i18n/context'
import { updateProfile } from '../../api/auth'

/* Material Symbols glyphs matching the reference Service Master chrome. */
const NAV_GLYPHS: Partial<Record<ViewId, string>> = {
  dashboard: 'dashboard',
  companies: 'business',
  content: 'video_library',
  approvals: 'approval',
  calendar: 'calendar_month',
  references: 'auto_stories',
  models: 'neurology',
  accounts: 'share',
  settings: 'tune',
}

const LANG_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
  { value: 'ro', label: 'RO' },
]

type ColorTheme = 'dark' | 'light'

function storedTheme(): ColorTheme {
  try {
    return window.localStorage.getItem('vexora-theme') === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function formatCredits(value: number, language: InterfaceLanguage) {
  const locale = language === 'ru' ? 'ru-RU' : language === 'ro' ? 'ro-RO' : 'en-US'
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
}

export function AppShell({
  activeView,
  activeAccountPage,
  activeCompany,
  companies,
  children,
  user,
  queueCount,
  onSignOut,
  onCompanyChange,
  onViewChange,
  onAccountPageChange,
}: {
  activeView: ViewId
  activeAccountPage: AccountPageId | null
  activeCompany: string
  companies: Company[]
  children: ReactNode
  user: DemoUser
  queueCount: number
  onSignOut: () => void
  onCompanyChange: (companyName: string) => void
  onViewChange: (viewId: ViewId) => void
  onAccountPageChange: (page: AccountPageId) => void
}) {
  const { language, setLanguage, t } = useI18n()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [theme, setTheme] = useState<ColorTheme>(storedTheme)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const avatarButtonRef = useRef<HTMLButtonElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const notificationsButtonRef = useRef<HTMLButtonElement>(null)
  const avatarLetter = Array.from(user.name.trim())[0]?.toLocaleUpperCase(language) ?? 'G'
  const selectedCompany = companies.find((company) => (company.id ?? company.name) === activeCompany) ?? companies[0]
  const creditBalance = selectedCompany?.credits ?? 0

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    try {
      window.localStorage.setItem('vexora-theme', theme)
    } catch {
      // Theme still works for this session when storage is unavailable.
    }
  }, [theme])

  useEffect(() => {
    if (!mobileNavOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [mobileNavOpen])

  useEffect(() => {
    if (!accountMenuOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false)
        avatarButtonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountMenuOpen])

  useEffect(() => {
    if (!notificationsOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) setNotificationsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false)
        notificationsButtonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [notificationsOpen])

  function openAccountPage(page: AccountPageId) {
    setAccountMenuOpen(false)
    onAccountPageChange(page)
  }

  async function changeLanguage(value: string) {
    const next = value as InterfaceLanguage
    if (user.id) {
      try {
        await updateProfile({ interface_language: next })
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Request failed')
        return
      }
    }
    setLanguage(next)
  }

  return (
    <div className={`app-workspace relative min-h-screen bg-canvas-base text-on-surface${mobileNavOpen ? ' mobile-nav-open' : ''}`}>
      {/* ============================================================ */}
      {/* SideNavBar: fixed left rail (240px / w-60)                  */}
      {/* ============================================================ */}
      <aside
        className="workspace-sidebar fixed inset-y-0 left-0 w-60 bg-surface-container-lowest border-r border-outline-variant/30 shadow-2xl shadow-primary-container/5 flex flex-col h-full py-4 px-3 justify-between z-40"
        aria-label={t('Primary navigation')}
        id="primary-workspace-navigation"
      >
        <div className="flex flex-col gap-4">
          {/* Brand & Header */}
          <div className="flex items-center gap-3 px-2 pt-1 pb-2">
            <img
              aria-hidden="true"
              className="w-14 h-14 shrink-0"
              src="/vexora-logo.svg"
              alt=""
              draggable={false}
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-headline-sm font-headline-sm font-bold tracking-tight text-primary">Vexora</span>
              </div>
              <span className="text-body-sm font-body-sm text-text-muted">{t('Production OS')}</span>
            </div>
          </div>

          {/* Primary Action CTA */}
          <button
            className="w-full h-11 px-4 rounded-lg bg-accent-orange-core hover:bg-accent-orange-deep text-text-primary text-label-lg font-label-lg font-bold flex items-center justify-center gap-2 transition-all duration-150 amber-glow-btn active:scale-95"
            onClick={() => { onViewChange('create'); setAccountMenuOpen(false); setMobileNavOpen(false) }}
            type="button"
          >
            <span className="material-symbols-outlined text-text-primary">add</span>
            <span>{t('Create Content')}</span>
          </button>

          {/* Navigation Links Cluster */}
          <nav className="flex flex-col gap-1 mt-1">
            {navItems.map((item, index) => {
              const isActive = !activeAccountPage && activeView === item.id
              return (
                <button
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-primary-container/15 text-primary border-l-2 border-primary font-semibold'
                      : 'text-outline hover:text-on-surface font-medium hover:bg-surface-container-high/60'
                  }`}
                  key={item.id}
                  onClick={() => { onViewChange(item.id); setAccountMenuOpen(false); setMobileNavOpen(false) }}
                  type="button"
                >
                  {index === 0 ? (
                    <span className="material-symbols-outlined text-accent-amber-glow" style={{ fontVariationSettings: "'FILL' 1" }}>{NAV_GLYPHS[item.id]}</span>
                  ) : (
                    <span className="material-symbols-outlined">{NAV_GLYPHS[item.id]}</span>
                  )}
                  <span className="text-label-md font-label-md">{t(item.label)}</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-orange-core" />}
                </button>
              )
            })}
          </nav>
        </div>

        {/* SideNav Bottom Footer */}
        <div className="flex flex-col gap-2 pt-3 border-t border-border-structural/60">
          {/* Live server-controlled credit balance for the active company. */}
          <div className="sidebar-credit-balance">
            <div className="sidebar-credit-label"><span className="material-symbols-outlined" aria-hidden="true">bolt</span><span>{t('Credits remaining')}</span></div>
            <div className="sidebar-credit-value"><strong>{formatCredits(creditBalance, language)}</strong><span>{t('credits')}</span></div>
            <p>{t('Available for AI generation')}</p>
          </div>

          {/* User Profile Row */}
          <div className="user-control" ref={accountMenuRef}>
            <button
              aria-controls="account-menu"
              aria-expanded={accountMenuOpen}
              aria-label={accountMenuOpen ? t('Close account menu') : t('Open account menu')}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-layer-1 transition-colors cursor-pointer w-full"
              onClick={() => { setNotificationsOpen(false); setAccountMenuOpen((open) => !open) }}
              ref={avatarButtonRef}
              type="button"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-surface-dim border border-border-structural flex items-center justify-center text-text-primary font-bold text-label-sm shrink-0 overflow-hidden">
                  {user.avatarUrl ? <img alt="" className="w-full h-full object-cover" src={user.avatarUrl} /> : avatarLetter}
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-label-md font-label-md font-semibold text-text-primary truncate">{user.name}</span>
                  <span className="text-[11px] text-text-muted truncate">{user.email || t('Local demo')}</span>
                </div>
              </div>
            </button>
            {accountMenuOpen && (
              <div aria-label={t('Account menu')} className="account-menu-popover" id="account-menu">
                <div className="account-menu-identity">
                  <span className="account-menu-avatar" aria-hidden="true">
                    {user.avatarUrl ? <img alt="" src={user.avatarUrl} /> : avatarLetter}
                  </span>
                  <div className="account-menu-identity-text">
                    <strong>{user.name}</strong>
                    <span>{user.email || t('Local demo')}</span>
                  </div>
                </div>
                <div className="account-menu-links">
                  <button aria-current={activeAccountPage === 'general' ? 'page' : undefined} onClick={() => openAccountPage('general')} type="button">
                    <span className="material-symbols-outlined" aria-hidden="true">settings</span>
                    <span>{t('Settings')}</span>
                  </button>
                  <button aria-current={activeAccountPage === 'support' ? 'page' : undefined} onClick={() => openAccountPage('support')} type="button">
                    <span className="material-symbols-outlined" aria-hidden="true">help</span>
                    <span>{t('Help and support')}</span>
                  </button>
                  <button onClick={() => { setAccountMenuOpen(false); onViewChange('models') }} type="button">
                    <span className="material-symbols-outlined" aria-hidden="true">bolt</span>
                    <span>{t('Credits & bundles')}</span>
                  </button>
                </div>
                <button className="account-menu-signout" onClick={() => { setAccountMenuOpen(false); onSignOut() }} type="button">
                  <span className="material-symbols-outlined" aria-hidden="true">logout</span>
                  <span>{t('Sign out')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
      {mobileNavOpen && <button aria-label={t('Close navigation')} className="workspace-sidebar-backdrop" onClick={() => setMobileNavOpen(false)} type="button" />}

      {/* ============================================================ */}
      {/* MAIN WORKSPACE CONTAINER (Offset by 240px / pl-60)          */}
      {/* ============================================================ */}
      <div className="workspace-main pl-60 min-h-screen flex flex-col bg-canvas-base">
        {/* ========================================================== */}
        {/* TopNavBar: sticky glassy header                            */}
        {/* ========================================================== */}
        <header className="workspace-header sticky top-0 w-full z-30 bg-surface-container-low/80 backdrop-blur-md border-b border-border-structural shadow-sm flex items-center justify-between h-16 px-6 gap-4">
          {/* Left: Company selector & system status */}
          <div className="workspace-header-left flex items-center gap-4 flex-1 min-w-0">
            <button
              aria-controls="primary-workspace-navigation"
              aria-expanded={mobileNavOpen}
              aria-label={mobileNavOpen ? t('Close navigation') : t('Open navigation')}
              className="workspace-mobile-menu"
              onClick={() => setMobileNavOpen((open) => !open)}
              type="button"
            >
              <span className="material-symbols-outlined" aria-hidden="true">{mobileNavOpen ? 'close' : 'menu'}</span>
            </button>
            {!activeAccountPage && (
              <div className="workspace-company-control flex items-center gap-2 text-text-primary text-label-md font-label-md shrink-0">
                <span className="w-2 h-2 rounded-full bg-accent-orange-core" />
                <span className="text-text-muted text-label-sm font-label-sm hidden md:inline">{t('Active company')}</span>
                <Select
                  ariaLabel={t('Active company')}
                  className="gf-select--company"
                  hideChevron
                  id="company-switcher"
                  onChange={onCompanyChange}
                  options={companies.length
                    ? companies.map((company) => ({ value: company.id ?? company.name, label: company.name }))
                    : [{ value: '', label: t('No companies yet') }]}
                  value={activeCompany}
                />
              </div>
            )}
            <div className="workspace-search relative flex-1 max-w-xl hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px] pointer-events-none">search</span>
              <input
                aria-label={t('Search')}
                className="topbar-search-field w-full h-9 pl-9 pr-9 rounded-lg bg-surface-dim border border-border-structural text-text-primary placeholder:text-text-muted text-body-sm font-body-sm focus:border-accent-orange-core focus:outline-none"
                placeholder={t('Search posts, pipelines, models, references...')}
                type="search"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-layer-2 border border-border-structural text-[10px] text-text-muted font-mono">⌘K</kbd>
            </div>
          </div>

          {/* Right: Quick status & actions */}
          <div className="workspace-header-actions flex items-center gap-3 shrink-0">
            {queueCount > 0 && <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-layer-1 hover:bg-surface-layer-2 border border-border-structural text-label-sm font-label-sm" onClick={() => onViewChange('approvals')} type="button">
              <span className="w-2 h-2 rounded-full bg-status-warning" />
              <span className="text-text-muted">{t('Queue')}:</span>
              <span className="font-bold text-accent-amber-glow">{queueCount}</span>
            </button>}
            <div className="w-16">
              <Select
                ariaLabel={t('Interface language')}
                className="gf-select--lang"
                hideChevron
                value={language}
                onChange={(value) => { void changeLanguage(value) }}
                options={LANG_OPTIONS}
              />
            </div>
            <button
              aria-label={theme === 'dark' ? t('Switch to light theme') : t('Switch to dark theme')}
              className="theme-toggle w-9 h-9 rounded-lg bg-surface-layer-1 hover:bg-surface-layer-2 border border-border-structural flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
              onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? t('Switch to light theme') : t('Switch to dark theme')}
              type="button"
            >
              <span className="material-symbols-outlined" aria-hidden="true">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div className="notification-control" ref={notificationsRef}>
              <button aria-controls={notificationsOpen ? 'notifications-panel' : undefined} aria-expanded={notificationsOpen} aria-label={notificationsOpen ? t('Close notifications') : t('Open notifications')} className="w-9 h-9 rounded-lg bg-surface-layer-1 hover:bg-surface-layer-2 border border-border-structural flex items-center justify-center text-text-tertiary hover:text-text-primary relative transition-colors" onClick={() => { setAccountMenuOpen(false); setNotificationsOpen((open) => !open) }} ref={notificationsButtonRef} type="button">
                <span className="material-symbols-outlined">notifications</span>
                {queueCount > 0 && <span className="notification-unread-dot" />}
              </button>
              {notificationsOpen && <div aria-label={t('Notifications')} className="notification-popover" id="notifications-panel" role="dialog">
                <div className="notification-popover-head"><div><strong>{t('Notifications')}</strong><span>{queueCount > 0 ? t('{count} new', { count: queueCount }) : t('No new notifications')}</span></div><span className="material-symbols-outlined" aria-hidden="true">notifications</span></div>
                {queueCount > 0 ? <button className="notification-item" onClick={() => { setNotificationsOpen(false); onViewChange('approvals') }} type="button"><span className="notification-item-icon material-symbols-outlined" aria-hidden="true">approval</span><span><strong>{t('Content is waiting for approval')}</strong><small>{t('{count} items are ready for review.', { count: queueCount })}</small></span><span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button> : <div className="notification-empty"><span className="material-symbols-outlined" aria-hidden="true">notifications_none</span><strong>{t('You are all caught up')}</strong><p>{t('New workflow updates will appear here.')}</p></div>}
              </div>}
            </div>
            <button
              className="hidden sm:flex h-9 px-3.5 rounded-lg bg-surface-layer-2 hover:bg-surface-layer-3 border border-border-interactive text-text-primary text-label-sm font-label-sm font-bold items-center gap-1.5 transition-colors"
              onClick={() => onViewChange('create')}
              type="button"
            >
              <span className="material-symbols-outlined text-accent-orange-core text-[18px]">post_add</span>
              <span>{t('Create Post')}</span>
            </button>
          </div>
        </header>

        <main className="workspace-content flex-1 p-6 lg:p-8 flex flex-col gap-6 w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

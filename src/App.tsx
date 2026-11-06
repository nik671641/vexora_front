import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getCurrentUser, logout, toWorkspaceUser } from './api/auth'
import { archiveCompany as archiveCompanyApi, createCompany, listCompanies, removeCompanyLogo as removeCompanyLogoApi, selectCompany as selectCompanyApi, updateCompany, uploadCompanyLogo as uploadCompanyLogoApi } from './api/companies'
import { AppShell } from './app/layouts/AppShell'
import type { AutosaveStatus } from './features/create/CreateWorkspace'
import {
  briefForBackend, createInitialSession, draftDataFromSession, languageFromLabel,
  mediaTypeToValue, sessionFromWorkflow, type CreateSession,
} from './features/create/createSession'
import { approveContent, deleteContent, mapContentItem, listContent, scheduleContent, updateContent } from './api/content'
import { createWorkflow, getWorkflow, listWorkflows, saveDraft as saveWorkflowDraft } from './api/workflows'
import { getDemoReply, type SupportMessage } from './features/support/supportDemo'
import { ApiError } from './api/errors'
import type { AccountPageId, Company, ContentItem, DemoUser, ViewId } from './shared/types/product'
import { outputLanguageForInterface, useI18n } from './i18n/context'
import './App.css'
import './PlatformDark.css'
import './PlatformLight.css'
import './app/layouts/WorkspaceTheme.css'

const LandingPage = lazy(() => import('./features/landing/LandingPage').then((module) => ({ default: module.LandingPage })))
const AuthView = lazy(() => import('./features/auth/AuthView').then((module) => ({ default: module.AuthView })))
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then((module) => ({ default: module.Dashboard })))
const CreateWorkspace = lazy(() => import('./features/create/CreateWorkspace').then((module) => ({ default: module.CreateWorkspace })))
const CompaniesView = lazy(() => import('./features/companies/CompaniesView').then((module) => ({ default: module.CompaniesView })))
const ContentView = lazy(() => import('./features/content/ContentView').then((module) => ({ default: module.ContentView })))
const ApprovalQueue = lazy(() => import('./features/content/ApprovalQueue').then((module) => ({ default: module.ApprovalQueue })))
const SectionView = lazy(() => import('./features/sections/SectionView').then((module) => ({ default: module.SectionView })))
const AccountPages = lazy(() => import('./features/account/AccountPages').then((module) => ({ default: module.AccountPages })))

const emptyCompany: Company = { name: '', site: '', status: 'Draft', tone: '', posts: 0, readiness: 0 }
const companyKey = (company: Company) => company.id ?? company.name

/* ------------------------------------------------------------------ */
/* Hash router: every section exposes its own stable URL.              */
/*   #/                      -> landing                                */
/*   #/signin | #/register   -> auth                                   */
/*   #/dashboard #/create #/companies #/content #/calendar             */
/*   #/references #/models #/accounts #/settings -> workspace sections */
/*   #/accounts/general|plan|credits|usage|support -> account pages      */
/* Hash routing keeps refresh, back/forward and manual URL entry        */
/* working without server-side SPA fallback configuration.             */
/* ------------------------------------------------------------------ */
const VIEW_IDS: ViewId[] = ['dashboard', 'create', 'companies', 'content', 'approvals', 'calendar', 'references', 'models', 'accounts', 'settings']
const ACCOUNT_PAGE_IDS: AccountPageId[] = ['general', 'plan', 'credits', 'usage', 'support']

type AppRoute =
  | { kind: 'landing' }
  | { kind: 'auth'; mode: 'login' | 'register' }
  | { kind: 'workspace'; view: ViewId }
  | { kind: 'account'; page: AccountPageId }

function parseRouteFromHash(hash: string): AppRoute {
  const parts = (hash || '').replace(/^#/, '').split('?')[0].split('/').filter(Boolean)
  const [first, second] = parts
  if (!first) return { kind: 'landing' }
  if (first === 'signin') return { kind: 'auth', mode: 'login' }
  if (first === 'register') return { kind: 'auth', mode: 'register' }
  if (first === 'accounts' && second && (ACCOUNT_PAGE_IDS as string[]).includes(second)) {
    return { kind: 'account', page: second as AccountPageId }
  }
  if ((VIEW_IDS as string[]).includes(first)) return { kind: 'workspace', view: first as ViewId }
  return { kind: 'landing' }
}

function hashForRoute(route: AppRoute): string {
  switch (route.kind) {
    case 'landing': return '#/'
    case 'auth': return route.mode === 'login' ? '#/signin' : '#/register'
    case 'workspace': return `#/${route.view}`
    case 'account': return `#/accounts/${route.page}`
  }
}

function App() {
  const { language, setLanguage, t } = useI18n()
  const [route, setRoute] = useState<AppRoute>(() => parseRouteFromHash(window.location.hash))
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [sessionCheckError, setSessionCheckError] = useState<string | null>(null)
  const [sessionCheckVersion, setSessionCheckVersion] = useState(0)
  const [savedCompanies, setSavedCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [companyLoadError, setCompanyLoadError] = useState<string | null>(null)
  const [companyReload, setCompanyReload] = useState(0)
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([])
  const [activeCompany, setActiveCompany] = useState('')
  const [content, setContent] = useState<ContentItem[]>([])
  const [autosaveByCompany, setAutosaveByCompany] = useState<Record<string, AutosaveStatus>>({})
  const [workspace, setWorkspace] = useState<{ sessions: Record<string, CreateSession>; content: ContentItem[] }>({
    sessions: {}, content: [],
  })
  // Derived straight from the URL hash so address bar and UI stay in sync.
  const accountPage = route.kind === 'account' ? route.page : null
  const activeView: ViewId = route.kind === 'workspace'
    ? route.view
    : route.kind === 'account'
      ? 'accounts'
      : demoUser
        ? 'dashboard'
        : 'create'
  const companies = savedCompanies
  const currentCompany = useMemo(
    () => companies.find((company) => companyKey(company) === activeCompany) ?? companies[0] ?? emptyCompany,
    [activeCompany, companies],
  )
  const createSession = workspace.sessions[companyKey(currentCompany)] ?? createInitialSession(currentCompany, outputLanguageForInterface(language))

  const navigateToRoute = useCallback((nextRoute: AppRoute) => {
    const nextHash = hashForRoute(nextRoute)
    if (window.location.hash === nextHash) return
    window.location.hash = nextHash
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRouteFromHash(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Keep the URL authoritative: logged-out users on workspace/account routes go
  // to sign-in; logged-in users landing on public routes go to the dashboard.
  useEffect(() => {
    if (checkingSession) return
    if (demoUser?.id) {
      if (route.kind === 'landing' || route.kind === 'auth') {
        window.location.hash = '#/dashboard'
      }
    } else if (route.kind === 'workspace' || route.kind === 'account') {
      window.location.hash = '#/signin'
    }
  }, [demoUser?.id, route, checkingSession])

  useEffect(() => {
    const controller = new AbortController()
    getCurrentUser(controller.signal)
      .then((profile) => {
        if (!controller.signal.aborted) {
          setSessionCheckError(null)
          setDemoUser(toWorkspaceUser(profile))
          setWorkspace({ sessions: {}, content: [] })
          setLanguage(profile.interface_language)
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.kind === 'permission') return
        setSessionCheckError(error instanceof Error ? error.message : 'Backend unavailable')
      })
      .finally(() => { if (!controller.signal.aborted) setCheckingSession(false) })
    return () => controller.abort()
  }, [setLanguage, sessionCheckVersion])

  useEffect(() => {
    if (!demoUser?.id) return
    const controller = new AbortController()
    listCompanies(controller.signal)
      .then(async (items) => {
        if (controller.signal.aborted) return
        const selected = items.find((item) => item.id === demoUser.activeCompanyId) ?? items[0]
        if (selected?.id && selected.id !== demoUser.activeCompanyId) {
          await selectCompanyApi(selected.id)
          if (controller.signal.aborted) return
          setDemoUser((current) => current ? { ...current, activeCompanyId: selected.id } : current)
        }
        setSavedCompanies(items)
        setActiveCompany(selected?.id ?? '')
        if (!selected) navigateToRoute({ kind: 'workspace', view: 'companies' })
        setCompanyLoadError(null)
        const companyName = (id: string) => items.find((item) => item.id === id)?.name ?? ''
        const mapped = await listContent(controller.signal).then((list) => list.map((dto) => mapContentItem(dto, companyName(dto.company_id)))).catch(() => [])
        if (!controller.signal.aborted) setContent(mapped)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setCompanyLoadError(error instanceof Error ? error.message : 'Request failed')
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingCompanies(false) })
    return () => controller.abort()
  }, [demoUser?.id, demoUser?.activeCompanyId, companyReload, navigateToRoute])

  const refreshContent = useCallback((signal?: AbortSignal) => {
    return listContent(signal).then((list) => {
      const mapped = list.map((dto) => mapContentItem(dto, savedCompanies.find((item) => item.id === dto.company_id)?.name ?? dto.company_id))
      setContent(mapped)
    }).catch(() => {})
  }, [savedCompanies])

  const contentStates = useMemo(() => ['preview_ready', 'scheduled', 'published', 'failed'], [])
  const previousSessionStates = useRef<Record<string, string>>({})
  useEffect(() => {
    if (!demoUser?.id) return
    let changed = false
    for (const [sessionId, session] of Object.entries(workspace.sessions)) {
      const prev = previousSessionStates.current[sessionId]
      if (prev !== session.state && contentStates.includes(session.state)) changed = true
      previousSessionStates.current[sessionId] = session.state
    }
    if (!changed) return
    const controller = new AbortController()
    refreshContent(controller.signal)
    return () => controller.abort()
  }, [demoUser?.id, workspace.sessions, refreshContent, contentStates])

  const updateCreateSession = useCallback((companyId: string, update: (current: CreateSession) => CreateSession) => {
    setWorkspace((current) => {
      const company = companies.find((item) => companyKey(item) === companyId)
      if (!company) return current
      const previous = current.sessions[companyId] ?? createInitialSession(company, outputLanguageForInterface(language))
      const next = update(previous)
      return { sessions: { ...current.sessions, [companyId]: next }, content: current.content }
    })
  }, [companies, language])

  /* ---------------- Draft autosave + resume ---------------- */
  const sessionsRef = useRef(workspace.sessions)
  sessionsRef.current = workspace.sessions
  const autosaveTimer = useRef<number | undefined>(undefined)
  const autosaveBusy = useRef(false)

  /** Only persist a session that actually has content worth resuming. */
  function hasDraftContent(session: CreateSession): boolean {
    return Boolean(
      session.brief?.trim() || session.objective?.trim() || session.hook?.trim() ||
      session.cta?.trim() || session.caption?.trim() || session.hashtags?.trim() ||
      (session.referenceNames?.length ?? 0) > 0,
    )
  }

  // Debounced autosave: while on the create view, persist the studio session
  // into a backend draft workflow so a crash / abrupt exit does not lose it.
  useEffect(() => {
    if (!demoUser?.id || activeView !== 'create') return
    const company = companies.find((item) => companyKey(item) === companyKey(currentCompany))
    if (!company?.id) return
    const key = companyKey(company)
    const session = sessionsRef.current[key]
    if (!session || session.state !== 'draft' || !hasDraftContent(session) || autosaveBusy.current) return

    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
    autosaveTimer.current = window.setTimeout(() => {
      autosaveBusy.current = true
      setAutosaveByCompany((current) => ({ ...current, [key]: { state: 'saving' } }))
      const payload = {
        brief: briefForBackend(session),
        media_type: mediaTypeToValue(session.mediaType),
        content_language: languageFromLabel(session.language),
        model_id: session.modelId || undefined,
        aspect_ratio: session.aspectRatio,
        duration_sec: session.durationSec ?? null,
        draft_data: draftDataFromSession(session),
      }
      const apply = async () => {
        try {
          if (!session.workflowId) {
            const created = await createWorkflow({ ...payload, company_id: company.id!, reference_ids: session.referenceIds })
            updateCreateSession(key, (current) => ({ ...current, workflowId: created.id }))
          } else {
            await saveWorkflowDraft(session.workflowId, payload)
          }
          setAutosaveByCompany((current) => ({
            ...current,
            [key]: { state: 'saved', savedAt: new Date().toISOString() },
          }))
        } catch (error) {
          setAutosaveByCompany((current) => ({
            ...current,
            [key]: { state: 'error', message: error instanceof Error ? error.message : 'Autosave failed' },
          }))
        } finally {
          autosaveBusy.current = false
        }
      }
      void apply()
    }, 1200)

    return () => { if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current) }
  }, [demoUser?.id, activeView, currentCompany, companies, workspace.sessions, updateCreateSession])

  // On entering the studio without an in-memory session, restore the most
  // recent resumable (non-terminal) draft workflow for the current company.
  useEffect(() => {
    if (!demoUser?.id || activeView !== 'create') return
    const company = companies.find((item) => companyKey(item) === companyKey(currentCompany))
    if (!company?.id) return
    const key = companyKey(company)
    if (sessionsRef.current[key]) return // already have a live session

    let cancelled = false
    listWorkflows(company.id)
      .then((workflows) => {
        if (cancelled || sessionsRef.current[key]) return
        const resumable = workflows
          .filter((wf) => ['draft', 'researching', 'generating', 'idea_ready', 'preview_ready'].includes(wf.state))
          .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
        const candidate = resumable[0]
        if (!candidate) return
        const lang = outputLanguageForInterface(language)
        updateCreateSession(key, () => sessionFromWorkflow(candidate, company, lang))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [demoUser?.id, activeView, currentCompany, companies, language, updateCreateSession])

  /** Resume an existing post into the create studio by its workflow. */
  async function openEditPost(item: ContentItem) {
    const company = companies.find((c) => c.name === item.company)
    if (company && companyKey(company) !== activeCompany) {
      await chooseCompany(companyKey(company)).catch(() => {})
    }
    if (item.workflowId) {
      try {
        const wf = await getWorkflow(item.workflowId)
        const target = company ?? currentCompany
        const lang = outputLanguageForInterface(language)
        updateCreateSession(companyKey(target), () => sessionFromWorkflow(wf, target, lang))
      } catch {
        /* fall back to a plain create view below */
      }
    }
    openView('create')
  }

  async function saveContent(id: string, caption: string, hashtags: string): Promise<boolean> {
    if (content.some((item) => item.id === id)) {
      try {
        await updateContent(id, { caption, hashtags: hashtags.split(/\s+/).filter(Boolean) })
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Could not save content')
        return false
      }
    }
    setContent((current) => current.map((item) => item.id === id ? { ...item, caption, hashtags } : item))
    setWorkspace((current) => ({
      content: current.content,
      sessions: Object.fromEntries(Object.entries(current.sessions).map(([name, session]) => [
        name,
        session.id === id ? { ...session, caption, hashtags } : session,
      ])),
    }))
    return true
  }

  async function approveQueuedContent(id: string): Promise<boolean> {
    try {
      await approveContent(id)
      await refreshContent()
      return true
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not approve content')
      return false
    }
  }

  async function deleteQueuedContent(id: string): Promise<boolean> {
    try {
      await deleteContent(id)
      setContent((current) => current.filter((item) => item.id !== id))
      return true
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not delete content')
      return false
    }
  }

  async function scheduleQueuedContent(id: string, scheduledFor: string): Promise<boolean> {
    try {
      await scheduleContent(id, scheduledFor)
      await refreshContent()
      return true
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not schedule content')
      return false
    }
  }

  async function saveCompany(company: Company): Promise<Company> {
    const saved = company.id ? await updateCompany(company) : await createCompany(company)
    setSavedCompanies((current) => current.some((item) => item.id === saved.id)
      ? current.map((item) => item.id === saved.id ? saved : item)
      : [...current, saved])
    if (!company.id && saved.id) {
      await selectCompanyApi(saved.id)
      setActiveCompany(saved.id)
      setDemoUser((current) => current ? { ...current, activeCompanyId: saved.id } : current)
    }
    return saved
  }

  async function chooseCompany(companyId: string) {
    if (demoUser?.id) {
      await selectCompanyApi(companyId)
      setDemoUser((current) => current ? { ...current, activeCompanyId: companyId } : current)
    }
    setActiveCompany(companyId)
  }

  async function uploadCompanyLogo(companyId: string, file: File): Promise<Company> {
    const updated = await uploadCompanyLogoApi(companyId, file)
    setSavedCompanies((current) => current.map((item) => item.id === companyId ? updated : item))
    return updated
  }

  async function removeCompanyLogo(companyId: string): Promise<Company> {
    const updated = await removeCompanyLogoApi(companyId)
    setSavedCompanies((current) => current.map((item) => item.id === companyId ? updated : item))
    return updated
  }

  async function archiveCompany(companyId: string) {
    if (!demoUser?.id) return
    await archiveCompanyApi(companyId)
    const remaining = savedCompanies.filter((item) => item.id !== companyId)
    setSavedCompanies(remaining)
    if (activeCompany === companyId) {
      const nextId = remaining[0]?.id ?? ''
      setActiveCompany(nextId)
      setDemoUser((current) => current ? { ...current, activeCompanyId: null } : current)
      if (nextId) await chooseCompany(nextId)
    }
  }

  async function signOut() {
    try {
      await logout()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not sign out')
      return
    }
    setDemoUser(null)
    setSupportMessages([])
    navigateToRoute({ kind: 'landing' })
    setSavedCompanies([])
    setLoadingCompanies(true)
    setCompanyLoadError(null)
    setWorkspace({ sessions: {}, content: [] })
    setContent([])
    setActiveCompany('')
    window.scrollTo(0, 0)
  }

  function openAuth(mode: 'login' | 'register') {
    navigateToRoute({ kind: 'auth', mode })
    window.scrollTo(0, 0)
  }

  function openView(view: ViewId) {
    navigateToRoute({ kind: 'workspace', view })
    window.scrollTo(0, 0)
  }

  function startNewContent() {
    const key = companyKey(currentCompany)
    const next = createInitialSession(currentCompany, outputLanguageForInterface(language))
    setWorkspace((current) => ({
      ...current,
      sessions: { ...current.sessions, [key]: next },
    }))
    setAutosaveByCompany((current) => ({ ...current, [key]: { state: 'idle' } }))
    void refreshContent()
    navigateToRoute({ kind: 'workspace', view: 'create' })
    window.scrollTo(0, 0)
  }

  function openAccountPage(page: AccountPageId) {
    navigateToRoute({ kind: 'account', page })
    window.scrollTo(0, 0)
  }

  function enterWorkspace(user: DemoUser) {
    setDemoUser(user)
    setLoadingCompanies(Boolean(user.id))
    setWorkspace({ sessions: {}, content: [] })
    navigateToRoute({ kind: 'workspace', view: 'dashboard' })
  }

  function sendSupportMessage(text: string) {
    const question = text.trim()
    if (!question) return
    const replyKey = getDemoReply(question, t)
    setSupportMessages((current) => [
      ...current,
      { id: Date.now() + Math.random(), role: 'user', text: question },
      { id: Date.now() + Math.random(), role: 'assistant', replyKey },
    ])
  }

  if (checkingSession) return <div role="status">{t('Checking your session...')}</div>

  if (sessionCheckError) return (
    <section className="panel" role="alert">
      <h2>{t('Backend unavailable')}</h2>
      <p>{sessionCheckError}</p>
      <button className="primary-button" onClick={() => { setSessionCheckError(null); setCheckingSession(true); setSessionCheckVersion((value) => value + 1) }} type="button">{t('Retry')}</button>
    </section>
  )

  if (!demoUser) {
    if (route.kind === 'landing') {
      return <Suspense fallback={<div role="status">{t('Loading…')}</div>}><LandingPage onSignIn={() => openAuth('login')} onRegister={() => openAuth('register')} supportMessages={supportMessages} onSupportSend={sendSupportMessage} /></Suspense>
    }
    const authMode = route.kind === 'auth' && route.mode === 'register' ? 'register' : 'login'
    return <Suspense fallback={<div role="status">{t('Loading…')}</div>}><AuthView key={authMode} initialMode={authMode} onBack={() => navigateToRoute({ kind: 'landing' })} onModeChange={openAuth} onEnter={enterWorkspace} /></Suspense>
  }

  if (demoUser.id && loadingCompanies) return <div role="status">{t('Loading companies...')}</div>
  if (demoUser.id && companyLoadError) return (
    <div role="alert">
      <p>{companyLoadError}</p>
      <button onClick={() => { setLoadingCompanies(true); setCompanyReload((value) => value + 1) }} type="button">{t('Retry')}</button>
      <button onClick={() => { void signOut() }} type="button">{t('Sign out')}</button>
    </div>
  )

  return (
    <AppShell
      user={demoUser}
      onSignOut={signOut}
      activeCompany={activeCompany}
      activeView={activeView}
      activeAccountPage={accountPage}
      companies={companies}
      onCompanyChange={(id) => { void chooseCompany(id).catch((error: unknown) => window.alert(error instanceof Error ? error.message : 'Request failed')) }}
      onViewChange={openView}
      onCreateContent={startNewContent}
      onAccountPageChange={openAccountPage}
      queueCount={content.filter((item) => item.source === 'local' && item.status.toLowerCase() === 'draft').length}
    >
      <Suspense fallback={<div role="status">{t('Loading…')}</div>}>
      {accountPage ? (
        <AccountPages
          currentCompany={currentCompany}
          page={accountPage}
          user={demoUser}
          onUserChange={(changes) => setDemoUser((current) => current ? { ...current, ...changes } : current)}
          onPageChange={openAccountPage}
          onViewChange={openView}
          onSignOut={signOut}
          supportMessages={supportMessages}
          onSupportSend={sendSupportMessage}
        />
      ) : (
        <>
      {companies.length === 0 && activeView !== 'companies' ? (
        <section className="panel">
          <h2>{t('Create your first company')}</h2>
          <p>{t('Add a company profile to start using this workspace.')}</p>
          <button className="primary-button" onClick={() => openView('companies')} type="button">{t('Add company')}</button>
        </section>
      ) : null}
      {companies.length > 0 && activeView === 'dashboard' ? (
        <Dashboard currentCompany={currentCompany} contentItems={content} onOpenCreate={startNewContent} onOpenContent={() => openView('content')} onOpenApprovals={() => openView('approvals')} onEditPost={(item) => { void openEditPost(item) }} />
      ) : null}

      {companies.length > 0 && activeView === 'create' ? (
        <CreateWorkspace
          currentCompany={currentCompany}
          session={createSession}
          onSessionChange={updateCreateSession}
          companies={companies}
          onCompanyChange={(companyId) => { void chooseCompany(companyId) }}
          autosaveStatus={autosaveByCompany[companyKey(currentCompany)] ?? { state: 'idle' }}
          onContentSaved={() => refreshContent()}
        />
      ) : null}

      {activeView === 'companies' ? (
        <CompaniesView
          key={currentCompany.id ?? 'new-company'}
          activeCompany={companies.length ? currentCompany : null}
          companies={companies}
          onCompanySave={saveCompany}
          onCompanySelect={chooseCompany}
          onCompanyArchive={archiveCompany}
          onCompanyLogoUpload={demoUser?.id ? uploadCompanyLogo : undefined}
          onCompanyLogoRemove={demoUser?.id ? removeCompanyLogo : undefined}
        />
      ) : null}

      {companies.length > 0 && activeView === 'content' ? (
        <ContentView
          items={content}
          currentCompany={currentCompany.name}
          onSave={saveContent}
          onOpenWorkflow={(companyName) => {
            const company = companies.find((item) => item.name === companyName)
            if (company) setActiveCompany(companyKey(company))
            openView('create')
          }}
          activeWorkflowIds={Object.values(workspace.sessions).map((session) => session.workflowId).filter(Boolean)}
        />
      ) : null}

      {companies.length > 0 && activeView === 'approvals' ? (
        <ApprovalQueue
          items={content}
          companies={companies}
          currentCompany={currentCompany}
          onSave={saveContent}
          onApprove={approveQueuedContent}
          onDelete={deleteQueuedContent}
          onSchedule={scheduleQueuedContent}
          onOpenWorkflow={(item) => { void openEditPost(item) }}
        />
      ) : null}

      {companies.length > 0 && activeView !== 'dashboard' && activeView !== 'create' && activeView !== 'companies' && activeView !== 'content' && activeView !== 'approvals' ? (
        <SectionView onCompanySave={saveCompany} activeView={activeView} currentCompany={currentCompany} contentItems={content} onOpenCreate={startNewContent} onOpenContent={() => openView('content')} onOpenApprovals={() => openView('approvals')} />
      ) : null}
        </>
      )}
      </Suspense>
    </AppShell>
  )
}

export default App

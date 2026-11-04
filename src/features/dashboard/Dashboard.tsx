import { useEffect, useState } from 'react'
import type { Company, ContentItem } from '../../shared/types/product'
import { useI18n } from '../../i18n/context'
import { getCompanyAccounts, type AccountConnection } from '../../api/accounts'

/** Format a credits balance like "2,500.00" (trims trailing zeros) for CJK-free display. */
function formatCredits(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function Dashboard({
  currentCompany,
  contentItems,
  onOpenCreate,
  onEditPost,
  onOpenContent,
  onOpenApprovals,
}: {
  currentCompany: Company
  contentItems: ContentItem[]
  onOpenCreate: () => void
  onEditPost: (item: ContentItem) => void
  onOpenContent: () => void
  onOpenApprovals: () => void
}) {
  const { t, label, contentTime, formatDateTime } = useI18n()
  const companyItems = contentItems.filter((item) => item.company === currentCompany.name)
  const readyPosts = companyItems.filter((item) => ['scheduled', 'published'].includes(item.status.toLowerCase()))
  const approvalQueue = companyItems.filter((item) => item.status.toLowerCase() === 'draft')
  const publishErrors = companyItems.filter((item) => item.status.toLowerCase() === 'failed')
  const shown = companyItems.slice(0, 5)

  /* ---------------- Real backend data ---------------- */
  const [accounts, setAccounts] = useState<AccountConnection[]>([])
  const [backendState, setBackendState] = useState<'loading' | 'loaded' | 'unavailable'>('loading')
  const [updatedAt, setUpdatedAt] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const companyId = currentCompany.id

    const request = companyId ? getCompanyAccounts(companyId, controller.signal) : Promise.resolve<AccountConnection[]>([])
    request
      .then((connections) => {
        if (controller.signal.aborted) return
        setAccounts(connections)
        setBackendState('loaded')
        setUpdatedAt(new Date().toISOString())
      })
      .catch(() => {
        if (!controller.signal.aborted) setBackendState('unavailable')
      })

    return () => controller.abort()
  }, [currentCompany.id])

  /* Company health checklist built from real Company fields. */
  const checklist = [
    {
      label: t('Brand Guidelines'),
      done: Boolean(currentCompany.brandStyle?.trim() || currentCompany.visualRules?.trim()),
    },
    {
      label: t('Target Audience Defined'),
      done: Boolean(currentCompany.targetAudience?.trim()),
    },
    {
      label: t('Model Fine-tuning'),
      done: Boolean(currentCompany.preferredImageModel || currentCompany.preferredVideoModel),
    },
    {
      label: t('Connect Social Accounts'),
      done: accounts.length > 0,
    },
  ]

  return (
    <div className="dashboard-page flex flex-col gap-6">
      {/* ============================================================ */}
      {/* HERO BANNER (Active production)                              */}
      {/* ============================================================ */}
      <section className="relative rounded-xl kinetic-banner-gradient border border-border-structural p-6 overflow-hidden amber-subtle-glow">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-accent-orange-core/20 text-accent-amber-glow border border-accent-orange-core/30">
                {t('Active production')}
              </span>
              <span className="text-body-sm font-body-sm text-text-muted flex items-center gap-1">
                <span className={`material-symbols-outlined text-[14px] ${backendState === 'loaded' ? 'text-status-operational' : 'text-status-warning'}`}>fiber_manual_record</span>
                {backendState === 'loaded' ? t('Backend data loaded') : backendState === 'unavailable' ? t('Backend data unavailable') : t('Loading…')}
              </span>
            </div>
            <h1 className="text-headline-xl font-headline-xl font-bold text-text-primary tracking-tight">{currentCompany.name}</h1>
            <p className="text-body-md font-body-md text-text-secondary leading-relaxed">
              {t('Company profile is {readiness}% ready. Content is loaded from the backend and publishing waits for connected accounts.', { readiness: currentCompany.readiness })}
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <button
              className="h-11 px-5 rounded-lg bg-accent-orange-core hover:bg-accent-orange-deep text-text-primary text-label-lg font-label-lg font-bold flex items-center gap-2 amber-glow-btn transition-all duration-150 active:scale-95"
              onClick={onOpenCreate}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>{t('New content')}</span>
            </button>
          </div>
        </div>
        <div className="absolute -right-16 -bottom-24 w-80 h-80 rounded-full bg-accent-orange-core/10 blur-3xl pointer-events-none" />
      </section>

      {/* ============================================================ */}
      {/* METRIC / KPI STAT CARDS ROW                                  */}
      {/* ============================================================ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* READY POSTS */}
        <div className="rounded-xl bg-surface-layer-1 border border-border-structural p-5 flex flex-col justify-between hover:border-border-interactive transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-text-muted uppercase">{t('Ready posts')}</span>
            <span className="material-symbols-outlined text-text-muted text-[18px]">send_and_archive</span>
          </div>
          <div className="my-3">
            <span className="text-metric-num font-metric-num font-bold text-text-primary">{readyPosts.length}</span>
          </div>
          <div className="flex items-center justify-between text-body-sm font-body-sm text-text-muted pt-2 border-t border-border-structural/60">
            <span>{readyPosts.length ? t('Scheduled or preview-ready') : t('Nothing ready yet')}</span>
            <button className="text-accent-amber-glow hover:underline text-label-sm font-label-sm flex items-center gap-0.5" onClick={onOpenContent} type="button">
              {t('Draft')} <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* APPROVAL QUEUE */}
        <div className="rounded-xl bg-surface-layer-1 border border-accent-orange-core/40 p-5 flex flex-col justify-between hover:border-accent-orange-core transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent-orange-core/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-accent-orange-core/10" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-accent-amber-glow uppercase">{t('Approval queue')}</span>
            <span className="material-symbols-outlined text-accent-amber-glow text-[18px]">pending_actions</span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-metric-num font-metric-num font-bold text-text-primary">{approvalQueue.length}</span>
            {approvalQueue.length > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-accent-orange-core/20 text-accent-amber-glow border border-accent-orange-core/40">
                {t('Needs Review')}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-body-sm font-body-sm text-text-muted pt-2 border-t border-border-structural/60">
            <span>{approvalQueue.length ? t('Idea and video preview') : t('Queue is empty')}</span>
            <button className="text-accent-amber-glow hover:underline text-label-sm font-label-sm flex items-center gap-0.5" onClick={onOpenApprovals} type="button">
              {t('Open')} <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* PUBLISH ERRORS */}
        <div className="rounded-xl bg-surface-layer-1 border border-border-structural p-5 flex flex-col justify-between hover:border-border-interactive transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-text-muted uppercase">{t('Publish errors')}</span>
            <span className={`material-symbols-outlined text-[18px] ${publishErrors.length ? 'text-status-critical' : 'text-status-operational'}`}>verified</span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-metric-num font-metric-num font-bold text-text-primary">{publishErrors.length}</span>
            {!publishErrors.length && (
              <span className="text-status-operational text-label-sm font-label-sm font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> {t('No recorded errors')}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-body-sm font-body-sm text-text-muted pt-2 border-t border-border-structural/60">
            <span>{publishErrors.length ? t('Needs attention') : t('No errors')}</span>
            <span className="text-text-muted text-[11px]">{updatedAt ? formatDateTime(updatedAt) : t('Loading…')}</span>
          </div>
        </div>

        {/* COMPUTE POOL (real Credits from backend) */}
        <div className="rounded-xl bg-surface-layer-1 border border-border-structural p-5 flex flex-col justify-between hover:border-border-interactive transition-all relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-accent-orange-core/10 blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-text-muted uppercase">{t('Compute Pool')}</span>
            <span className="material-symbols-outlined text-accent-orange-core text-[18px]">bolt</span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-metric-num font-metric-num font-bold text-text-primary">{formatCredits(currentCompany.credits ?? 0)}</span>
            <span className="text-text-tertiary text-label-sm font-label-sm">{t('credits')}</span>
          </div>
          <div className="flex items-center justify-between text-body-sm font-body-sm text-text-muted pt-2 border-t border-border-structural/60">
            <span className="text-accent-amber-glow font-semibold">{t('Available balance')}</span>
            <span className="text-text-muted text-[11px]">{t('Billing setup pending')}</span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TWO-COLUMN WORKSPACE: 8-col feed + 4-col telemetry           */}
      {/* ============================================================ */}
      <section className="dashboard-workspace grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* LATEST CONTENT PANEL */}
          <div className="rounded-xl bg-surface-layer-1 border border-border-structural overflow-hidden">
            <div className="dashboard-latest-head p-5 border-b border-border-structural flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-headline-sm font-headline-sm font-semibold text-text-primary">{t('Latest content')}</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-layer-2 text-text-tertiary border border-border-structural">
                  {companyItems.length} {t('items')}
                </span>
              </div>
              <button className="text-label-md font-label-md text-text-muted hover:text-accent-amber-glow flex items-center gap-1 transition-colors" onClick={onOpenContent} type="button">
                <span>{t('View history')}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {shown.length ? (
              <div className="divide-y divide-border-structural/50">
                {shown.map((item) => (
                  <div className="dashboard-content-row p-4 hover:bg-surface-layer-2/50 transition-colors flex items-center justify-between gap-4 group" key={item.id}>
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-surface-dim border border-border-interactive flex items-center justify-center shrink-0 group-hover:border-accent-orange-core transition-colors">
                        <span className="material-symbols-outlined text-text-muted group-hover:text-accent-amber-glow">image</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-label-lg font-label-lg font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-2 text-body-sm font-body-sm text-text-muted">
                          <span>{item.company}</span>
                          <span>•</span>
                          <span>{label(item.type)}</span>
                          <span>•</span>
                          <span className="text-[11px]">{contentTime(item)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="dashboard-content-actions flex items-center gap-3 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-label-sm font-label-sm font-semibold bg-surface-layer-2 border border-border-interactive text-text-muted flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                        {label(item.status)}
                      </span>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button className="w-8 h-8 rounded-lg bg-surface-layer-2 hover:bg-surface-layer-3 border border-border-structural flex items-center justify-center text-text-secondary hover:text-text-primary" title={t('Edit post')} type="button" onClick={() => onEditPost(item)}>
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          className="w-8 h-8 rounded-lg bg-accent-orange-core/15 hover:bg-accent-orange-core/25 border border-accent-orange-core/30 flex items-center justify-center text-accent-amber-glow"
                          onClick={onOpenCreate}
                          title={t('Generate with AI')}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-body-sm font-body-sm text-text-muted">{t('No content yet. Create your first post in the studio.')}</p>
              </div>
            )}

            <div className="p-3 bg-surface-layer-2/30 border-t border-border-structural flex items-center justify-between text-body-sm font-body-sm text-text-muted">
              <span>{t('Showing {count} of {total} drafts', { count: shown.length, total: companyItems.length })}</span>
              {shown.length ? (
                <div className="flex items-center gap-2">
                  <button className="px-2.5 py-1 rounded bg-surface-layer-2 hover:bg-surface-layer-3 border border-border-structural text-text-secondary text-label-sm font-label-sm disabled:opacity-50" disabled type="button">{t('Previous')}</button>
                  <button className="px-2.5 py-1 rounded bg-surface-layer-2 hover:bg-surface-layer-3 border border-border-structural text-text-primary text-label-sm font-label-sm" onClick={onOpenCreate} type="button">{t('Next')}</button>
                </div>
              ) : null}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* COMPANY HEALTH — real checklist from Company fields */}
          <div className="rounded-xl bg-surface-layer-1 border border-border-structural p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-headline-sm font-headline-sm font-semibold text-text-primary">{t('Company health')}</h3>
              <span className="material-symbols-outlined text-text-muted">speed</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-label-sm font-label-sm">
                <span className="text-text-muted font-bold tracking-wider uppercase">{t('Brand profile')}</span>
                <span className="text-accent-amber-glow font-bold text-label-md">{currentCompany.readiness}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-dim overflow-hidden p-[1px] border border-border-structural">
                <div className="h-full rounded-full bg-gradient-to-r from-accent-orange-deep to-status-operational transition-all duration-500 shadow-sm shadow-accent-orange-core/30" style={{ width: `${currentCompany.readiness}%` }} />
              </div>
            </div>
            <div className="flex flex-col gap-2.5 pt-2 border-t border-border-structural/60">
              {checklist.map((row) => (
                <div className="flex items-center justify-between text-body-sm font-body-sm" key={row.label}>
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[18px] ${row.done ? 'text-status-operational' : 'text-status-warning'}`}>
                      {row.done ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span className="text-text-secondary">{row.label}</span>
                  </div>
                  <span className={`${row.done ? 'text-status-operational' : 'text-status-warning'} font-bold text-[11px]`}>
                    {row.done ? t('Ready') : t('Pending')}
                  </span>
                </div>
              ))}
            </div>
            <a className="w-full h-9 rounded-lg bg-surface-layer-2 hover:bg-surface-layer-3 border border-border-interactive text-text-primary text-label-sm font-label-sm font-bold flex items-center justify-center gap-1.5 transition-colors" href="#/companies" type="button">
              <span>{t('Complete Profile')}</span>
              <span className="material-symbols-outlined text-[16px] text-accent-orange-core">arrow_forward</span>
            </a>
          </div>

          {/* CONNECTED ACCOUNTS — real from /api/companies/{id}/accounts */}
          <div className="rounded-xl bg-surface-layer-1 border border-border-structural p-5 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-label-lg font-label-lg font-semibold text-text-primary">{t('Connected Accounts')}</h3>
              <a className="text-label-sm font-label-sm text-accent-amber-glow hover:underline" href="#/accounts">{t('Manage')}</a>
            </div>
            {accounts.length ? (
              <div className="flex flex-col gap-2">
                {accounts.map((connection) => (
                  <div className="p-2.5 rounded-lg bg-surface-dim border border-border-structural flex items-center justify-between" key={connection.account_id ?? connection.platform}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-surface-layer-2 flex items-center justify-center text-text-primary">
                        <span className="material-symbols-outlined text-[18px]">public</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-label-sm font-label-sm font-semibold text-text-primary">@{connection.username || connection.account_id.slice(0, 8)}</span>
                        <span className="text-[10px] text-text-muted capitalize">{connection.platform}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${connection.publish_readiness === 'ready'
                      ? 'bg-status-operational/15 text-status-operational border border-status-operational/30'
                      : 'bg-status-warning/15 text-status-warning border border-status-warning/30'
                    }`}>
                      {connection.publish_readiness === 'ready' ? t('Ready') : t('Pending')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-surface-dim border border-border-structural flex flex-col items-center gap-2 text-center">
                <span className="material-symbols-outlined text-text-muted text-[22px]">link_off</span>
                <p className="text-body-sm font-body-sm text-text-muted">{t('No connected accounts')}</p>
                <a className="text-label-sm font-label-sm text-accent-amber-glow hover:underline" href="#/accounts">{t('Connect')}</a>
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  )
}

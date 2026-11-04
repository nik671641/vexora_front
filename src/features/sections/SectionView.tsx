import { useEffect, useMemo, useState } from 'react'
import type { AiModel, Company, ContentItem, ViewId } from '../../shared/types/product'
import { navItems } from '../../app/navigation'
import { MetricCard } from '../../shared/components/MetricCard'
import { PanelHeader } from '../../shared/components/PanelHeader'
import { StatusPill } from '../../shared/components/StatusPill'
import { listModels } from '../../api/models'
import { createReference, deleteReference, listReferences, type ReferenceDto } from '../../api/references'
import { getCompanyAccounts, listAccountConnections, testPublishReadiness, updateCompanyAccounts, type AccountConnection } from '../../api/accounts'
import { toneForStatus } from '../../shared/utils/status'
import { useI18n, type Translate } from '../../i18n/context'
import './CalendarView.css'

const LOCALES: Record<string, string> = { en: 'en-US', ru: 'ru-RU', ro: 'ro-RO' }
const CALENDAR_CHANNELS = ['Instagram', 'Telegram', 'TikTok', 'VK', 'YouTube Shorts']

export function SectionView({
  activeView,
  currentCompany,
  contentItems,
  onOpenCreate,
  onOpenContent,
  onOpenApprovals,
}: {
  activeView: ViewId
  currentCompany: Company
  contentItems: ContentItem[]
  onOpenCreate?: () => void
  onOpenContent?: () => void
  onOpenApprovals?: () => void
}) {
  const { t, label, language } = useI18n()
  const title = navItems.find((item) => item.id === activeView)?.label

  if (activeView === 'calendar') {
    return <CalendarView currentCompany={currentCompany} contentItems={contentItems} t={t} label={label} language={language} onOpenCreate={onOpenCreate} onOpenContent={onOpenContent} onOpenApprovals={onOpenApprovals} />
  }

  if (activeView === 'models') {
    return (
      <div className="page-grid">
        <section className="page-hero">
          <div>
            <p className="eyebrow">{t('Catalog from backend')}</p>
            <h2>{t('AI models')}</h2>
            <p>{t('Server-controlled catalog of image and video models. The model is chosen in the create content workflow.')}</p>
          </div>
        </section>
        <ModelsCatalog />
      </div>
    )
  }

  if (activeView === 'references') {
    return <ReferencesView currentCompany={currentCompany} />
  }

  if (activeView === 'accounts') {
    return <AccountsView currentCompany={currentCompany} />
  }

  return (
    <div className="page-grid">
      <section className="page-hero">
        <div>
          <p className="eyebrow">{currentCompany.name}</p>
          <h2>{title ? t(title) : activeView}</h2>
          <p>{t('This area is scaffolded for the MVP. It will connect to the shared API client and use the same approval, status, and preview patterns as the create workspace.')}</p>
        </div>
      </section>
      <MetricCard label={t('API module')} value={t('Planned')} detail={t('Frontend and backend integration pending')} />
      <MetricCard label={t('UX priority')} value="MVP" detail={t('Build dense workflow controls first')} />
    </div>
  )
}

function ReferencesView({ currentCompany }: { currentCompany: Company }) {
  const { t, formatDateTime, label } = useI18n()
  const [items, setItems] = useState<ReferenceDto[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    listReferences(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setItems(result) })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Request failed') })
    return () => controller.abort()
  }, [reload])

  async function upload(file: File) {
    if (!currentCompany.id) return
    setBusy(true)
    setError(null)
    const form = new FormData()
    form.append('file', file)
    form.append('company_id', currentCompany.id)
    form.append('caption', file.name)
    try {
      await createReference(form)
      setReload((value) => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  async function remove(referenceId: string) {
    setBusy(true)
    setError(null)
    try {
      await deleteReference(referenceId)
      setItems((current) => current.filter((item) => item.id !== referenceId))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-grid">
      <section className="page-hero">
        <div>
          <p className="eyebrow">{currentCompany.name}</p>
          <h2>{t('Reference library')}</h2>
          <p>{t('Upload real jobsite assets that ground image and video generation.')}</p>
        </div>
        <label className="primary-button">
          {busy ? t('Processing') : t('Upload reference')}
          <input className="visually-hidden" disabled={busy} type="file" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file) }} />
        </label>
      </section>
      <section className="panel" style={{ gridColumn: '1 / -1' }}>
        <PanelHeader title={t('References')} subtitle={t('{count} files', { count: items.length })} />
        {error && <p className="account-error" role="alert">{error}</p>}
        <div className="content-record-list">
          {items.map((item) => (
            <div className="content-record" key={item.id}>
              <span className="content-record-main">
                <strong>{item.caption || item.original_file_name}</strong>
                <small>{label(item.kind)} · {formatDateTime(item.created_at)} · {Math.max(1, Math.round(item.size_bytes / 1024))} KB</small>
                {item.summary && <small>{item.summary}</small>}
              </span>
              <button className="ghost-button" disabled={busy} onClick={() => { void remove(item.id) }} type="button">{t('Delete')}</button>
            </div>
          ))}
          {!items.length && <p className="content-empty">{t('No references yet.')}</p>}
        </div>
      </section>
    </div>
  )
}

function AccountsView({ currentCompany }: { currentCompany: Company }) {
  const { t } = useI18n()
  const [available, setAvailable] = useState<AccountConnection[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [readiness, setReadiness] = useState<{ ready: boolean; errors: string[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!currentCompany.id) return
    const controller = new AbortController()
    Promise.all([
      listAccountConnections(controller.signal),
      getCompanyAccounts(currentCompany.id, controller.signal),
      testPublishReadiness(currentCompany.id),
    ]).then(([all, linked, status]) => {
      if (controller.signal.aborted) return
      setAvailable(all)
      setSelected(linked.map((item) => item.id))
      setReadiness(status)
      setError(null)
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Request failed')
    })
    return () => controller.abort()
  }, [currentCompany.id, reload])

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function save() {
    if (!currentCompany.id) return
    setBusy(true)
    setError(null)
    try {
      await updateCompanyAccounts(currentCompany.id, { account_ids: selected })
      setReload((value) => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-grid">
      <section className="page-hero">
        <div>
          <p className="eyebrow">{currentCompany.name}</p>
          <h2>{t('Connected publishing accounts')}</h2>
          <p>{t('Choose the provider accounts that this company may publish to.')}</p>
        </div>
        <StatusPill label={readiness?.ready ? t('Ready to publish') : t('Not ready to publish')} tone={readiness?.ready ? 'good' : 'warn'} />
      </section>
      <section className="panel" style={{ gridColumn: '1 / -1' }}>
        <PanelHeader title={t('Available connections')} subtitle={t('Publishing remains approval-first.')} />
        {error && <p className="account-error" role="alert">{error}</p>}
        {readiness && !readiness.ready && readiness.errors.length > 0 && <ul className="delete-warning">{readiness.errors.map((message) => <li key={message}>{message}</li>)}</ul>}
        <div className="content-record-list">
          {available.map((connection) => (
            <label className="content-record" key={connection.id}>
              <input checked={selected.includes(connection.id)} onChange={() => toggle(connection.id)} type="checkbox" />
              <span className="content-record-main">
                <strong>{connection.username || connection.account_id}</strong>
                <small>{connection.provider} · {connection.platform} · {connection.publish_readiness}</small>
              </span>
              <StatusPill label={connection.status} tone={connection.publish_readiness === 'ready' ? 'good' : 'warn'} />
            </label>
          ))}
          {!available.length && <p className="content-empty">{t('No provider connections are available.')}</p>}
        </div>
        <div className="form-actions">
          <button className="primary-button" disabled={busy} onClick={() => { void save() }} type="button">{busy ? t('Processing') : t('Save connections')}</button>
          <button className="secondary-button" disabled={busy} onClick={() => setReload((value) => value + 1)} type="button">{t('Check again')}</button>
        </div>
      </section>
    </div>
  )
}

/**
 * Live Higgsfield model catalog for the "Models" section, grouped into image
 * and video grids. Falls back to the demo placeholders when the API is
 * unreachable (browser-only demo / offline).
 */
function ModelsCatalog() {
  const { t, label } = useI18n()
  const [catalog, setCatalog] = useState<AiModel[] | null>(null)

  useEffect(() => {
    let active = true
    Promise.allSettled([listModels('image'), listModels('video')])
      .then(([image, video]) => {
        if (!active) return
        const merged: AiModel[] = []
        for (const result of [image, video]) if (result.status === 'fulfilled') merged.push(...result.value)
        setCatalog(merged)
      })
    return () => { active = false }
  }, [])

  const current = catalog ?? []
  const image = current.filter((model) => model.media === 'Image')
  const video = current.filter((model) => model.media === 'Video')

  const renderGroup = (group: AiModel[]) => {
    if (!group.length) {
      return <p className="content-empty">{t('No models available for {type}.', { type: label(group === image ? 'Image' : 'Video') })}</p>
    }
    // Group by family, then by version + mode.
    const families = new Map<string, AiModel[]>()
    for (const model of group) {
      const key = model.family || model.name
      families.set(key, [...(families.get(key) ?? []), model])
    }
    return (
      <div className="space-y-4">
        {[...families.entries()].map(([family, models]) => (
          <div key={family}>
            <h4 className="models-group-title">{family}</h4>
            <div className="model-grid">
              {models.map((model) => (
                <section className="panel model-card" key={model.name}>
                  <div>
                    <h3>{model.mode || model.name}{model.version && model.version !== '—' ? ` · v${model.version}` : ''}</h3>
                    <p>{model.provider} / {label(model.media)} / {model.price}</p>
                    {model.resolution && <p className="model-workflow">{t('Resolution')}: {model.resolution}</p>}
                    {model.min_duration_sec != null && model.max_duration_sec != null && (
                      <p className="model-workflow">{t('Video Duration')}: {model.min_duration_sec}–{model.max_duration_sec} {t('sec')}</p>
                    )}
                    {model.workflow === 'image_to_video' && (
                      <p className="model-workflow">{t('Image-to-video')} — {t('input photo required')}</p>
                    )}
                  </div>
                  <StatusPill label={model.ready ? t('Ready') : t('Not ready')} tone={model.ready ? 'good' : 'warn'} />
                </section>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <section className="panel models-panel">
      <PanelHeader title={t('Models')} subtitle={catalog ? t('Server-controlled catalog.') : t('Loading…')} />
      <h3 className="models-group-title">{t('Image generation')}</h3>
      {renderGroup(image)}
      <h3 className="models-group-title">{t('Video generation')}</h3>
      {renderGroup(video)}
    </section>
  )
}

type CalendarRenderProps = {
  currentCompany: Company
  contentItems: ContentItem[]
  t: Translate
  label: (value: string) => string
  language: string
  onOpenCreate?: () => void
  onOpenContent?: () => void
  onOpenApprovals?: () => void
}

/** Dense publishing workbench backed by real content items. */
function CalendarView({ currentCompany, contentItems, t, label, language, onOpenCreate, onOpenContent, onOpenApprovals }: CalendarRenderProps) {
  const locale = LOCALES[language] ?? 'en-US'
  const today = new Date()
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(localDateKey(today))
  const [channelFilter, setChannelFilter] = useState('all')
  const [connectedChannels, setConnectedChannels] = useState<string[]>([])

  const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2024, 0, 1 + i)
    return dayFormatter.format(date)
  })

  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(cursor)
  const visibleMonth = language === 'en' ? monthTitle : monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1)

  useEffect(() => {
    if (!currentCompany.id) return
    const controller = new AbortController()
    getCompanyAccounts(currentCompany.id, controller.signal)
      .then((accounts) => {
        if (!controller.signal.aborted) setConnectedChannels(accounts.map((account) => normalizeChannelName(account.platform)))
      })
      .catch(() => { if (!controller.signal.aborted) setConnectedChannels([]) })
    return () => controller.abort()
  }, [currentCompany.id])

  const profileChannels = useMemo(
    () => (currentCompany.socialAccounts ?? '').split(/[,;\n]+/).map((item) => normalizeChannelName(item)).filter(Boolean),
    [currentCompany.socialAccounts],
  )
  const channels = useMemo(() => [...new Set([...CALENDAR_CHANNELS, ...connectedChannels, ...profileChannels])], [connectedChannels, profileChannels])
  const activeChannelFilter = channelFilter === 'all' || channels.includes(channelFilter) ? channelFilter : 'all'

  const companyItems = useMemo(
    () => contentItems.filter((item) => item.company === currentCompany.name),
    [contentItems, currentCompany.name],
  )
  const calendarItems = useMemo(() => companyItems.filter((item) => {
    if (item.status !== 'Scheduled' && item.status !== 'Published') return false
    return Boolean(item.scheduledFor || item.time)
  }), [companyItems])
  const postsByDate = useMemo(() => {
    const map = new Map<string, ContentItem[]>()
    for (const item of calendarItems) {
      const dateValue = item.scheduledFor || (item.time ? isoFromTimeLabel(item.time) : '')
      if (!dateValue) continue
      const key = dateValue.slice(0, 10)
      map.set(key, [...(map.get(key) ?? []), item].sort((left, right) => calendarItemDate(left).getTime() - calendarItemDate(right).getTime()))
    }
    return map
  }, [calendarItems])

  const cells = useMemo(() => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor])
  const selectedItems = postsByDate.get(selected) ?? []
  const scheduledCount = companyItems.filter((item) => item.status === 'Scheduled').length
  const publishedCount = companyItems.filter((item) => item.status === 'Published').length
  const reviewCount = companyItems.filter((item) => item.status === 'Draft').length
  const failedCount = companyItems.filter((item) => item.status === 'Failed').length
  const monthCount = calendarItems.filter((item) => {
    const date = calendarItemDate(item)
    return date.getFullYear() === cursor.getFullYear() && date.getMonth() === cursor.getMonth()
  }).length

  function moveMonth(delta: number) {
    setCursor((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + delta, 1)
      setSelected(localDateKey(next))
      return next
    })
  }

  function selectDate(year: number, month: number, day: number) {
    setSelected(localDateKey(new Date(year, month, day)))
  }

  const channelFilters = [{ key: 'all', label: t('All channels'), color: 'orange' }, ...channels.map((channel, index) => ({ key: channel, label: channel, color: channelTone(channel, index) }))]
  const selectedDate = dateFromKey(selected)
  const selectedDateTitle = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(selectedDate)
  const selectedDateYear = selectedDate.getFullYear()

  return (
    <div className="publishing-calendar-page">
      <section className="page-hero publishing-calendar-hero">
        <div>
          <p className="eyebrow">{t('Production library')}</p>
          <div className="publishing-calendar-title"><h2>{t('Publishing calendar')}</h2><span><i />{t('{count} posts this month', { count: monthCount })}</span></div>
          <p>{t('Plan generation, approvals, and distribution for {company}.', { company: currentCompany.name })}</p>
        </div>
        <div className="publishing-calendar-stats">
          <CalendarStat label={t('Scheduled')} value={scheduledCount} tone="green" />
          <CalendarStat label={t('Published')} value={publishedCount} tone="light" />
          <CalendarStat label={t('Waiting for review')} value={reviewCount} tone="orange" />
          <CalendarStat label={t('Errors')} value={failedCount} tone="danger" />
        </div>
      </section>

      <section className="panel publishing-calendar-toolbar">
        <div className="publishing-calendar-navigation">
          <div className="publishing-calendar-month" aria-label={t('Month navigation')}>
            <button type="button" onClick={() => moveMonth(-1)} aria-label={t('Previous month')}>‹</button>
            <strong>{visibleMonth}</strong>
            <button type="button" onClick={() => moveMonth(1)} aria-label={t('Next month')}>›</button>
          </div>
          <button type="button" className="publishing-calendar-today" onClick={() => { const now = new Date(); setCursor(new Date(now.getFullYear(), now.getMonth(), 1)); setSelected(localDateKey(now)) }}>{t('Today')}</button>
        </div>
        <div className="publishing-calendar-filters" aria-label={t('Content filters')}>
          {channelFilters.map((item) => <button aria-pressed={activeChannelFilter === item.key} className={activeChannelFilter === item.key ? 'active' : ''} key={item.key} onClick={() => setChannelFilter(item.key)} type="button"><i className={`tone-${item.color}`} />{item.label}</button>)}
        </div>
        <span className="publishing-calendar-view"><span className="material-symbols-outlined" aria-hidden="true">calendar_view_month</span>{t('Month')}</span>
      </section>

      <div className="publishing-calendar-workspace">
        <section className="panel publishing-calendar-board" aria-label={t('Publishing calendar')}>
          <div className="publishing-calendar-weekdays">
            {weekdayLabels.map((day, index) => <span className={index > 4 ? 'weekend' : ''} key={`${day}-${index}`}>{day}</span>)}
          </div>
          <div className="publishing-calendar-days">
            {cells.map((cell) => {
              const date = new Date(cell.year, cell.month, cell.day)
              const key = localDateKey(date)
              const isToday = sameDay(date, today)
              const isSelected = key === selected
              const posts = postsByDate.get(key) ?? []
              const inMonth = cell.month === cursor.getMonth()
              return (
                <button
                  type="button"
                  key={key}
                  className={[
                    'publishing-calendar-day',
                    inMonth ? '' : 'outside-month',
                    isToday ? 'today' : '',
                    isSelected ? 'selected' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => selectDate(cell.year, cell.month, cell.day)}
                  aria-pressed={isSelected}
                >
                  <span className="publishing-calendar-day-head"><strong>{date.getDate()}</strong>{isToday && <em>{t('Today')}</em>}{posts.length > 0 && <small>{t('{count} posts', { count: posts.length })}</small>}</span>
                  <span className="publishing-calendar-events">{posts.slice(0, 3).map((post) => <span className={`publishing-calendar-event ${post.status.toLowerCase()}`} key={post.id}><i />{formatItemTime(post, locale)} · {post.title}</span>)}{posts.length > 3 && <span className="publishing-calendar-more">+{posts.length - 3}</span>}</span>
                </button>
              )
            })}
          </div>
        </section>

        <aside className="panel publishing-calendar-detail">
          <div className="publishing-calendar-detail-head"><div><strong>{selectedDateTitle}</strong><span>{selectedDateYear}</span><p>{t('{count} publications scheduled', { count: selectedItems.length })}</p></div><button aria-label={t('Create content')} onClick={onOpenCreate} type="button">+</button></div>
          <div className="publishing-calendar-detail-list">
            {selectedItems.map((item) => <article className="publishing-calendar-card" key={item.id}>
              <div className="publishing-calendar-card-top"><strong>{formatItemTime(item, locale)}</strong><StatusPill label={label(item.status)} tone={toneForStatus(item.status)} /></div>
              <div className="publishing-calendar-card-body"><span className="publishing-calendar-card-media">{item.thumbnailUrl || (item.type !== 'Video' && item.mediaUrl) ? <img alt="" src={item.thumbnailUrl || item.mediaUrl} /> : <span className="material-symbols-outlined">{item.type === 'Video' ? 'play_arrow' : 'image'}</span>}</span><div><h3>{item.title}</h3><span className="publishing-calendar-card-model"><span className="material-symbols-outlined" aria-hidden="true">neurology</span>{item.model || t('Model not specified')}</span>{uniqueCalendarDescription(item) && <p>{uniqueCalendarDescription(item)}</p>}<small>{label(item.type)}</small></div></div>
              <button className="publishing-calendar-card-action" onClick={item.status === 'Draft' ? onOpenApprovals : onOpenContent} type="button">{item.status === 'Draft' ? t('Review') : t('Open content')}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button>
            </article>)}
            {!selectedItems.length && <div className="publishing-calendar-empty"><span className="material-symbols-outlined" aria-hidden="true">event_available</span><strong>{t('This day is free')}</strong><p>{t('Create content or choose another highlighted day.')}</p></div>}
          </div>
          <button className="publishing-calendar-create" onClick={onOpenCreate} type="button"><span aria-hidden="true">+</span>{t('Create content')}</button>
        </aside>
      </div>
    </div>
  )
}

function normalizeChannelName(value: string) {
  const clean = value.trim().replace(/^@/, '')
  const lower = clean.toLowerCase()
  if (!clean) return ''
  if (lower.includes('instagram')) return 'Instagram'
  if (lower.includes('facebook')) return 'Facebook'
  if (lower.includes('tiktok')) return 'TikTok'
  if (lower.includes('telegram')) return 'Telegram'
  if (lower.includes('youtube')) return 'YouTube Shorts'
  if (lower.includes('linkedin')) return 'LinkedIn'
  if (lower === 'vk' || lower.includes('vkontakte')) return 'VK'
  if (lower === 'x' || lower.includes('twitter')) return 'X'
  if (lower.includes('threads')) return 'Threads'
  if (lower.includes('pinterest')) return 'Pinterest'
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

function channelTone(channel: string, index: number) {
  const lower = channel.toLowerCase()
  if (lower === 'instagram') return 'pink'
  if (lower === 'telegram' || lower === 'linkedin') return 'blue'
  if (lower === 'tiktok') return 'cyan'
  if (lower === 'facebook' || lower === 'vk') return 'blue'
  if (lower.includes('youtube')) return 'orange'
  return ['green', 'pink', 'cyan', 'blue'][index % 4]
}

function uniqueCalendarDescription(item: ContentItem) {
  const description = (item.caption || item.brief || '').trim()
  if (!description) return ''
  const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  return normalize(description) === normalize(item.title) ? '' : description
}

function CalendarStat({ label, value, tone }: { label: string; value: number; tone: 'green' | 'light' | 'orange' | 'danger' }) {
  return <div className={`publishing-calendar-stat tone-${tone}`}><span>{label}</span><strong>{value}</strong></div>
}

type Cell = { year: number; month: number; day: number }

function buildMonthGrid(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7 // Monday-first
  const cells: Cell[] = []
  const start = new Date(year, month, 1 - offset)
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    cells.push({ year: date.getFullYear(), month: date.getMonth(), day: date.getDate() })
  }
  return cells
}

/** Local date key "YYYY-MM-DD" (avoids the UTC shift of toISOString). */
function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function calendarItemDate(item: ContentItem) {
  const value = item.scheduledFor || (item.time ? isoFromTimeLabel(item.time) : '')
  const date = value ? new Date(value) : new Date(0)
  return Number.isNaN(date.getTime()) ? new Date(0) : date
}

function formatItemTime(item: ContentItem, locale: string) {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(calendarItemDate(item))
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/**
 * Best-effort conversion of legacy human time labels ("Today, 16:30",
 * "Oct 09, 12:00") into a local ISO "YYYY-MM-DDTHH:MM" string. Used only for
 * sample rows that have no explicit scheduledFor date.
 */
function isoFromTimeLabel(time: string): string {
  const cleaned = time.trim()
  const withTime = /\d{1,2}:\d{2}/.exec(cleaned)
  if (!withTime) return ''
  const [hours, minutes] = withTime[0].split(':').map(Number)
  if (/^today,/i.test(cleaned)) {
    const now = new Date()
    return localIso(new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes))
  }
  if (/^tomorrow,/i.test(cleaned)) {
    const now = new Date()
    return localIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours, minutes))
  }
  const monthMatch = /^([A-Za-z]+)\s+(\d{1,2}),/.exec(cleaned)
  if (monthMatch) {
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthMatch[1])
    if (monthIndex >= 0) {
      const now = new Date()
      return localIso(new Date(now.getFullYear(), monthIndex, Number(monthMatch[2]), hours, minutes))
    }
  }
  const now = new Date()
  return localIso(new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes))
}

/** Local ISO "YYYY-MM-DDTHH:MM", matching datetime-local/backend format. */
function localIso(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${localDateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

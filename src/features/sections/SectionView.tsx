import { useEffect, useMemo, useState } from 'react'
import type { Company, ContentItem, ViewId } from '../../shared/types/product'
import { StatusPill } from '../../shared/components/StatusPill'
import { getCompanyAccounts } from '../../api/accounts'
import { listWorkflows, type Workflow } from '../../api/workflows'
import { ModelsCatalog, ReferencesView, AccountsView } from './CatalogViews'
import { WorkspaceSettings } from './WorkspaceSettings'
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
  onCompanySave,
}: {
  activeView: ViewId
  currentCompany: Company
  contentItems: ContentItem[]
  onOpenCreate?: () => void
  onOpenContent?: () => void
  onOpenApprovals?: () => void
  onCompanySave?: (company: Company) => Promise<Company>
}) {
  const { t, label, language } = useI18n()

  if (activeView === 'calendar') {
    return <CalendarView currentCompany={currentCompany} contentItems={contentItems} t={t} label={label} language={language} onOpenCreate={onOpenCreate} onOpenContent={onOpenContent} onOpenApprovals={onOpenApprovals} />
  }

  if (activeView === 'models') return <ModelsCatalog currentCompany={currentCompany} onCompanySave={onCompanySave} />

  if (activeView === 'references') {
    return <ReferencesView currentCompany={currentCompany} />
  }

  if (activeView === 'accounts') {
    return <AccountsView currentCompany={currentCompany} />
  }

  return <WorkspaceSettings currentCompany={currentCompany} />
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
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'list'>('month')
  const [connectedChannels, setConnectedChannels] = useState<string[]>([])
  const [workflowTargets, setWorkflowTargets] = useState<{ companyId: string; items: Workflow[] }>({ companyId: '', items: [] })

  const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2024, 0, 1 + i)
    return dayFormatter.format(date)
  })

  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(cursor)
  const visibleMonth = language === 'en' ? monthTitle : monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1)

  useEffect(() => {
    const companyId = currentCompany.id
    if (!companyId) return
    const controller = new AbortController()
    getCompanyAccounts(companyId, controller.signal)
      .then((accounts) => {
        if (!controller.signal.aborted) setConnectedChannels(accounts.map((account) => normalizeChannelName(account.platform)))
      })
      .catch(() => { if (!controller.signal.aborted) setConnectedChannels([]) })
    listWorkflows(companyId, controller.signal)
      .then(items => { if (!controller.signal.aborted) setWorkflowTargets({ companyId, items }) })
      .catch(() => { if (!controller.signal.aborted) setWorkflowTargets({ companyId, items: [] }) })
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
    const workflow = workflowTargets.companyId === currentCompany.id ? workflowTargets.items.find(workflow => workflow.id === item.workflowId || workflow.content_item_id === item.id) : undefined
    const savedPlatforms = workflow?.draft_data?.platforms
    const targets = Array.isArray(savedPlatforms) && savedPlatforms.length
      ? savedPlatforms.filter((target): target is string => typeof target === 'string')
      : ((workflow?.brief || item.brief || '').match(/Platform targets:\s*([^\n]+)/i)?.[1] ?? '').split(',')
    const matchesChannel = activeChannelFilter === 'all' || targets.some(target => normalizeChannelName(target) === activeChannelFilter)
    return matchesChannel && Boolean(item.scheduledFor || item.time)
  }), [companyItems, activeChannelFilter, workflowTargets, currentCompany.id])
  const postsByDate = useMemo(() => {
    const map = new Map<string, ContentItem[]>()
    for (const item of calendarItems) {
      const dateValue = item.scheduledFor || (item.time ? isoFromTimeLabel(item.time) : '')
      if (!dateValue) continue
      const key = localDateKey(calendarItemDate(item))
      map.set(key, [...(map.get(key) ?? []), item].sort((left, right) => calendarItemDate(left).getTime() - calendarItemDate(right).getTime()))
    }
    return map
  }, [calendarItems])

  const cells = useMemo(() => {
    if (calendarView !== 'week') return buildMonthGrid(cursor.getFullYear(), cursor.getMonth())
    const date = dateFromKey(selected)
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay() + 6) % 7)
    return Array.from({ length: 7 }, (_, index) => {
      const cell = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
      return { year: cell.getFullYear(), month: cell.getMonth(), day: cell.getDate() }
    })
  }, [cursor, selected, calendarView])
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
    if (calendarView === 'week') {
      const current = dateFromKey(selected)
      const next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + delta * 7)
      setSelected(localDateKey(next)); setCursor(new Date(next.getFullYear(), next.getMonth(), 1)); return
    }
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
        <div className="precision-tabs" aria-label={t('Publishing calendar')}>{(['month', 'week', 'list'] as const).map(value => <button type="button" key={value} aria-pressed={calendarView === value} onClick={() => setCalendarView(value)}>{({ ru: { month: 'Месяц', week: 'Неделя', list: 'Список' }, en: { month: 'Month', week: 'Week', list: 'List' }, ro: { month: 'Lună', week: 'Săptămână', list: 'Listă' } }[language] ?? { month: 'Month', week: 'Week', list: 'List' })[value]}</button>)}</div>
      </section>

      <div className="publishing-calendar-workspace">
        <section className="panel publishing-calendar-board" aria-label={t('Publishing calendar')}>
          {calendarView === 'list' ? <div className="precision-calendar-agenda">{calendarItems.filter(item => { const date = calendarItemDate(item); return date.getFullYear() === cursor.getFullYear() && date.getMonth() === cursor.getMonth() }).sort((a,b) => calendarItemDate(a).getTime() - calendarItemDate(b).getTime()).map(item => <button type="button" key={item.id} onClick={() => setSelected(localDateKey(calendarItemDate(item)))}><span>{new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(calendarItemDate(item))}<small>{formatItemTime(item, locale)}</small></span><strong>{item.title}<small>{item.model || t('Model not specified')}</small></strong><StatusPill label={label(item.status)} tone={toneForStatus(item.status)} /></button>)}{!monthCount && <p className="content-empty">{t('This day is free')}</p>}</div> : <>
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
          </>}
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

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Company, ContentItem } from '../../shared/types/product'
import { PanelHeader } from '../../shared/components/PanelHeader'
import { Select } from '../../shared/components/Select'
import { StatusPill } from '../../shared/components/StatusPill'
import { useI18n } from '../../i18n/context'
import './ApprovalQueue.css'

type ApprovalQueueProps = {
  items: ContentItem[]
  companies: Company[]
  currentCompany: Company
  onSave: (id: string, caption: string, hashtags: string) => Promise<boolean>
  onApprove: (id: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
  onSchedule: (id: string, scheduledFor: string) => Promise<boolean>
  onOpenWorkflow: (item: ContentItem) => void
}

export function ApprovalQueue(props: ApprovalQueueProps) {
  const { t, label, contentTime } = useI18n()
  const [companyFilter, setCompanyFilter] = useState('current')
  const [typeFilter, setTypeFilter] = useState('All types')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const detailRef = useRef<HTMLElement>(null)

  const pending = useMemo(
    () => props.items.filter((item) => item.source === 'local' && item.status === 'Draft'),
    [props.items],
  )
  const companies = [...new Set(pending.map((item) => item.company))]
  const types = [...new Set(pending.map((item) => item.type))]
  const visible = useMemo(() => pending.filter((item) => {
    const company = companyFilter === 'current' ? props.currentCompany.name : companyFilter
    return (company === 'All companies' || item.company === company)
      && (typeFilter === 'All types' || item.type === typeFilter)
      && (!query.trim() || `${item.title} ${item.caption ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))
  }), [pending, companyFilter, props.currentCompany.name, typeFilter, query])
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0]

  function selectItem(id: string) {
    setSelectedId(id)
    if (window.matchMedia('(max-width: 1000px)').matches) {
      window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }

  return (
    <div className="approval-layout">
      <section className="page-hero approval-hero">
        <div>
          <p className="eyebrow">{t('Human review')}</p>
          <h2>{t('Approval queue')}</h2>
          <p>{t('Review copy and media, then approve, schedule, or remove each draft.')}</p>
        </div>
        <div className="approval-hero-stats">
          <strong>{pending.length}</strong>
          <span>{t('Waiting for review')}</span>
        </div>
      </section>

      <section className="panel approval-list-panel">
        <PanelHeader title={t('Waiting for review')} subtitle={t('Only draft content appears in this queue.')} />
        <div className="approval-filters">
          <label>{t('Company')}
            <Select ariaLabel={t('Company')} value={companyFilter} onChange={setCompanyFilter} options={[
              { value: 'current', label: t('Active company ({company})', { company: props.currentCompany.name }) },
              { value: 'All companies', label: t('All companies') },
              ...companies.map((company) => ({ value: company, label: company })),
            ]} />
          </label>
          <label>{t('Media')}
            <Select ariaLabel={t('Media')} value={typeFilter} onChange={setTypeFilter} options={[
              { value: 'All types', label: t('All types') },
              ...types.map((type) => ({ value: type, label: label(type) })),
            ]} />
          </label>
          <label className="approval-search">{t('Search')}
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Title or caption')} />
          </label>
        </div>
        <div className="approval-record-list">
          {visible.map((item) => (
            <button className={`approval-record ${selected?.id === item.id ? 'selected' : ''}`} key={item.id} onClick={() => selectItem(item.id)} type="button">
              <span className="approval-record-thumb">
                {item.thumbnailUrl || (item.type !== 'Video' && item.mediaUrl) ? <img alt="" src={item.thumbnailUrl || item.mediaUrl} /> : <span className="material-symbols-outlined">draft</span>}
              </span>
              <span className="approval-record-main">
                <strong>{item.title}</strong>
                <small>{item.company} · {label(item.type)}</small>
                <small>{contentTime(item)}</small>
              </span>
              <StatusPill label={t('Needs review')} tone="warn" />
            </button>
          ))}
          {!visible.length && <div className="approval-empty"><span className="material-symbols-outlined">task_alt</span><strong>{t('Queue is clear')}</strong><p>{t('There are no drafts waiting for approval.')}</p></div>}
        </div>
      </section>

      <aside className="panel approval-detail-panel" ref={detailRef}>
        {selected
          ? <ApprovalDetail key={selected.id} {...props} item={selected} />
          : <div className="approval-empty"><span className="material-symbols-outlined">fact_check</span><strong>{t('Nothing to review')}</strong><p>{t('New generated drafts will appear here.')}</p></div>}
      </aside>
    </div>
  )
}

function ApprovalDetail({ item, companies, onSave, onApprove, onDelete, onSchedule, onOpenWorkflow }: ApprovalQueueProps & { item: ContentItem }) {
  const { t, label } = useI18n()
  const [caption, setCaption] = useState(item.caption ?? '')
  const [hashtags, setHashtags] = useState(item.hashtags ?? '')
  const [scheduledFor, setScheduledFor] = useState('')
  const [busy, setBusy] = useState<'save' | 'approve' | 'schedule' | 'delete' | null>(null)
  const [message, setMessage] = useState('')
  const canEdit = companies.find((company) => company.name === item.company)?.role !== 'viewer'
  const changed = caption !== (item.caption ?? '') || hashtags !== (item.hashtags ?? '')

  async function saveChanges() {
    setBusy('save')
    const ok = await onSave(item.id, caption, hashtags)
    setMessage(ok ? t('Changes saved. The draft still needs approval.') : '')
    setBusy(null)
    return ok
  }

  async function approve() {
    if (changed && !(await saveChanges())) return
    setBusy('approve')
    const ok = await onApprove(item.id)
    if (ok) setMessage(t('Approved and removed from the review queue.'))
    setBusy(null)
  }

  async function schedule() {
    if (!scheduledFor) {
      setMessage(t('Choose a future date and time.'))
      return
    }
    const iso = new Date(scheduledFor).toISOString()
    if (new Date(iso) <= new Date()) {
      setMessage(t('Choose a future date and time.'))
      return
    }
    if (changed && !(await saveChanges())) return
    setBusy('schedule')
    const ok = await onSchedule(item.id, iso)
    if (ok) setMessage(t('Approved and added to the calendar.'))
    setBusy(null)
  }

  async function remove() {
    if (!window.confirm(t('Delete this draft permanently?'))) return
    setBusy('delete')
    await onDelete(item.id)
    setBusy(null)
  }

  return (
    <>
      <PanelHeader title={t('Review draft')} subtitle={`${item.company} · ${label(item.type)}`} />
      <div className="precision-review-grid">
      <div className="approval-preview">
        {item.mediaUrl
          ? item.type === 'Video'
            ? <video controls poster={item.thumbnailUrl} preload="metadata" src={item.mediaUrl} />
            : <img alt={item.title} src={item.mediaUrl} />
          : <div className="approval-preview-placeholder"><span className="material-symbols-outlined">image</span>{t('No generated media attached')}</div>}
      </div>
      <div className="precision-review-copy">
      <div className="approval-detail-heading"><div><p className="eyebrow">{t('Draft')}</p><h3>{item.title}</h3></div><StatusPill label={t('Needs review')} tone="warn" /></div>
      {item.idea && <div className="approval-idea"><span>{t('Approved idea')}</span><p>{item.idea}</p></div>}
      <div className="approval-editor">
        <label>{t('Caption')}<textarea disabled={!canEdit} rows={7} value={caption} onChange={(event) => { setCaption(event.target.value); setMessage('') }} /></label>
        <label>{t('Hashtags')}<input disabled={!canEdit} value={hashtags} onChange={(event) => { setHashtags(event.target.value); setMessage('') }} placeholder="#roofing #localbusiness" /></label>
        {canEdit && <button className="secondary-button" disabled={!changed || busy !== null} onClick={() => { void saveChanges() }} type="button">{busy === 'save' ? t('Saving…') : t('Save draft')}</button>}
      </div>
      <div className="approval-schedule">
        <ApprovalSchedulePicker disabled={!canEdit || busy !== null} onChange={setScheduledFor} value={scheduledFor} />
        <button className="secondary-button" disabled={!canEdit || busy !== null} onClick={() => { void schedule() }} type="button">{busy === 'schedule' ? t('Scheduling…') : t('Approve & schedule')}</button>
      </div>
      </div>
      </div>
      <div className="approval-actions">
        <button className="primary-button approval-approve" disabled={!canEdit || busy !== null} onClick={() => { void approve() }} type="button"><span className="material-symbols-outlined">check_circle</span>{busy === 'approve' ? t('Approving…') : t('Approve')}</button>
        <button className="ghost-button approval-edit" disabled={busy !== null} onClick={() => onOpenWorkflow(item)} type="button">{t('Open in Create')}</button>
        <button className="danger-button approval-delete" disabled={!canEdit || busy !== null} onClick={() => { void remove() }} type="button"><span className="material-symbols-outlined">delete</span>{busy === 'delete' ? t('Deleting…') : t('Delete')}</button>
      </div>
      {message && <p className="approval-message" role="status">{message}</p>}
      {!canEdit && <p className="approval-message">{t('Viewer access: approval actions are disabled.')}</p>}
    </>
  )
}

function ApprovalSchedulePicker({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const { t, language } = useI18n()
  const locale = language === 'ru' ? 'ru-RU' : language === 'ro' ? 'ro-RO' : 'en-US'
  const now = new Date()
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(value ? value.slice(0, 10) : '')
  const [time, setTime] = useState(value ? value.slice(11, 16) : '12:00')
  const [open, setOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const timeOptions = useMemo(() => Array.from({ length: 48 }, (_, index) => {
    const hours = String(Math.floor(index / 2)).padStart(2, '0')
    const minutes = index % 2 ? '30' : '00'
    const label = `${hours}:${minutes}`
    return { value: label, label }
  }), [])

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const result: Array<number | null> = Array.from({ length: offset }, () => null)
    for (let day = 1; day <= days; day += 1) result.push(day)
    while (result.length % 7) result.push(null)
    return result
  }, [cursor])

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(2024, 0, 1 + index)))
  }, [locale])
  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(cursor)

  function selectDay(day: number) {
    const date = localDateKey(new Date(cursor.getFullYear(), cursor.getMonth(), day))
    setSelectedDate(date)
    onChange(`${date}T${time}`)
    setOpen(false)
  }

  function selectTime(next: string) {
    setTime(next)
    if (selectedDate) onChange(`${selectedDate}T${next}`)
  }

  return <div className="approval-schedule-picker schedule-picker" ref={pickerRef}>
    <span className="approval-schedule-label">{t('Schedule after approval')}</span>
    <div className="schedule-input-wrapper">
      <button aria-expanded={open} aria-haspopup="dialog" className="schedule-date-button" disabled={disabled} onClick={() => setOpen((current) => !current)} type="button">
        {selectedDate ? <><span className="schedule-date-value">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span><span className="schedule-date-sep">,</span><span className="schedule-year">{selectedDate.slice(0, 4)}</span></> : <span className="schedule-date-placeholder">{t('Pick a date')}</span>}
        <span className="schedule-caret" aria-hidden="true">▼</span>
      </button>
      <Select ariaLabel={t('Time')} className="approval-time-select" disabled={disabled} onChange={selectTime} options={timeOptions} value={time} />
    </div>
    {open && <div aria-label={t('Pick a date')} className="schedule-calendar-popover" role="dialog">
      <div className="schedule-calendar-header"><button aria-label={t('Previous month')} className="schedule-nav" onClick={() => setCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} type="button">‹</button><span className="schedule-month-title">{monthTitle}</span><button aria-label={t('Next month')} className="schedule-nav" onClick={() => setCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} type="button">›</button></div>
      <div className="schedule-weekdays">{weekdayLabels.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
      <div className="schedule-days">{cells.map((day, index) => {
        if (!day) return <span className="schedule-day schedule-day--empty" key={`empty-${index}`} />
        const date = new Date(cursor.getFullYear(), cursor.getMonth(), day)
        const key = localDateKey(date)
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const isPast = date < today
        const isToday = date.getTime() === today.getTime()
        const isSelected = key === selectedDate
        return <button aria-pressed={isSelected} className={['schedule-day', isToday ? 'schedule-day--today' : '', isSelected ? 'schedule-day--selected' : '', isPast ? 'schedule-day--past' : ''].filter(Boolean).join(' ')} disabled={isPast} key={key} onClick={() => selectDay(day)} type="button">{day}</button>
      })}</div>
    </div>}
  </div>
}

function localDateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

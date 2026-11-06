import { useEffect, useMemo, useRef, useState } from 'react'
import type { ContentItem } from '../../shared/types/product'
import { PanelHeader } from '../../shared/components/PanelHeader'
import { StatusPill } from '../../shared/components/StatusPill'
import { Select } from '../../shared/components/Select'
import { toneForStatus } from '../../shared/utils/status'
import { useI18n } from '../../i18n/context'
import { listWorkflowEvents, type WorkflowEvent } from '../../api/workflows'

export function ContentView({
  items, currentCompany, activeWorkflowIds, onSave, onOpenWorkflow,
}: {
  items: ContentItem[]
  currentCompany: string
  activeWorkflowIds: string[]
  onSave: (id: string, caption: string, hashtags: string) => Promise<boolean>
  onOpenWorkflow: (companyName: string) => void
}) {
  const { t, label, contentTime } = useI18n()
  const [companyFilter, setCompanyFilter] = useState('current')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [typeFilter, setTypeFilter] = useState('All types')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const detailRef = useRef<HTMLElement>(null)

  function selectItem(id: string) {
    setSelectedId(id)
    if (window.matchMedia('(max-width: 1000px)').matches) {
      window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      }))
    }
  }

  const companies = [...new Set(items.map((item) => item.company))]
  const statuses = [...new Set(items.map((item) => item.status))]
  const types = [...new Set(items.map((item) => item.type))]
  const visibleItems = useMemo(() => items.filter((item) => {
    const company = companyFilter === 'current' ? currentCompany : companyFilter
    return (company === 'All companies' || item.company === company)
      && (statusFilter === 'All statuses' || item.status === statusFilter)
      && (typeFilter === 'All types' || item.type === typeFilter)
      && (!query.trim() || `${item.title} ${item.brief ?? ''} ${item.caption ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))
  }), [items, companyFilter, currentCompany, statusFilter, typeFilter, query])
  const selected = visibleItems.find((item) => item.id === selectedId) ?? visibleItems[0]

  return (
    <div className="content-layout">
      <section className="page-hero">
        <div>
          <p className="eyebrow">{t('Production library')}</p>
          <h2>{t('Content')}</h2>
          <p>{t('Review generated posts, their copy, status, and workflow activity.')}</p>
        </div>
        <StatusPill label={t('{count} shown', { count: visibleItems.length })} tone="neutral" />
      </section>

      <section className="panel content-list-panel">
        <PanelHeader title={t('Content history')} subtitle={t('Select a post to inspect or edit its package.')} />
        <div className="content-filters">
          <label>
            {t('Company')}
            <Select
              ariaLabel={t('Company')}
              value={companyFilter}
              onChange={setCompanyFilter}
              options={[
                { value: 'current', label: t('Active company ({company})', { company: currentCompany }) },
                { value: 'All companies', label: t('All companies') },
                ...companies.map((company) => ({ value: company, label: company })),
              ]}
            />
          </label>
          <label>
            {t('Status')}
            <Select
              ariaLabel={t('Status')}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ value: 'All statuses', label: t('All statuses') }, ...statuses.map((status) => ({ value: status, label: label(status) }))]}
            />
          </label>
          <label>
            {t('Media')}
            <Select
              ariaLabel={t('Media')}
              value={typeFilter}
              onChange={setTypeFilter}
              options={[{ value: 'All types', label: t('All types') }, ...types.map((type) => ({ value: type, label: label(type) }))]}
            />
          </label>
          <label>
            {t('Search')}
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Title, brief, caption')} />
          </label>
        </div>

        <div className="precision-data-scroll"><table className="precision-data-table">
          <thead><tr><th>{t('Preview')}</th><th>{t('Title')}</th><th>{t('Model')}</th><th>{t('Status')}</th></tr></thead>
          <tbody>{visibleItems.map((item) => <tr className={selected?.id === item.id ? 'is-selected' : ''} key={item.id}>
            <td><span className="precision-thumb">{item.thumbnailUrl || (item.type !== 'Video' && item.mediaUrl) ? <img alt="" loading="lazy" src={item.thumbnailUrl || item.mediaUrl} /> : <span className="material-symbols-outlined" aria-hidden="true">{item.type === 'Video' ? 'videocam' : 'image'}</span>}</span></td>
            <td><button type="button" className="precision-data-title" aria-pressed={selected?.id === item.id} title={item.title} onClick={() => selectItem(item.id)}>{item.title}</button><small>{item.company} · {label(item.type)} · {contentTime(item)}</small></td>
            <td><small>{item.model || t('Unknown')}</small></td>
            <td><StatusPill label={label(item.status)} tone={toneForStatus(item.status)} /></td>
          </tr>)}</tbody>
        </table></div>
        {visibleItems.length === 0 && <div className="content-empty">{t('No posts match these filters. Try another company or status.')}</div>}
        <div className="precision-data-count"><span>{t('{count} shown', { count: visibleItems.length })}</span><span>{t('Content history')}</span></div>

      </section>

      <aside className="panel content-detail-panel" ref={detailRef}>
        {selected ? (
          <ContentDetail
            key={selected.id}
            item={selected}
            isActiveWorkflow={Boolean(selected.workflowId && activeWorkflowIds.includes(selected.workflowId))}
            onSave={onSave}
            onOpenWorkflow={onOpenWorkflow}
          />
        ) : (
          <div className="content-empty">{t('Select a post to see its details.')}</div>
        )}
      </aside>
    </div>
  )
}

function ContentDetail({
  item, isActiveWorkflow, onSave, onOpenWorkflow,
}: {
  item: ContentItem
  isActiveWorkflow: boolean
  onSave: (id: string, caption: string, hashtags: string) => Promise<boolean>
  onOpenWorkflow: (companyName: string) => void
}) {
  const { t, label, activity, formatDateTime } = useI18n()
  const [caption, setCaption] = useState(item.caption ?? '')
  const [hashtags, setHashtags] = useState(item.hashtags ?? '')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([])
  const editable = item.source === 'local' && item.status !== 'Published' && item.status !== 'Cancelled'
  const changed = caption !== (item.caption ?? '') || hashtags !== (item.hashtags ?? '')

  useEffect(() => {
    if (!item.workflowId) return
    const controller = new AbortController()
    listWorkflowEvents(item.workflowId, controller.signal)
      .then((events) => { if (!controller.signal.aborted) setWorkflowEvents(events) })
      .catch(() => { if (!controller.signal.aborted) setWorkflowEvents([]) })
    return () => controller.abort()
  }, [item.workflowId])

  async function save() {
    setSaving(true)
    const ok = await onSave(item.id, caption, hashtags)
    setSaved(ok)
    setSaving(false)
  }

  return (
    <>
      <PanelHeader title={t('Post details')} subtitle={t('Generated record')} />
      <div className="content-detail-heading">
        <div><p className="eyebrow">{item.company} / {label(item.type)}</p><h3>{item.title}</h3></div>
        <StatusPill label={label(item.status)} tone={toneForStatus(item.status)} />
      </div>
      <div className="content-detail-asset">
        {item.mediaUrl
          ? item.type === 'Video'
            ? <video controls poster={item.thumbnailUrl} preload="metadata" src={item.mediaUrl} />
            : <img alt={item.title} loading="lazy" src={item.mediaUrl} />
          : <span>{t('MEDIA ASSET')}</span>}
      </div>
      <div className="content-detail-copy">
        {item.brief && <div><span>{t('Brief')}</span><p>{item.brief}</p></div>}
        {item.idea && <div><span>{t('Approved idea')}</span><p>{item.idea}</p></div>}
      </div>
      <div className="content-detail-fields">
        <label>{t('Caption')}
          <textarea rows={6} value={caption} onChange={(event) => { setCaption(event.target.value); setSaved(false) }} disabled={!editable} placeholder="" />
        </label>
        <label>{t('Hashtags')}
          <input value={hashtags} onChange={(event) => { setHashtags(event.target.value); setSaved(false) }} disabled={!editable} />
        </label>
        {editable && (
          <div className="content-detail-actions">
            <button className="primary-button" type="button" disabled={!changed || saving} onClick={() => { void save() }}>{saving ? t('Saving draft…') : t('Save changes')}</button>
            {saved && <span role="status">{t('Saved')}</span>}
          </div>
        )}
      </div>
      <div className="metadata-grid">
        <span>{t('Model')}</span><strong>{item.model || t('Unknown')}</strong>
        <span>{t('Language')}</span><strong>{item.language ? label(item.language) : t('Unknown')}</strong>
        <span>{t('Schedule')}</span><strong>{item.scheduledFor ? formatDateTime(item.scheduledFor) : t('Not scheduled')}</strong>
        <span>{t('Source')}</span><strong>{t('Platform')}</strong>
      </div>
      {isActiveWorkflow && (
        <button className="secondary-button content-open-workflow" type="button" onClick={() => onOpenWorkflow(item.company)}>
          {t('Open in Create')}
        </button>
      )}
      <section className="activity-panel">
        <PanelHeader title={t('Activity')} />
        {workflowEvents.length ? (
          <ol>{workflowEvents.map((event) => (
            <li key={event.id}>
              <strong>{event.type}</strong>{event.message ? ` — ${event.message}` : ''} · {formatDateTime(event.created_at)}
            </li>
          ))}</ol>
        ) : item.activity?.length ? (
          <ol>{item.activity.map((entry, index) => <li key={`${index}-${entry.code}`}>{activity(entry)}</li>)}</ol>
        ) : <p className="demo-note">{t('No activity recorded yet.')}</p>}
      </section>
    </>
  )
}

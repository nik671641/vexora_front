import { useEffect, useState } from 'react'
import type { Company, ContentItem } from '../../shared/types/product'
import { useI18n } from '../../i18n/context'
import { getCompanyAccounts, type AccountConnection } from '../../api/accounts'
import './Dashboard.css'

const PAGE_SIZE = 8
type ListFilter = 'all' | 'review' | 'queue'
const statusKey = (item: ContentItem) => item.status.toLowerCase().replaceAll('_', ' ')

export function Dashboard({ currentCompany, contentItems, onOpenCreate, onEditPost, onOpenContent, onOpenApprovals }: {
  currentCompany: Company
  contentItems: ContentItem[]
  onOpenCreate: () => void
  onEditPost: (item: ContentItem) => void
  onOpenContent: () => void
  onOpenApprovals: () => void
}) {
  const { language, t, label, contentTime } = useI18n()
  const c = {
    ru: { ready: 'Готово', review: 'На согласовании', scheduled: 'Запланировано', published: 'Опубликовано', errors: 'Ошибки', credits: 'Остаток кредитов', latest: 'Последний контент', all: 'Все', queue: 'В очереди', filters: 'Фильтры', preview: 'Превью', title: 'Название публикации', type: 'Тип', model: 'AI-модель', status: 'Статус', actions: 'Действия', health: 'Состояние компании', description: 'Описание заполнено', audience: 'Аудитория определена', brand: 'Стиль бренда настроен', defaultModel: 'Модель по умолчанию выбрана', connected: 'Соцсети подключены', accounts: 'Подключённые аккаунты', manage: 'Настроить', profile: 'Редактировать профиль', complete: 'готовность', allTime: 'За всё время', noErrors: 'Сбоев нет', needsReview: 'Требуют проверки', balance: 'Доступно для генерации', profileHint: 'Профиль компании задаёт контекст для AI-генерации.', noAccounts: 'Нет подключённых аккаунтов', connect: 'Подключить аккаунт', loading: 'Загрузка подключений…', unavailable: 'Не удалось загрузить подключения', retry: 'Повторить', unknown: 'Не указано', next: 'Далее', previous: 'Назад', empty: 'Публикаций пока нет', emptyHint: 'Создайте первую публикацию для этой компании.', noMatches: 'Ничего не найдено', noMatchesHint: 'Попробуйте изменить фильтры или поисковый запрос.', search: 'Название, подпись или модель', searchLabel: 'Поиск контента', mediaLabel: 'Тип контента', allTypes: 'Все типы', reset: 'Сбросить фильтры', range: 'Показано', of: 'из', records: 'записей', channels: 'каналов', profilePercent: 'Профиль заполнен на', create: 'Создать контент', readyAccount: 'Готов к публикации', pendingAccount: 'Нужна настройка', open: 'Открыть публикацию', edit: 'Редактировать публикацию', content: 'Открыть библиотеку', company: 'Компания', pending: 'Не заполнено', done: 'Готово' },
    en: { ready: 'Ready', review: 'Needs review', scheduled: 'Scheduled', published: 'Published', errors: 'Errors', credits: 'Credits remaining', latest: 'Latest content', all: 'All', queue: 'Queued', filters: 'Filters', preview: 'Preview', title: 'Publication title', type: 'Type', model: 'AI model', status: 'Status', actions: 'Actions', health: 'Company health', description: 'Description completed', audience: 'Audience defined', brand: 'Brand style configured', defaultModel: 'Default model selected', connected: 'Social accounts connected', accounts: 'Connected accounts', manage: 'Manage', profile: 'Edit company profile', complete: 'ready', allTime: 'All time', noErrors: 'No errors', needsReview: 'Awaiting review', balance: 'Available for generation', profileHint: 'The company profile provides context for AI generation.', noAccounts: 'No connected accounts', connect: 'Connect account', loading: 'Loading connections…', unavailable: 'Could not load connections', retry: 'Retry', unknown: 'Not specified', next: 'Next', previous: 'Previous', empty: 'No publications yet', emptyHint: 'Create the first publication for this company.', noMatches: 'No results', noMatchesHint: 'Try another filter or search query.', search: 'Title, caption or model', searchLabel: 'Search content', mediaLabel: 'Content type', allTypes: 'All types', reset: 'Reset filters', range: 'Showing', of: 'of', records: 'records', channels: 'channels', profilePercent: 'Profile readiness', create: 'Create content', readyAccount: 'Ready to publish', pendingAccount: 'Setup required', open: 'Open publication', edit: 'Edit publication', content: 'Open content library', company: 'Company', pending: 'Not completed', done: 'Ready' },
    ro: { ready: 'Gata', review: 'De aprobat', scheduled: 'Programate', published: 'Publicate', errors: 'Erori', credits: 'Credite disponibile', latest: 'Conținut recent', all: 'Toate', queue: 'În coadă', filters: 'Filtre', preview: 'Previzualizare', title: 'Titlul publicației', type: 'Tip', model: 'Model AI', status: 'Stare', actions: 'Acțiuni', health: 'Starea companiei', description: 'Descriere completată', audience: 'Public definit', brand: 'Stil de brand configurat', defaultModel: 'Model implicit selectat', connected: 'Conturi sociale conectate', accounts: 'Conturi conectate', manage: 'Gestionează', profile: 'Editează profilul', complete: 'pregătit', allTime: 'Total', noErrors: 'Fără erori', needsReview: 'Necesită verificare', balance: 'Disponibile pentru generare', profileHint: 'Profilul companiei oferă context pentru generarea AI.', noAccounts: 'Niciun cont conectat', connect: 'Conectează un cont', loading: 'Se încarcă conexiunile…', unavailable: 'Conexiunile nu au putut fi încărcate', retry: 'Reîncearcă', unknown: 'Nespecificat', next: 'Înainte', previous: 'Înapoi', empty: 'Nicio publicație încă', emptyHint: 'Creează prima publicație pentru această companie.', noMatches: 'Niciun rezultat', noMatchesHint: 'Schimbă filtrele sau termenul de căutare.', search: 'Titlu, descriere sau model', searchLabel: 'Caută conținut', mediaLabel: 'Tip de conținut', allTypes: 'Toate tipurile', reset: 'Resetează filtrele', range: 'Se afișează', of: 'din', records: 'înregistrări', channels: 'canale', profilePercent: 'Profil completat', create: 'Creează conținut', readyAccount: 'Gata de publicare', pendingAccount: 'Necesită configurare', open: 'Deschide publicația', edit: 'Editează publicația', content: 'Deschide biblioteca', company: 'Companie', pending: 'Necompletat', done: 'Gata' },
  }[language]
  const [filter, setFilter] = useState<ListFilter>('all')
  const [query, setQuery] = useState('')
  const [media, setMedia] = useState('all')
  const [page, setPage] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [reload, setReload] = useState(0)
  const [connectionState, setConnectionState] = useState<{ companyId?: string; state: 'loaded' | 'unavailable'; items: AccountConnection[] } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const companyId = currentCompany.id
    const request = companyId ? getCompanyAccounts(companyId, controller.signal) : Promise.resolve([])
    request.then((items) => {
      if (!controller.signal.aborted) setConnectionState({ companyId, state: 'loaded', items })
    }).catch(() => {
      if (!controller.signal.aborted) setConnectionState({ companyId, state: 'unavailable', items: [] })
    })
    return () => controller.abort()
  }, [currentCompany.id, reload])

  const accountsLoading = !connectionState || connectionState.companyId !== currentCompany.id
  const accountsError = !accountsLoading && connectionState?.state === 'unavailable'
  const accounts = accountsLoading ? [] : connectionState?.items ?? []
  const items = contentItems.filter((item) => item.company === currentCompany.name)
  const review = items.filter((item) => statusKey(item) === 'draft')
  const scheduled = items.filter((item) => ['scheduled', 'publishing'].includes(statusKey(item)))
  const ready = items.filter((item) => ['approved', 'preview ready'].includes(statusKey(item)))
  const published = items.filter((item) => statusKey(item) === 'published')
  const failed = items.filter((item) => statusKey(item) === 'failed')
  const filtered = items.filter((item) => (filter === 'all' || (filter === 'review' ? statusKey(item) === 'draft' : ['scheduled', 'publishing'].includes(statusKey(item))))
    && (media === 'all' || item.type.toLowerCase() === media)
    && `${item.title} ${item.caption ?? ''} ${item.model ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const activePage = Math.min(page, pages - 1)
  const shown = filtered.slice(activePage * PAGE_SIZE, (activePage + 1) * PAGE_SIZE)
  const readiness = Math.max(0, Math.min(100, currentCompany.readiness || 0))
  const checklist = [
    { name: c.description, done: Boolean(currentCompany.description?.trim()) },
    { name: c.audience, done: Boolean(currentCompany.targetAudience?.trim()) },
    { name: c.brand, done: Boolean(currentCompany.brandStyle?.trim() || currentCompany.visualRules?.trim()) },
    { name: c.defaultModel, done: Boolean(currentCompany.preferredImageModel || currentCompany.preferredVideoModel) },
    { name: c.connected, done: accounts.some((account) => account.publish_readiness === 'ready') },
  ]
  const number = (value: number) => new Intl.NumberFormat({ ru: 'ru-RU', en: 'en-US', ro: 'ro-RO' }[language], { maximumFractionDigits: 2 }).format(value)
  const icon = (name: string) => <span className="material-symbols-outlined" aria-hidden="true">{name}</span>
  const reset = () => { setFilter('all'); setQuery(''); setMedia('all'); setPage(0) }
  const selectFilter = (next: ListFilter) => { setFilter(next); setPage(0) }
  const metrics = [
    { name: c.ready, value: ready.length, tone: 'success', hint: '', action: onOpenContent },
    { name: c.review, value: review.length, tone: 'warning', hint: review.length ? c.needsReview : '', action: onOpenApprovals },
    { name: c.scheduled, value: scheduled.length, tone: 'neutral', hint: '', action: () => { selectFilter('queue') } },
    { name: c.published, value: published.length, tone: 'ink', hint: c.allTime, action: onOpenContent },
    { name: c.errors, value: failed.length, tone: failed.length ? 'error' : 'neutral', hint: failed.length ? '' : c.noErrors, action: onOpenContent },
  ]

  return <div className="dashboard-page vx-dashboard">
    <section className="vx-dash-heading">
      <div><div className="vx-dash-title"><h1>{currentCompany.name || c.company}</h1>{currentCompany.status && <span className="vx-dash-chip">{label(currentCompany.status)}</span>}{currentCompany.id && <span className="vx-dash-id" title={currentCompany.id}>ID: {currentCompany.id.slice(0, 8)}</span>}</div><p>{c.profilePercent} {readiness}%. {accountsLoading ? c.loading : accountsError ? c.unavailable : `${number(accounts.length)} ${c.channels}`}</p></div>
      <div className="vx-dash-actions"><button type="button" className="vx-dash-button" aria-expanded={filtersOpen} aria-controls="vx-dashboard-filters" onClick={() => setFiltersOpen((open) => !open)}>{icon('tune')}{c.filters}</button><button type="button" className="vx-dash-button is-primary" onClick={onOpenCreate}>{icon('add_circle')}{c.create}</button></div>
    </section>

    <section className="vx-dash-metrics" aria-label={t('Dashboard')}>
      {metrics.map((metric) => <button type="button" className="vx-dash-metric" key={metric.name} onClick={metric.action}><span>{metric.name}<i className={`vx-dash-dot ${metric.tone}`} /></span><div><strong>{number(metric.value)}</strong><small>{metric.hint}</small></div></button>)}
      <a className="vx-dash-metric is-credits" href="#/accounts/plan"><span>{c.credits}{icon('bolt')}</span><div><strong>{number(currentCompany.credits ?? 0)}</strong></div><small>{c.balance}</small></a>
    </section>

    <div className="vx-dash-workspace">
      <section className="vx-dash-content" aria-labelledby="vx-dashboard-content-title">
        <div className="vx-dash-content-head"><div><h2 id="vx-dashboard-content-title">{c.latest}</h2><span className="vx-dash-counter">{number(items.length)} {c.records}</span></div><div className="vx-dash-content-tools"><div className="vx-dash-segmented" aria-label={c.filters}>{([{ id: 'all', name: c.all }, { id: 'review', name: `${c.review} (${review.length})` }, { id: 'queue', name: c.queue }] as const).map((tab) => <button key={tab.id} type="button" aria-pressed={filter === tab.id} className={filter === tab.id ? 'is-active' : ''} onClick={() => selectFilter(tab.id)}>{tab.name}</button>)}</div><button className="vx-dash-icon-button" aria-label={c.content} title={c.content} type="button" onClick={onOpenContent}>{icon('open_in_new')}</button></div></div>
        <div id="vx-dashboard-filters" className="vx-dash-filter-row" hidden={!filtersOpen}>
          <label><span>{c.searchLabel}</span><input type="search" placeholder={c.search} value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} /></label>
          <label><span>{c.mediaLabel}</span><select value={media} onChange={(event) => { setMedia(event.target.value); setPage(0) }}><option value="all">{c.allTypes}</option><option value="image">{label('Image')}</option><option value="video">{label('Video')}</option></select></label>
          <button type="button" className="vx-dash-button" onClick={reset}>{c.reset}</button>
        </div>
        <div className="vx-dash-table-scroll"><table className="vx-dash-table"><thead><tr><th>{c.preview}</th><th>{c.title}</th><th>{c.type}</th><th>{c.model}</th><th>{c.status}</th><th><span className="vx-dash-sr-only">{c.actions}</span></th></tr></thead><tbody>
          {shown.map((item) => <tr key={item.id}>
            <td><div className="vx-dash-thumbnail">{item.thumbnailUrl || (item.type !== 'Video' && item.mediaUrl) ? <img alt="" loading="lazy" src={item.thumbnailUrl || item.mediaUrl} /> : icon(item.type === 'Video' ? 'videocam' : 'image')}</div></td>
            <td><button type="button" className="vx-dash-item-title" title={item.title} onClick={() => onEditPost(item)}>{item.title}</button>{contentTime(item) && <small className="vx-dash-item-date">{contentTime(item)}</small>}</td>
            <td><span className="vx-dash-chip">{label(item.type)}</span></td>
            <td><span className="vx-dash-model" title={item.model || c.unknown}>{item.model && <i className="vx-dash-dot neutral" />}{item.model || '—'}</span></td>
            <td><span className={`vx-dash-status status-${statusKey(item).replaceAll(' ', '-')}`}><i className="vx-dash-dot" />{label(item.status)}</span></td>
            <td><button type="button" className="vx-dash-icon-button" aria-label={`${c.edit}: ${item.title}`} title={c.edit} onClick={() => onEditPost(item)}>{icon('edit')}</button></td>
          </tr>)}
        </tbody></table></div>
        {!shown.length && <div className="vx-dash-empty">{icon(items.length ? 'search_off' : 'article')}<strong>{items.length ? c.noMatches : c.empty}</strong><p>{items.length ? c.noMatchesHint : c.emptyHint}</p><button type="button" className="vx-dash-button" onClick={items.length ? reset : onOpenCreate}>{items.length ? c.reset : c.create}</button></div>}
        <div className="vx-dash-pagination"><span>{c.range} {filtered.length ? activePage * PAGE_SIZE + 1 : 0}–{Math.min((activePage + 1) * PAGE_SIZE, filtered.length)} {c.of} {number(filtered.length)}</span><div><button className="vx-dash-button" type="button" disabled={activePage === 0} onClick={() => setPage(activePage - 1)}>{c.previous}</button><span>{activePage + 1} / {pages}</span><button className="vx-dash-button" type="button" disabled={activePage + 1 >= pages} onClick={() => setPage(activePage + 1)}>{c.next}</button></div></div>
      </section>

      <aside className="vx-dash-inspector">
        <section className="vx-dash-health"><div className="vx-dash-panel-heading"><h2>{icon('verified')}{c.health}</h2><span className="vx-dash-readiness-value">{readiness}% {c.complete}</span></div><p>{c.profileHint}</p><div className="vx-dash-progress" role="progressbar" aria-label={c.health} aria-valuemin={0} aria-valuemax={100} aria-valuenow={readiness}><span style={{ width: `${readiness}%` }} /></div><ul>{checklist.map((entry) => <li key={entry.name}><span className={`vx-dash-check${entry.done ? ' is-done' : ''}`}>{entry.done ? icon('check') : ''}</span><span>{entry.name}</span><small>{entry.name === c.connected && accountsLoading ? '…' : entry.done ? c.done : c.pending}</small></li>)}</ul><a href="#/companies" className="vx-dash-profile-link">{c.profile}{icon('arrow_forward')}</a></section>
        <section className="vx-dash-accounts"><div className="vx-dash-panel-heading"><h2>{icon('hub')}{c.accounts}</h2><a href="#/accounts">{c.manage}</a></div>
          {accountsLoading ? <p role="status" className="vx-dash-account-message">{c.loading}</p> : accountsError ? <div className="vx-dash-account-message" role="alert"><p>{c.unavailable}</p><button className="vx-dash-button" type="button" onClick={() => { setConnectionState(null); setReload((value) => value + 1) }}>{c.retry}</button></div> : accounts.length ? <ul>{accounts.map((account) => <li key={account.id}><span className="vx-dash-account-mark">{account.platform.slice(0, 2).toUpperCase()}</span><div><strong>{account.platform}</strong><span title={account.username || account.account_id}>{account.username || account.account_id}</span><small className={account.publish_readiness === 'ready' ? 'is-ready' : ''}><i className={`vx-dash-dot ${account.publish_readiness === 'ready' ? 'success' : 'warning'}`} />{account.publish_readiness === 'ready' ? c.readyAccount : c.pendingAccount}</small>{account.last_error && <small className="vx-dash-account-error">{account.last_error}</small>}</div></li>)}</ul> : <div className="vx-dash-account-message">{icon('link_off')}<p>{c.noAccounts}</p><a href="#/accounts">{c.connect}{icon('arrow_forward')}</a></div>}
        </section>
      </aside>
    </div>
  </div>
}

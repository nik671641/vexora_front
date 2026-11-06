import { useEffect, useState } from 'react'
import type { AiModel, Company } from '../../shared/types/product'
import { useI18n } from '../../i18n/context'
import { listModels } from '../../api/models'
import { createReference, deleteReference, listReferences, type ReferenceDto } from '../../api/references'
import { getCompanyAccounts, listAccountConnections, testPublishReadiness, updateCompanyAccounts, type AccountConnection } from '../../api/accounts'
import { StatusPill } from '../../shared/components/StatusPill'

function useCatalogCopy() {
  const { language, ...i18n } = useI18n()
  return { language, ...i18n, text: (ru: string, en: string, ro: string) => ({ ru, en, ro })[language] }
}
const symbol = (name: string) => <span className="material-symbols-outlined" aria-hidden="true">{name}</span>

export function ModelsCatalog({ currentCompany, onCompanySave }: { currentCompany: Company; onCompanySave?: (company: Company) => Promise<Company> }) {
  const { t, label, text } = useCatalogCopy()
  const [catalog, setCatalog] = useState<AiModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [media, setMedia] = useState('all')
  const [provider, setProvider] = useState('all')
  const [readiness, setReadiness] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    Promise.allSettled([listModels('image', controller.signal), listModels('video', controller.signal)]).then((results) => {
      if (controller.signal.aborted) return
      setCatalog(results.flatMap((result) => result.status === 'fulfilled' ? result.value : []))
      setError(results.some((result) => result.status === 'rejected') ? text('Часть каталога не загружена. Повторите запрос.', 'Some models could not be loaded. Retry the request.', 'Unele modele nu au fost încărcate. Reîncearcă.') : '')
      setLoading(false)
    })
    return () => controller.abort()
  // Fetches are independent of presentation language.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload])
  const providers = [...new Set(catalog.map((model) => model.provider))]
  const visible = catalog.filter((model) => (media === 'all' || model.media === media) && (provider === 'all' || model.provider === provider) && (readiness === 'all' || model.ready === (readiness === 'ready')) && `${model.name} ${model.family} ${model.mode}`.toLowerCase().includes(query.toLowerCase()))
  const selected = visible.find((model) => model.name === selectedName) ?? visible[0]
  const isDefault = selected && (selected.media === 'Image' ? currentCompany.preferredImageModel : currentCompany.preferredVideoModel) === selected.name
  async function makeDefault() {
    if (!selected || !onCompanySave || busy) return
    setBusy(true); setMessage('')
    try {
      await onCompanySave({ ...currentCompany, [selected.media === 'Image' ? 'preferredImageModel' : 'preferredVideoModel']: selected.name })
      setMessage(t('Saved'))
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Request failed') }
    finally { setBusy(false) }
  }
  return <div className="precision-catalog">
    <section className="page-hero"><div><p className="eyebrow">{currentCompany.name}</p><h2>{text('Каталог и параметры AI-моделей', 'AI model catalog and parameters', 'Catalogul și parametrii modelelor AI')}</h2><p>{t('Server-controlled catalog of image and video models. The model is chosen in the create content workflow.')}</p></div><button className="secondary-button" type="button" onClick={() => { setLoading(true); setReload((value) => value + 1) }}>{symbol('refresh')}{t('Check again')}</button></section>
    <div className="precision-summary-strip"><span>{text('Всего моделей', 'Total models', 'Total modele')}: <b>{catalog.length}</b></span><span>{text('Готовы к генерации', 'Ready to generate', 'Gata de generare')}: <b>{catalog.filter((model) => model.ready).length}</b></span><span>{text('Подключаются', 'Not ready', 'Indisponibile')}: <b>{catalog.filter((model) => !model.ready).length}</b></span></div>
    <div className="precision-catalog-filters"><div className="precision-tabs">{['all', 'Image', 'Video'].map((value) => <button key={value} type="button" aria-pressed={media === value} onClick={() => setMedia(value)}>{value === 'all' ? text('Все модели', 'All models', 'Toate modelele') : label(value)}</button>)}</div><label><span>{text('Провайдер', 'Provider', 'Furnizor')}</span><select value={provider} onChange={(event) => setProvider(event.target.value)}><option value="all">{text('Все провайдеры', 'All providers', 'Toți furnizorii')}</option>{providers.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>{t('Status')}</span><select value={readiness} onChange={(event) => setReadiness(event.target.value)}><option value="all">{t('All statuses')}</option><option value="ready">{t('Ready')}</option><option value="pending">{t('Not ready')}</option></select></label><input aria-label={t('Search')} type="search" placeholder={t('Search')} value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    {error && <p className="precision-inline-notice" role="alert">{error}</p>}
    <div className="precision-catalog-split"><section className="precision-catalog-main"><div className="precision-data-scroll"><table className="precision-data-table precision-model-table"><thead><tr><th>{t('Model')}</th><th>{text('Режим / разрешение', 'Mode / resolution', 'Mod / rezoluție')}</th><th>{t('Video Duration')}</th><th>{text('Стоимость', 'Price', 'Cost')}</th><th>{t('Status')}</th></tr></thead><tbody>{visible.map((model) => <tr key={model.name} className={model.name === selected?.name ? 'is-selected' : ''}><td><button className="precision-data-title" type="button" onClick={() => { setSelectedName(model.name); setMessage('') }} aria-pressed={model.name === selected?.name}>{model.family || model.name}{model.version && model.version !== '—' ? ` · ${model.version}` : ''}</button><small>{model.provider}</small></td><td>{model.mode || model.workflow || '—'}<small>{model.resolution || '—'}</small></td><td>{model.min_duration_sec != null ? `${model.min_duration_sec}–${model.max_duration_sec} ${t('sec')}` : '—'}</td><td>{model.price}</td><td><StatusPill label={model.ready ? t('Ready') : t('Not ready')} tone={model.ready ? 'good' : 'warn'} /></td></tr>)}</tbody></table></div>{loading && <p className="content-empty" role="status">{t('Loading…')}</p>}{!loading && !visible.length && <p className="content-empty">{text('Модели не найдены', 'No models found', 'Nu au fost găsite modele')}</p>}<div className="precision-data-count">{t('{count} shown', { count: visible.length })}</div></section><aside className="precision-inspector"><header>{symbol('tune')}<h3>{text('Инспектор параметров', 'Parameter inspector', 'Inspector de parametri')}</h3></header>{selected ? <><h2>{selected.name}</h2><StatusPill label={selected.ready ? t('Ready') : t('Not ready')} tone={selected.ready ? 'good' : 'warn'} /><dl><dt>{text('Провайдер', 'Provider', 'Furnizor')}</dt><dd>{selected.provider}</dd><dt>{t('Media')}</dt><dd>{label(selected.media)}</dd><dt>{text('Семейство / версия', 'Family / version', 'Familie / versiune')}</dt><dd>{selected.family} {selected.version}</dd><dt>{text('Режим', 'Mode', 'Mod')}</dt><dd>{selected.mode || selected.workflow || '—'}</dd><dt>{t('Resolution')}</dt><dd>{selected.resolution || '—'}</dd><dt>{text('Стоимость', 'Price', 'Cost')}</dt><dd>{selected.price}</dd></dl>{selected.workflow === 'image_to_video' && <p className="precision-inline-notice">{t('input photo required')}</p>}<button className="primary-button" type="button" disabled={!selected.ready || !onCompanySave || !currentCompany.id || currentCompany.role === 'viewer' || busy || isDefault} onClick={() => { void makeDefault() }}>{isDefault ? text('Модель по умолчанию', 'Default model', 'Model implicit') : busy ? t('Saving…') : text('Сделать моделью по умолчанию', 'Set as default model', 'Setează ca model implicit')}</button><a href="#/create" className="secondary-button">{t('Open Create')}</a>{message && <p role="status">{message}</p>}</> : <p>{t('Loading…')}</p>}</aside></div>
  </div>
}

export function ReferencesView({ currentCompany }: { currentCompany: Company }) {
  const { t, text, formatDateTime, label } = useCatalogCopy()
  const [items, setItems] = useState<ReferenceDto[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')
  const [selectedId, setSelectedId] = useState('')
  const [deleteArmed, setDeleteArmed] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    listReferences(controller.signal).then((result) => { if (!controller.signal.aborted) { setItems(result); setError(''); setLoading(false) } }).catch((cause: unknown) => { if (!controller.signal.aborted) { setError(cause instanceof Error ? cause.message : 'Request failed'); setLoading(false) } })
    return () => controller.abort()
  }, [reload])
  const visible = items.filter((item) => (kind === 'all' || item.kind === kind) && `${item.caption} ${item.original_file_name} ${item.summary}`.toLowerCase().includes(query.toLowerCase()))
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0]
  async function upload(file: File) {
    if (!currentCompany.id || busy) return
    setBusy(true); setError('')
    const data = new FormData(); data.append('file', file); data.append('company_id', currentCompany.id); data.append('caption', file.name)
    try { const result = await createReference(data); setSelectedId(result.id); setReload((value) => value + 1) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Request failed') }
    finally { setBusy(false) }
  }
  async function remove() {
    if (!selected || busy) return
    setBusy(true); setError('')
    try { await deleteReference(selected.id); setItems((current) => current.filter((item) => item.id !== selected.id)); setDeleteArmed(false) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Request failed') }
    finally { setBusy(false) }
  }
  const size = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
  return <div className="precision-catalog"><section className="page-hero"><div><p className="eyebrow">{currentCompany.name}</p><h2>{text('Референсы и медиатека', 'References and media library', 'Referințe și bibliotecă media')}</h2><p>{t('Upload real jobsite assets that ground image and video generation.')}</p></div><label className="primary-button">{symbol('upload')}{busy ? t('Processing') : t('Upload reference')}<input type="file" className="visually-hidden" disabled={busy || !currentCompany.id || currentCompany.role === 'viewer'} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file) }} /></label></section><div className="precision-summary-strip"><span>{text('Всего материалов', 'Total files', 'Total fișiere')}: <b>{items.length}</b></span><span>{label('Image')}: <b>{items.filter((item) => item.kind === 'photo').length}</b></span><span>{text('Общий размер', 'Total size', 'Dimensiune totală')}: <b>{size(items.reduce((sum, item) => sum + item.size_bytes, 0))}</b></span></div><div className="precision-catalog-filters"><div className="precision-tabs">{['all', 'photo', 'file', 'voice'].map((value) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)}>{value === 'all' ? text('Все файлы', 'All files', 'Toate fișierele') : label(value)}</button>)}</div><input aria-label={t('Search')} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search')} /></div>{error && <p className="precision-inline-notice" role="alert">{error}<button type="button" className="ghost-button" onClick={() => setReload((value) => value + 1)}>{t('Check again')}</button></p>}<div className="precision-catalog-split"><section className="precision-catalog-main"><div className="precision-data-scroll"><table className="precision-data-table precision-files-table"><thead><tr><th>{t('Preview')}</th><th>{t('Name')}</th><th>{t('Media')}</th><th>{text('Размер', 'Size', 'Dimensiune')}</th><th>{text('Загружено', 'Uploaded', 'Încărcat')}</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id} className={item.id === selected?.id ? 'is-selected' : ''}><td><span className="precision-thumb">{symbol(item.kind === 'photo' ? 'image' : item.kind === 'voice' ? 'mic' : 'description')}</span></td><td><button type="button" className="precision-data-title" aria-pressed={item.id === selected?.id} onClick={() => { setSelectedId(item.id); setDeleteArmed(false) }}>{item.caption || item.original_file_name}</button><small>{item.original_file_name}</small></td><td>{item.mime_type || label(item.kind)}</td><td>{size(item.size_bytes)}</td><td><small>{formatDateTime(item.created_at)}</small></td></tr>)}</tbody></table></div>{loading && <p className="content-empty" role="status">{t('Loading…')}</p>}{!loading && !visible.length && <p className="content-empty">{t('No references yet.')}</p>}<div className="precision-data-count">{t('{count} shown', { count: visible.length })}</div></section><aside className="precision-inspector"><header>{symbol('description')}<h3>{text('Инспектор референса', 'Reference inspector', 'Inspector de referință')}</h3></header>{selected ? <><div className="precision-file-preview">{symbol(selected.kind === 'photo' ? 'image' : selected.kind === 'voice' ? 'mic' : 'description')}<span>{selected.mime_type || selected.kind}</span></div><h2>{selected.caption || selected.original_file_name}</h2><dl><dt>{t('Name')}</dt><dd>{selected.original_file_name}</dd><dt>{text('Размер', 'Size', 'Dimensiune')}</dt><dd>{size(selected.size_bytes)}</dd><dt>{text('Загружено', 'Uploaded', 'Încărcat')}</dt><dd>{formatDateTime(selected.created_at)}</dd><dt>SHA-256</dt><dd>{selected.checksum || '—'}</dd></dl>{selected.summary && <p>{selected.summary}</p>}{selected.text_excerpt && <pre>{selected.text_excerpt}</pre>}<a href="#/create" className="secondary-button">{t('Open Create')}</a>{deleteArmed ? <div className="precision-inline-notice"><p>{text('Удалить этот референс?', 'Delete this reference?', 'Ștergi această referință?')}</p><button type="button" className="danger-button" disabled={busy} onClick={() => { void remove() }}>{t('Delete')}</button><button type="button" className="ghost-button" onClick={() => setDeleteArmed(false)}>{t('Cancel')}</button></div> : <button type="button" className="danger-button" disabled={busy || currentCompany.role === 'viewer'} onClick={() => setDeleteArmed(true)}>{t('Delete')}</button>}</> : <p>{t('No references yet.')}</p>}</aside></div></div>
}

export function AccountsView({ currentCompany }: { currentCompany: Company }) {
  const { t, text } = useCatalogCopy()
  const [data, setData] = useState<{ companyId: string; available: AccountConnection[]; selected: string[]; ready: boolean; errors: string[] } | null>(null)
  const [inspecting, setInspecting] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!currentCompany.id) return
    const controller = new AbortController()
    Promise.all([listAccountConnections(controller.signal), getCompanyAccounts(currentCompany.id, controller.signal), testPublishReadiness(currentCompany.id)])
      .then(([available, selected, status]) => { if (!controller.signal.aborted) { setData({ companyId: currentCompany.id!, available, selected: selected.map((item) => item.id), ready: status.ready, errors: status.errors }); setError('') } })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Request failed') })
    return () => controller.abort()
  }, [currentCompany.id, reload])
  const active = data?.companyId === currentCompany.id ? data : null
  const visible = active?.available.filter((account) => `${account.username} ${account.platform} ${account.provider}`.toLowerCase().includes(query.toLowerCase())) ?? []
  const selected = visible.find((account) => account.id === inspecting) ?? visible[0]
  const readOnly = currentCompany.role === 'viewer'
  async function save() {
    if (!currentCompany.id || !active || busy || readOnly) return
    setBusy(true); setError(''); setMessage('')
    try { await updateCompanyAccounts(currentCompany.id, { account_ids: active.selected }); setMessage(t('Saved')); setReload((value) => value + 1) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Request failed') }
    finally { setBusy(false) }
  }
  return <div className="precision-catalog"><section className="page-hero"><div><p className="eyebrow">{currentCompany.name}</p><h2>{t('Connected publishing accounts')}</h2><p>{t('Choose the provider accounts that this company may publish to.')}</p></div><button type="button" className="secondary-button" onClick={() => setReload((value) => value + 1)}>{symbol('refresh')}{t('Check again')}</button></section><div className="precision-summary-strip"><span>{text('Всего подключений', 'Total connections', 'Total conexiuni')}: <b>{active?.available.length ?? '—'}</b></span><span>{text('Назначено компании', 'Assigned to company', 'Atribuite companiei')}: <b>{active?.selected.length ?? '—'}</b></span><StatusPill label={active?.ready ? t('Ready to publish') : t('Not ready to publish')} tone={active?.ready ? 'good' : 'warn'} /></div><div className="precision-catalog-filters"><input type="search" aria-label={t('Search')} placeholder={t('Search')} value={query} onChange={(event) => setQuery(event.target.value)} /><button type="button" className="primary-button" disabled={!active || busy || readOnly} onClick={() => { void save() }}>{busy ? t('Processing') : t('Save connections')}</button>{message && <span role="status">{message}</span>}</div>{error && <p className="precision-inline-notice" role="alert">{error}</p>}{active?.errors.length ? <ul className="precision-inline-notice">{active.errors.map((entry) => <li key={entry}>{entry}</li>)}</ul> : null}<div className="precision-catalog-split"><section className="precision-catalog-main"><div className="precision-data-scroll"><table className="precision-data-table precision-accounts-table"><thead><tr><th>{text('Доступ', 'Access', 'Acces')}</th><th>{text('Аккаунт / канал', 'Account / channel', 'Cont / canal')}</th><th>{text('Платформа', 'Platform', 'Platformă')}</th><th>{text('Провайдер', 'Provider', 'Furnizor')}</th><th>{t('Status')}</th></tr></thead><tbody>{visible.map((account) => <tr key={account.id} className={selected?.id === account.id ? 'is-selected' : ''}><td><input type="checkbox" disabled={busy || readOnly} aria-label={`${account.platform}: ${account.username || account.account_id}`} checked={active!.selected.includes(account.id)} onChange={() => setData((current) => current ? { ...current, selected: current.selected.includes(account.id) ? current.selected.filter((id) => id !== account.id) : [...current.selected, account.id] } : current)} /></td><td><button type="button" className="precision-data-title" onClick={() => setInspecting(account.id)}>{account.username || account.account_id}</button><small>{account.account_id}</small></td><td>{account.platform}</td><td>{account.provider}</td><td><StatusPill label={account.status} tone={account.publish_readiness === 'ready' ? 'good' : 'warn'} /></td></tr>)}</tbody></table></div>{!active && !error && <p className="content-empty">{currentCompany.id ? t('Loading…') : t('No companies yet')}</p>}{active && !visible.length && <p className="content-empty">{t('No provider connections are available.')}</p>}</section><aside className="precision-inspector"><header>{symbol('hub')}<h3>{text('Параметры подключения', 'Connection details', 'Detalii conexiune')}</h3></header>{selected ? <><h2>{selected.platform}</h2><p>{selected.username || selected.account_id}</p><dl><dt>{text('Провайдер', 'Provider', 'Furnizor')}</dt><dd>{selected.provider}</dd><dt>{text('Аккаунт', 'Account', 'Cont')}</dt><dd>{selected.account_id}</dd><dt>{t('Status')}</dt><dd>{selected.status}</dd><dt>{text('Публикация', 'Publishing', 'Publicare')}</dt><dd>{selected.publish_readiness}</dd><dt>{t('Company')}</dt><dd>{currentCompany.name}</dd></dl>{selected.last_error && <p role="alert" className="precision-inline-notice">{selected.last_error}</p>}<p>{t('Publishing remains approval-first.')}</p></> : <p>{t('No provider connections are available.')}</p>}</aside></div></div>
}

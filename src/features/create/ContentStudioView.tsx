import { cloneElement, Fragment, isValidElement, useId, useState, type ReactNode, type ReactElement } from 'react'
import type { AiModel, Company } from '../../shared/types/product'
import type { CreateSession, AspectRatio } from './createSession'
import './ContentStudioView.css'
import { ModelPicker, TilePicker } from './StudioPickers'

type Props = {
  company: Company
  companies: Company[]
  onCompanyChange: (companyId: string) => void
  session: CreateSession
  models: AiModel[]
  modelId: string
  autosaveLabel: string
  autosaveStatus: string
  manualSaveState: 'idle' | 'saving' | 'saved'
  estimatedCredits: number | null
  error: string | null
  generationPhase: 'queued' | 'running' | 'retrying' | 'reconnecting'
  onCheckStatus: () => void
  canGenerate: boolean
  previewReady: boolean
  accountReady: boolean
  readinessErrors: string[]
  invalidSchedule: boolean
  onUpdate: (patch: Partial<CreateSession>) => void
  onModelChange: (name: string) => void
  onTogglePlatform: (name: string) => void
  onFiles: (files: FileList | null) => void
  onGenerate: () => void
  onApprove: () => void
  onRegenerate: () => void
  onCancel: () => void
  onSave: () => void
  onSchedule: () => void
  onPublish: () => void
  onReset: () => void
  onReadinessCheck: () => void
}

const channels = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok']
const goals = [
  ['Educational content', 'Экспертный контент'],
  ['Promotional offer / Lead generation', 'Продвижение услуги'],
  ['Brand awareness', 'Узнаваемость бренда'],
  ['Community engagement', 'Вовлечение аудитории'],
  ['Product launch', 'Запуск продукта'],
]
function Icon({ children }: { children: string }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{children}</span>
}
function Field({ title, children, counter }: { title: string; children: ReactNode; counter?: string }) {
  const id = useId()
  const isControl = isValidElement(children) && typeof children.type === 'string' && ['input', 'select', 'textarea'].includes(children.type)
  return <div className="cs-field">{isControl ? <label className="cs-field-label" htmlFor={id}>{title}{counter && <small>{counter}</small>}</label> : <span className="cs-field-label">{title}{counter && <small>{counter}</small>}</span>}{isControl ? cloneElement(children as ReactElement<{ id?: string }>, { id }) : children}</div>
}
function SectionHead({ number, title, children }: { number: string; title: string; children?: ReactNode }) {
  return <header className="cs-section-head"><div><span className="cs-mono">{number}</span><h2>{title}</h2></div>{children}</header>
}

export function ContentStudioView(p: Props) {
  const { session: s, onUpdate: update } = p
  const [channel, setChannel] = useState('')
  const [tag, setTag] = useState('')
  const [addingTag, setAddingTag] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const busy = ['researching', 'generating', 'publishing'].includes(s.state)
  const locked = s.state !== 'draft'
  const published = ['published', 'publishing', 'scheduled'].includes(s.state)
  const activeStep = p.previewReady ? 3 : ['idea_ready', 'researching', 'generating'].includes(s.state) ? 2 : s.objective && s.brief ? 1 : 0
  const selectedChannel = s.platforms.includes(channel) ? channel : s.platforms[0] || 'Instagram'
  const model = p.models.find((item) => item.name === p.modelId)
  const durations = model?.generation_options?.durations ?? (
    model?.min_duration_sec && model?.max_duration_sec
      ? Array.from({ length: Math.min(240, model.max_duration_sec) - model.min_duration_sec + 1 }, (_, index) => model.min_duration_sec! + index)
      : []
  )
  const resolutions = model?.generation_options?.resolutions ?? []
  const ratioOptions = [
    { value: '16:9', label: '16:9', hint: 'Горизонтальный', ratio: '16:9' },
    { value: '1:1', label: '1:1', hint: 'Квадрат', ratio: '1:1' },
    { value: '4:5', label: '4:5', hint: 'Вертикальный', ratio: '4:5' },
    { value: '9:16', label: '9:16', hint: 'Стори / Reel', ratio: '9:16' },
  ].filter((item) => !model?.generation_options?.aspect_ratios?.length || model.generation_options.aspect_ratios.includes(item.value))
  const tags = [...new Set(s.hashtags.split(/\s+/).filter(Boolean))]
  const headline = s.hook || s.ideaHook || s.ideaTitle
  const copy = s.caption || s.ideaSummary
  const scheduledDate = s.scheduledFor.slice(0, 10)
  const scheduledTime = s.scheduledFor.slice(11, 16)
  function addTag() {
    const value = tag.trim().replace(/^#/, '').replace(/\s+/g, '')
    if (value) update({ hashtags: [...new Set([...tags, '#' + value])].join(' ') })
    setTag('')
    setAddingTag(false)
  }
  function scrollTo(index: number) {
    document.getElementById(['cs-context', 'cs-model', 'cs-copy', 'cs-preview'][index])?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <div className="cs-page">
      <div className="cs-workflow">
        <nav aria-label="Этапы создания контента">
          {['Цель и контекст', 'Формат и модель', 'Идея и текст', 'Предпросмотр и публикация'].map((title, index) => (
            <Fragment key={title}>
              {index > 0 && <span className="cs-step-arrow">→</span>}
              <button type="button" className={'cs-step ' + (index === activeStep ? 'is-active' : index < activeStep ? 'is-complete' : '')} aria-current={index === activeStep ? 'step' : undefined} onClick={() => scrollTo(index)}>
                <span>{index + 1}</span>{title}
              </button>
            </Fragment>
          ))}
        </nav>
        <div className="cs-save-status"><span data-error={p.autosaveStatus === 'error'}><i />{p.autosaveLabel}</span><code>ID: {s.workflowId ? s.workflowId.slice(0, 11).toUpperCase() : 'НОВЫЙ'}</code></div>
      </div>
      <div className="cs-split">
        <div className="cs-editor">
          {p.error && <div className="cs-error" role="alert">{p.error}</div>}
          <section id="cs-context">
            <SectionHead number="01" title="Цель и контекст"><span className="cs-tag">Конфигурация брифа</span></SectionHead>
            <div className="cs-grid-two">
              <Field title="Компания / Эмитент"><TilePicker title="Компания / Эмитент" value={p.company.id ?? p.company.name} options={p.companies.map((company) => ({ value: company.id ?? company.name, label: company.name, hint: company.id === p.company.id ? 'Активная компания' : 'Переключить контекст' }))} disabled={busy} onChange={p.onCompanyChange} /></Field>
              <Field title="Стратегическая цель"><TilePicker title="Стратегическая цель" value={s.objective} options={goals.map(([value, label]) => ({ value, label, hint: 'Цель публикации' }))} disabled={locked} onChange={(value) => update({ objective: value })} /></Field>
            </div>
            <div className="cs-context-fields">
              <Field title="Краткий бриф задачи"><textarea rows={2} value={s.brief} disabled={locked} onChange={(e) => update({ brief: e.target.value })} placeholder="Опишите тему, задачу и основные тезисы публикации" /></Field>
              <div className="cs-grid-two cs-context-meta">
                <Field title="Язык публикации"><select value={s.language} disabled={locked} onChange={(e) => update({ language: e.target.value })}><option value="Russian">Русский (RU)</option><option value="English">English (EN)</option><option value="Romanian">Română (RO)</option></select></Field>
                <Field title="Целевые каналы дистрибуции"><div className="cs-channel-chips">{[...new Set([...channels, ...s.platforms])].map((name) => <button key={name} type="button" disabled={locked} aria-pressed={s.platforms.includes(name)} onClick={() => p.onTogglePlatform(name)}><Icon>{name === 'Telegram' ? 'send' : 'share'}</Icon>{name}</button>)}</div></Field>
              </div>
              <div className="cs-field"><div className="cs-field-label">Прикрепленные материалы и референсы ({s.referenceNames.length})</div><div className="cs-references">
                {s.referenceNames.map((name) => <div className="cs-reference" key={name}><Icon>{/\.pdf$/i.test(name) ? 'picture_as_pdf' : 'image'}</Icon><div><p title={name}>{name}</p><small>Прикреплён</small></div></div>)}
                <label className="cs-reference cs-upload"><Icon>add</Icon><span>Добавить материал</span><input type="file" multiple disabled={locked} accept="image/*,.md,.txt,.docx,.pptx,.csv,.pdf,audio/*" onChange={(e) => { p.onFiles(e.target.files); e.target.value = '' }} /></label>
              </div></div>
            </div>
          </section>
          <section id="cs-model">
            <SectionHead number="02" title="Формат и модель"><span className="cs-tag"><i />{p.estimatedCredits == null ? 'Стоимость уточняется' : 'от ' + p.estimatedCredits + ' кредитов / генерация'}</span></SectionHead>
            <div className="cs-grid-three">
              <Field title="Тип контента"><TilePicker title="Тип контента" value={s.mediaType} options={[{ value: 'Image', label: 'Изображение', hint: 'Статичный визуал' }, { value: 'Video', label: 'Видео', hint: 'Динамический ролик' }]} disabled={locked} onChange={(value) => update({ mediaType: value as 'Image' | 'Video', modelId: '', durationSec: null, videoResolution: '', aspectRatio: value === 'Video' ? '9:16' : s.aspectRatio })} /></Field>
              <Field title="Семейство модели"><ModelPicker models={p.models} value={p.modelId} disabled={locked} onChange={p.onModelChange} /></Field>
              <Field title="Формат холста"><TilePicker title="Формат холста" options={ratioOptions} value={s.aspectRatio} disabled={locked} onChange={(value) => update({ aspectRatio: value as AspectRatio })} /></Field>
            </div>
            {s.mediaType === 'Video' && <div className="cs-grid-two cs-video-options">
              <Field title="Длительность видео"><TilePicker title="Длительность видео" value={String(durations.includes(s.durationSec ?? -1) ? s.durationSec : durations[0] ?? '')} options={durations.map((seconds) => ({ value: String(seconds), label: seconds + ' сек.' }))} disabled={locked} onChange={(value) => update({ durationSec: Number(value) })} />{!durations.length && <small>У модели нет фиксированного диапазона длительности.</small>}</Field>
              <Field title="Качество видео"><TilePicker title="Качество видео" value={resolutions.includes(s.videoResolution) ? s.videoResolution : ''} options={[{ value: '', label: 'Авто', hint: model?.resolution || 'Настройки модели' }, ...resolutions.map((value) => ({ value, label: value === '4k' ? '4K' : value, hint: value === '480p' ? 'Быстрый черновик' : value === '720p' ? 'HD' : value === '1080p' ? 'Full HD' : 'Ultra HD' }))]} disabled={locked} onChange={(value) => update({ videoResolution: value })} /><small>{resolutions.length ? 'Стоимость зависит от разрешения и длительности.' : 'Эта модель определяет разрешение автоматически.'}</small></Field>
            </div>}
            <div className="cs-advanced">
              <button type="button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen(!advancedOpen)}><span><Icon>tune</Icon>Расширенные параметры (Seed, CFG Scale, Negative Prompt)</span><Icon>{advancedOpen ? 'expand_less' : 'expand_more'}</Icon></button>
              {advancedOpen && <div className="cs-grid-three"><Field title="Seed"><input value={s.seed} disabled={locked} onChange={(e) => update({ seed: e.target.value })} /></Field><Field title="CFG Guidance"><input value={s.cfgGuidance} disabled={locked} onChange={(e) => update({ cfgGuidance: e.target.value })} /></Field><Field title="Negative Filter"><input value={s.negativePrompt} disabled={locked} onChange={(e) => update({ negativePrompt: e.target.value })} /></Field></div>}
            </div>
          </section>
          <section id="cs-copy">
            <SectionHead number="03" title="Идея и текст"><div className="cs-copy-actions"><button type="button" disabled={!p.canGenerate || busy || locked} onClick={p.onGenerate}><Icon>auto_awesome</Icon>Сгенерировать идею</button><button type="button" disabled={busy || !s.workflowId || !['idea_ready', 'preview_ready'].includes(s.state)} onClick={p.onRegenerate}>Переписать</button><button type="button" disabled title="Отдельное сокращение текста пока не подключено">Сократить</button><button type="button" disabled title="Отдельная смена тона пока не подключена">Изменить тон</button></div></SectionHead>
            {busy && <div className="cs-notice cs-generation-notice" role="status"><div className="cs-generation-visual" aria-hidden="true"><span /><span /><span /><Icon>auto_awesome</Icon></div><div className="cs-generation-copy"><strong>{p.generationPhase === 'queued' ? 'Задача в очереди — ожидаем обработчик' : p.generationPhase === 'retrying' ? 'Повторная попытка после ошибки провайдера' : p.generationPhase === 'reconnecting' ? 'Восстанавливаем соединение с сервером' : s.state === 'researching' ? 'AI готовит идею и текст…' : 'Готовим публикацию…'}</strong><p>{p.generationPhase === 'queued' ? 'Генерация ещё не началась. Статус обновляется автоматически; повторно отправлять запрос не нужно.' : p.generationPhase === 'reconnecting' ? 'Задача остаётся на сервере. Продолжим получать статус, когда связь восстановится.' : 'Можно закрыть страницу и вернуться: результат сохранится в этом материале.'}</p><div className="cs-generation-progress"><i /><i /><i /></div></div><div className="cs-generation-actions"><button type="button" onClick={p.onCheckStatus}>Проверить статус</button><button type="button" onClick={p.onCancel}>Отменить</button></div></div>}
            <Field title="Hook / Заголовок материала" counter={headline.length + ' символов'}><input className="cs-headline" value={headline} disabled={published || busy} placeholder="Заголовок публикации" onChange={(e) => update({ hook: e.target.value, ideaHook: e.target.value })} /></Field>
            <Field title="Текст публикации для соцсети" counter={copy.length + ' знаков (' + Math.max(1, Math.ceil(copy.length / 1000)) + ' мин чтения)'}><div className="cs-publication-copy"><textarea rows={5} value={copy} disabled={published || busy} aria-label="Текст публикации для соцсети" placeholder="Здесь появится текст, который будет опубликован вместе с медиа" onChange={(e) => update({ caption: e.target.value, ideaSummary: e.target.value })} /><small><Icon>info</Icon>Этот текст будет показан под изображением или видео в выбранной социальной сети.</small></div></Field>
            <div className="cs-field"><span className="cs-field-label">Теги и ключевые мета-индексы</span><div className="cs-tags">{tags.map((value) => <span key={value}>{value}<button type="button" aria-label={'Удалить ' + value} disabled={published} onClick={() => update({ hashtags: tags.filter((item) => item !== value).join(' ') })}>×</button></span>)}{addingTag ? <form onSubmit={(e) => { e.preventDefault(); addTag() }}><input autoFocus aria-label="Новый тег" value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setAddingTag(false) }} /><button type="submit">Добавить</button></form> : <button type="button" disabled={published} onClick={() => setAddingTag(true)}><Icon>add</Icon>Добавить тег</button>}</div></div>
            {s.state === 'idea_ready' && <div className="cs-idea-review"><Field title="Сцена / визуальный промпт"><textarea className="cs-scene-input" rows={4} value={s.ideaScene} onChange={(e) => update({ ideaScene: e.target.value })} /></Field><button className="cs-primary" type="button" onClick={p.onApprove}><Icon>check</Icon>Согласовать идею и создать медиа</button><button type="button" onClick={p.onCancel}>Отменить</button></div>}
            {['failed', 'cancelled'].includes(s.state) && <button type="button" onClick={p.onReset}>Начать новый материал</button>}
          </section>
        </div>
        <aside className="cs-preview" id="cs-preview" aria-label="Предпросмотр публикации">
          <div className="cs-preview-toolbar"><div><span>Канал превью:</span><div className="cs-segment">{(s.platforms.length ? s.platforms : ['Instagram']).map((name) => <button key={name} type="button" aria-pressed={selectedChannel === name} onClick={() => setChannel(name)}><Icon>{name === 'Telegram' ? 'send' : 'share'}</Icon>{name}</button>)}</div></div><span className="cs-live"><i />Live Sync</span></div>
          <div className="cs-preview-scroll">
            <article className="cs-post">
              <header><div className="cs-post-avatar">{p.company.name.slice(0, 2).toUpperCase()}</div><div><h4>{p.company.name}</h4><p>{selectedChannel} · Предпросмотр</p></div><Icon>more_horiz</Icon></header>
              <div className="cs-post-media">{s.mediaUrl ? s.generatedMediaType === 'video' ? <video src={s.mediaUrl} controls playsInline /> : <img src={s.mediaUrl} alt="Предпросмотр публикации" /> : <div className="cs-empty"><Icon>image</Icon><span>{busy ? 'Создаём медиа…' : 'Предпросмотр появится после генерации'}</span></div>}<span className="cs-media-badge">{p.modelId || 'Модель не выбрана'} · {s.aspectRatio}</span></div>
              <div className="cs-post-body"><h3>{headline || 'Заголовок публикации'}</h3><p>{copy || 'Добавьте бриф и сгенерируйте идею — здесь появится ваша публикация.'}</p><div>{tags.join(' ')}</div></div>
              <footer><span><Icon>visibility</Icon>0</span><span><Icon>thumb_up</Icon>0</span><span>{scheduledTime || '—:—'}</span></footer>
            </article>
            <section className="cs-scheduling"><header><h3>Параметры публикации</h3><Icon>schedule</Icon></header><div className="cs-grid-two"><Field title="Дата выхода"><input type="date" value={scheduledDate} disabled={published} onChange={(e) => update({ scheduledFor: e.target.value ? e.target.value + 'T' + (scheduledTime || '12:00') : '' })} /></Field><Field title={'Время (' + Intl.DateTimeFormat().resolvedOptions().timeZone + ')'}><input type="time" value={scheduledTime} disabled={published} onChange={(e) => update({ scheduledFor: (scheduledDate || new Date().toLocaleDateString('en-CA')) + 'T' + e.target.value })} /></Field></div>
              <div className="cs-readiness-channels">{s.platforms.map((name) => <label key={name}><span><i />{name}</span><input type="checkbox" checked disabled /></label>)}</div>
              {p.invalidSchedule && <p className="cs-error" role="alert">Выберите дату и время в будущем.</p>}
              {p.previewReady && !p.accountReady && <div className="cs-readiness"><p>Для публикации подключите аккаунты компании.</p>{p.readinessErrors.map((error) => <p key={error}>{error}</p>)}<button type="button" onClick={p.onReadinessCheck}>Проверить подключение</button></div>}
            </section>
          </div>
          <div className="cs-publication-dock"><div><button type="button" disabled={published || busy || p.manualSaveState === 'saving'} onClick={p.onSave}>{p.manualSaveState === 'saving' ? 'Сохраняем…' : p.manualSaveState === 'saved' ? 'Черновик сохранён' : 'Сохранить в черновик'}</button><button type="button" disabled={busy || !['idea_ready', 'preview_ready'].includes(s.state)} onClick={p.onRegenerate}>Перегенерировать</button><button type="button" disabled={s.state !== 'idea_ready'} onClick={p.onApprove}>Согласовать</button></div><button className="cs-primary" type="button" disabled={!p.previewReady || !p.accountReady || published} onClick={p.onSchedule}><Icon>event_available</Icon>{s.state === 'scheduled' ? 'Публикация запланирована' : 'Запланировать публикацию'}</button></div>
        </aside>
      </div>
    </div>
  )
}

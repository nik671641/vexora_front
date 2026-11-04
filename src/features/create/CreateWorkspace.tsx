import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { ActivityCode, AiModel, Company } from '../../shared/types/product'
import { StatusPill } from '../../shared/components/StatusPill'
import { useI18n, outputLanguageForInterface, type Translate } from '../../i18n/context'
import type { TranslationKey } from '../../i18n/translations'
import {
  appendActivity, briefForBackend, captionFromIdea, createInitialSession,
  hashtagsFromIdea, languageFromLabel, mediaTypeToValue, type AspectRatio, type CreateSession,
} from './createSession'
import {
  approveWorkflow, attachReference, cancelWorkflow, createWorkflow,
  editWorkflow, generateIdea as generateIdeaApi, getWorkflow, publishWorkflow, regenerateWorkflow, scheduleWorkflow,
} from '../../api/workflows'
import type { Workflow } from '../../api/workflows'
import { listModels } from '../../api/models'
import { createReference } from '../../api/references'
import { testPublishReadiness } from '../../api/accounts'
import { ApiError } from '../../api/errors'
import './CreateWorkspace.css'

type SessionUpdate = (current: CreateSession) => CreateSession

export type AutosaveStatus = {
  state: 'idle' | 'saving' | 'saved' | 'error'
  savedAt?: string
  message?: string
}

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

const LOCALES: Record<string, string> = { en: 'en-US', ru: 'ru-RU', ro: 'ro-RO' }

const pipeline = [
  { key: 'objective', steps: ['draft', 'cancelled', 'awaiting_company', 'awaiting_company_confirmation'], label: 'Objective & Format' },
  { key: 'concept', steps: ['researching', 'idea_ready'], label: 'AI Concept & Copy' },
  { key: 'media', steps: ['generating'], label: 'Media Model & Prompt' },
  { key: 'publish', steps: ['preview_ready', 'publishing', 'scheduled', 'published'], label: 'Preview & Publish' },
]

function stepIndexForState(state: CreateSession['state'] | 'failed'): number {
  if (state === 'draft' || state === 'cancelled' || state === 'awaiting_company' || state === 'awaiting_company_confirmation') return 0
  if (state === 'researching' || state === 'idea_ready') return 1
  if (state === 'generating') return 2
  return 3 // preview_ready, publishing, scheduled, published, failed
}

const OBJECTIVES = [
  'Promotional offer / Lead generation',
  'Brand awareness',
  'Community engagement',
  'Educational content',
  'Product launch',
]

const PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok']

const RATIOS: { value: AspectRatio; label: string; shapeClass: string }[] = [
  { value: '1:1', label: '1:1 Square', shapeClass: 'w-3.5 h-3.5 border border-outline-variant rounded-sm' },
  { value: '9:16', label: '9:16 Story/Reel', shapeClass: 'w-2.5 h-4 border rounded-xs' },
  { value: '16:9', label: '16:9 Landscape', shapeClass: 'w-4 h-2.5 border rounded-xs' },
  { value: '4:5', label: '4:5 Portrait', shapeClass: 'w-3 h-3.5 border rounded-xs' },
]

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Compact month-grid date picker + time input for the dispatch card. */
function SchedulePicker({
  value,
  onChange,
  invalid,
  errorMessage,
  t,
  language,
}: {
  value: string
  onChange: (iso: string) => void
  invalid: boolean
  errorMessage: string
  t: Translate
  language: string
}) {
  const locale = LOCALES[language] ?? 'en-US'
  const now = new Date()
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(value ? value.slice(0, 10) : localDateKey(now))
  const [time, setTime] = useState<string>(value ? value.slice(11, 16) : '12:00')
  const [open, setOpen] = useState(false)

  const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2024, 0, 1 + i) // Mon..Sun
    return dayFormatter.format(date)
  })

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const result: (null | { year: number; month: number; day: number })[] = []
    for (let i = 0; i < offset; i++) result.push(null)
    for (let day = 1; day <= daysInMonth; day++) result.push({ year: cursor.getFullYear(), month: cursor.getMonth(), day })
    while (result.length % 7 !== 0) result.push(null)
    return result
  }, [cursor])

  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(cursor)
  const visibleMonth = language === 'en' ? monthTitle : monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1)

  const combinedISO = selectedDate && time ? `${selectedDate}T${time}` : ''

  function moveMonth(delta: number) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  function selectDay(year: number, month: number, day: number) {
    const nextDate = localDateKey(new Date(year, month, day))
    setSelectedDate(nextDate)
    if (time) onChange(`${nextDate}T${time}`)
    setOpen(false)
  }

  function selectTime(nextTime: string) {
    setTime(nextTime)
    if (selectedDate && nextTime) onChange(`${selectedDate}T${nextTime}`)
  }

  function handleBlur() {
    // small delay to allow day click to register
    window.setTimeout(() => setOpen(false), 150)
  }

  return (
    <div className="schedule-picker">
      <label className="schedule-field">
        <span>{t('Schedule date and time')}</span>
        <div className="schedule-input-wrapper">
          <button
            type="button"
            className="schedule-date-button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            {selectedDate ? (
              <>
                <span className="schedule-date-value">{new Date(selectedDate + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</span>
                <span className="schedule-date-sep">,</span>
                <span className="schedule-year">{new Date(selectedDate + 'T00:00:00').getFullYear()}</span>
              </>
            ) : (
              <span className="schedule-date-placeholder">{t('Pick a date')}</span>
            )}
            <span className="schedule-caret" aria-hidden="true">▼</span>
          </button>
          <input type="time" className="schedule-time-input" value={time} onChange={(event) => selectTime(event.target.value)} />
        </div>
        {invalid && <p className="form-message" role="alert">{errorMessage}</p>}
      </label>

      {open && (
        <div className="schedule-calendar-popover" role="dialog" aria-label={t('Pick a date')} onBlur={handleBlur}>
          <div className="schedule-calendar-header">
            <button type="button" className="schedule-nav" onClick={() => moveMonth(-1)} aria-label={t('Previous month')}>‹</button>
            <span className="schedule-month-title">{visibleMonth}</span>
            <button type="button" className="schedule-nav" onClick={() => moveMonth(1)} aria-label={t('Next month')}>›</button>
          </div>
          <div className="schedule-weekdays">
            {weekdayLabels.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="schedule-days">
            {cells.map((cell, index) => {
              if (cell === null) return <span key={`empty-${index}`} className="schedule-day schedule-day--empty" />
              const date = new Date(cell.year, cell.month, cell.day)
              const key = localDateKey(date)
              const isToday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
              const isSelected = key === selectedDate
              const isPast = date < new Date(now.getFullYear(), now.getMonth(), now.getDate())
              const inMonth = cell.month === cursor.getMonth()
              return (
                <button
                  key={key}
                  type="button"
                  className={[
                    'schedule-day',
                    inMonth ? '' : 'schedule-day--other',
                    isToday ? 'schedule-day--today' : '',
                    isSelected ? 'schedule-day--selected' : '',
                    isPast ? 'schedule-day--past' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => !isPast && selectDay(cell.year, cell.month, cell.day)}
                  disabled={isPast}
                  aria-pressed={isSelected}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <input type="hidden" value={combinedISO} readOnly />
    </div>
  )
}

type StudioOption = {
  key: string
  label: string
  hint?: string
  leadingIcon?: string
}

/** Custom dropdown with an open animation, styled to the studio platform. */
function StudioDropdown({
  options, value, onSelect, disabled, placeholder, leadingIcon,
}: {
  options: StudioOption[]
  value: string
  onSelect: (key: string) => void
  disabled: boolean
  placeholder: string
  leadingIcon?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selected = options.find((option) => option.key === value)

  return (
    <div className="studio-dropdown" ref={rootRef}>
      <button
        type="button"
        className="studio-dropdown-trigger"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((state) => !state)}
      >
        {leadingIcon && <span className="material-symbols-outlined text-[18px] text-primary shrink-0" aria-hidden="true">{leadingIcon}</span>}
        <span className={`studio-dropdown-value ${selected ? '' : 'studio-dropdown-value--placeholder'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className={`studio-dropdown-caret ${open ? 'studio-dropdown-caret--open' : ''}`}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">expand_more</span>
        </span>
      </button>
      {open && (
        <div className="studio-dropdown-panel" role="listbox">
          {options.map((option) => {
            const on = option.key === value
            return (
              <button
                key={option.key}
                type="button"
                role="option"
                aria-selected={on}
                className={`studio-dropdown-option ${on ? 'is-on' : ''}`}
                onClick={() => { onSelect(option.key); setOpen(false) }}
              >
                {option.leadingIcon && <span className="material-symbols-outlined text-[16px] text-outline shrink-0" aria-hidden="true">{option.leadingIcon}</span>}
                <span className="studio-dropdown-option-body">
                  <span className="studio-dropdown-option-label">{option.label}</span>
                  {option.hint && <span className="studio-dropdown-option-hint">{option.hint}</span>}
                </span>
                {on && <span className="material-symbols-outlined text-[16px] text-primary shrink-0" aria-hidden="true">check</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CreateWorkspace({
  currentCompany, session, onSessionChange, companies, onCompanyChange, autosaveStatus,
}: {
  currentCompany: Company
  session: CreateSession
  onSessionChange: (companyId: string, update: SessionUpdate) => void
  companies: Company[]
  onCompanyChange: (companyId: string) => void
  autosaveStatus: AutosaveStatus
}) {
  const { t, activity, language, formatDateTime } = useI18n()
  const companyId = currentCompany.id ?? currentCompany.name
  const [editingIdea, setEditingIdea] = useState(false)
  const [invalidSchedule, setInvalidSchedule] = useState(false)
  const [workflowError, setWorkflowError] = useState<string | null>(null)
  const [availableModels, setAvailableModels] = useState<AiModel[]>([])
  const [readinessVersion, setReadinessVersion] = useState(0)
  const [publishReadiness, setPublishReadiness] = useState<{
    companyId: string
    ready: boolean
    errors: string[]
  }>({ companyId: '', ready: false, errors: [] })
  const mediaModels = availableModels.filter((item) => item.media === session.mediaType)
  const effectiveModelId = session.modelId && mediaModels.some((item) => item.name === session.modelId)
    ? session.modelId
    : (mediaModels.find((item) => item.ready)?.name ?? '')
  const selectedModelRow = mediaModels.find((item) => item.name === effectiveModelId)
  const accountReady = publishReadiness.companyId === currentCompany.id && publishReadiness.ready
  const canGenerate = Boolean(session.objective) && session.platforms.length > 0 && Boolean(selectedModelRow?.ready)
  const estimatedMediaCredits = (() => {
    if (!selectedModelRow) return null
    if (session.mediaType === 'Video' && selectedModelRow.price_per_sec != null && session.durationSec) {
      return Math.ceil(Number(selectedModelRow.price_per_sec) * session.durationSec * 100)
    }
    const amount = /\$\s*(\d+(?:\.\d+)?)/.exec(selectedModelRow.price)?.[1]
    return amount ? Math.ceil(Number(amount) * 100) : null
  })()
  const autosaveLabel = autosaveStatus.state === 'saving'
    ? t('Saving draft…')
    : autosaveStatus.state === 'saved' && autosaveStatus.savedAt
      ? t('Saved at {time}', { time: formatDateTime(autosaveStatus.savedAt) })
      : autosaveStatus.state === 'error'
        ? t('Draft not saved')
        : t('Autosave ready')

  // Structured model selector grouping (family -> version -> mode).
  const famKey = (m: AiModel) => m.family || m.name
  const activeFamily = selectedModelRow ? famKey(selectedModelRow) : ''
  const activeVersion = selectedModelRow?.version || ''
  const familyRows = mediaModels.filter((m) => famKey(m) === activeFamily)
  const versions = [...new Set(familyRows.map((m) => m.version || '—'))]
  const versionRows = familyRows.filter((m) => (m.version || '—') === activeVersion)
  const selectedMin = selectedModelRow?.min_duration_sec ?? null
  const selectedMax = selectedModelRow?.max_duration_sec ?? null
  const durationCandidates: number[] = (() => {
    if (!selectedMin || !selectedMax) return []
    if (selectedMin === selectedMax) return [selectedMin]
    const count = Math.min(5, selectedMax - selectedMin + 1)
    const step = Math.max(1, Math.round((selectedMax - selectedMin) / (count - 1)))
    const values = new Set<number>()
    for (let v = selectedMin; v <= selectedMax; v += step) values.add(v)
    values.add(selectedMax)
    return [...values].sort((a, b) => a - b)
  })()

  function pickModel(row: AiModel) {
    if (session.state !== 'draft') return
    const clamped = clampDuration(row, session.durationSec)
    update({ modelId: row.name, durationSec: clamped })
  }

  function pickFamily(row: AiModel) {
    if (session.state !== 'draft') return
    const key = famKey(row)
    const ready = mediaModels.find((m) => famKey(m) === key && m.ready)
    const target = (ready ?? row) as AiModel
    update({ modelId: target.name, durationSec: clampDuration(target, session.durationSec) })
  }

  function pickVersion(row: AiModel) {
    if (session.state !== 'draft') return
    const key = famKey(row)
    const ver = row.version || '—'
    const ready = familyRows.find((m) => famKey(m) === key && (m.version || '—') === ver && m.ready)
    const target = (ready ?? row) as AiModel
    update({ modelId: target.name, durationSec: clampDuration(target, session.durationSec) })
  }

  function pickDuration(seconds: number) {
    if (session.state !== 'draft') return
    update({ durationSec: seconds })
  }

  function clampDuration(row: AiModel, current: number | null): number | null {
    if (current == null) return row?.max_duration_sec ?? null
    if (row?.min_duration_sec == null || row?.max_duration_sec == null) return null
    return Math.min(Math.max(current, row.min_duration_sec), row.max_duration_sec)
  }

  useEffect(() => {
    let active = true
    Promise.allSettled([listModels('image'), listModels('video')])
      .then(([image, video]) => {
        if (!active) return
        const merged: AiModel[] = []
        for (const result of [image, video]) if (result.status === 'fulfilled') merged.push(...result.value)
        setAvailableModels(merged)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const targetCompanyId = currentCompany.id
    if (!targetCompanyId) return
    let active = true
    testPublishReadiness(targetCompanyId)
      .then((result) => {
        if (active) setPublishReadiness({ companyId: targetCompanyId, ready: result.ready, errors: result.errors })
      })
      .catch((error: unknown) => {
        if (active) setPublishReadiness({
          companyId: targetCompanyId,
          ready: false,
          errors: [error instanceof Error ? error.message : 'Publish readiness check failed.'],
        })
      })
    return () => { active = false }
  }, [currentCompany.id, readinessVersion])

  const previewReady = ['preview_ready', 'scheduled', 'published'].includes(session.state)
  const activeStep = stepIndexForState(session.state)

  useEffect(() => {
    if (session.state !== 'researching' && session.state !== 'generating') return
    const workflowId = session.workflowId
    if (!workflowId) return
    const expected = session.state
    const controller = new AbortController()
    let cancelled = false

    const finish = (wf: Workflow, activityCode: ActivityCode) => {
      setWorkflowError(wf.state === 'failed' ? (wf.last_error_message || t('Generation failed.')) : null)
      onSessionChange(companyId, (current) => {
        const next = {
          ...current,
          workflowId: wf.id,
          state: wf.state,
          ideaTitle: wf.idea?.title ?? current.ideaTitle,
          ideaSummary: wf.idea?.summary ?? current.ideaSummary,
          ideaHook: wf.idea?.hook ?? current.ideaHook,
          ideaScene: wf.idea?.scene ?? current.ideaScene,
          mediaUrl: wf.media_asset_url ?? current.mediaUrl,
          generatedMediaType: wf.media_asset_media_type ?? current.generatedMediaType,
        }
        if (activityCode === 'previewReady' && wf.state === 'preview_ready') {
          next.caption = next.caption || captionFromIdea(next, currentCompany)
          next.hashtags = next.hashtags || hashtagsFromIdea(next, currentCompany)
        }
        return appendActivity(next, activityCode)
      })
    }

    ;(async () => {
      for (let attempt = 0; attempt < 120; attempt++) {
        await sleep(1600)
        if (cancelled) return
        let wf: Workflow
        try {
          wf = await getWorkflow(workflowId, controller.signal)
        } catch (error) {
          if (error instanceof ApiError && (error.kind === 'not_found' || error.status === 404)) {
            setWorkflowError(error.message)
            return
          }
          continue
        }
        if (expected === 'researching' && ['idea_ready', 'failed', 'cancelled'].includes(wf.state)) {
          finish(wf, 'researchFinished')
          return
        }
        if (expected === 'generating' && ['preview_ready', 'failed', 'cancelled'].includes(wf.state)) {
          finish(wf, 'previewReady')
          return
        }
      }
      setWorkflowError(t('Generation timed out.'))
    })()

    return () => { cancelled = true; controller.abort() }
  }, [session.state, session.workflowId, companyId, onSessionChange, currentCompany, t])

  function update(patch: Partial<CreateSession>) {
    onSessionChange(companyId, (current) => ({ ...current, ...patch }))
  }

  function handleApiError(error: unknown) {
    setWorkflowError(error instanceof Error ? error.message : t('Request failed'))
  }

  async function startIdeaGeneration() {
    setWorkflowError(null)
    try {
      let workflowId = session.workflowId
      if (!workflowId) {
        const created = await createWorkflow({
          company_id: currentCompany.id as string,
          media_type: mediaTypeToValue(session.mediaType),
          brief: briefForBackend(session),
          content_language: languageFromLabel(session.language),
          model_id: effectiveModelId,
          aspect_ratio: session.aspectRatio,
          duration_sec: session.durationSec,
          reference_ids: session.referenceIds ?? [],
        })
        workflowId = created.id
        onSessionChange(companyId, (current) => ({ ...current, workflowId: workflowId!, modelId: effectiveModelId }))
      } else if ((session.referenceIds ?? []).length) {
        for (const referenceId of session.referenceIds) {
          await attachReference(workflowId, referenceId)
        }
      }
      const updated = await generateIdeaApi(workflowId)
      onSessionChange(companyId, (current) => ({
        ...current,
        workflowId: updated.id,
        state: updated.state,
        ideaTitle: updated.idea?.title ?? current.ideaTitle,
        ideaSummary: updated.idea?.summary ?? current.ideaSummary,
        ideaHook: updated.idea?.hook ?? current.ideaHook,
        ideaScene: updated.idea?.scene ?? current.ideaScene,
      }))
    } catch (error) {
      handleApiError(error)
    }
  }

  function togglePlatform(platform: string) {
    update({
      platforms: session.platforms.includes(platform)
        ? session.platforms.filter((item) => item !== platform)
        : [...session.platforms, platform],
    })
  }

  async function approveIdea() {
    setWorkflowError(null)
    if (!session.workflowId) return
    try {
      await editWorkflow(session.workflowId, {
        idea: {
          title: session.ideaTitle,
          summary: session.ideaSummary,
          hook: session.ideaHook,
          scene: session.ideaScene,
        },
      })
      const updated = await approveWorkflow(session.workflowId)
      onSessionChange(companyId, (current) => ({ ...current, state: updated.state }))
    } catch (error) {
      handleApiError(error)
    }
  }

  async function regenerate() {
    setWorkflowError(null)
    setEditingIdea(false)
    if (!session.workflowId) return
    try {
      const updated = await regenerateWorkflow(session.workflowId)
      onSessionChange(companyId, (current) => ({ ...current, state: updated.state }))
    } catch (error) {
      handleApiError(error)
    }
  }

  async function cancelFlow() {
    setWorkflowError(null)
    if (!session.workflowId) return
    try {
      const updated = await cancelWorkflow(session.workflowId)
      onSessionChange(companyId, (current) => ({ ...current, state: updated.state, workflowId: '' }))
    } catch (error) {
      handleApiError(error)
    }
  }

  function handleFiles(filesInput: FileList | null) {
    if (!filesInput?.length) return
    const files = Array.from(filesInput)
    const names = files.map((file) => file.name)
    onSessionChange(companyId, (current) => appendActivity({
      ...current,
      referenceNames: [...new Set([...current.referenceNames, ...names])],
    }, 'filesAttached', names.length))
    if (!currentCompany.id) return
    void (async () => {
      const newIds: string[] = []
      try {
        for (const file of files) {
          const form = new FormData()
          form.append('file', file)
          form.append('company_id', currentCompany.id as string)
          form.append('caption', file.name)
          const created = await createReference(form)
          newIds.push(created.id)
        }
      } catch (error) {
        setWorkflowError(error instanceof Error ? error.message : t('Request failed'))
      }
      if (newIds.length) onSessionChange(companyId, (current) => ({
        ...current,
        referenceIds: [...new Set([...current.referenceIds, ...newIds])],
      }))
    })()
  }

  function saveDraft() {
    onSessionChange(companyId, (current) => appendActivity({ ...current, savedAt: new Date().toISOString() }, 'draftSaved'))
  }

  async function schedule() {
    setWorkflowError(null)
    if (!session.scheduledFor || new Date(session.scheduledFor).getTime() <= Date.now()) {
      setInvalidSchedule(true)
      return
    }
    if (!session.workflowId) return
    try {
      const updated = await scheduleWorkflow(session.workflowId, new Date(session.scheduledFor).toISOString())
      onSessionChange(companyId, (current) => ({ ...current, state: updated.state ?? current.state, savedAt: current.savedAt }))
    } catch (error) {
      handleApiError(error)
    }
  }

  async function publishNow() {
    setWorkflowError(null)
    if (!session.workflowId) return
    try {
      const updated = await publishWorkflow(session.workflowId)
      onSessionChange(companyId, (current) => ({ ...current, state: updated.state ?? current.state }))
    } catch (error) {
      handleApiError(error)
    }
  }

  function resetSession() {
    onSessionChange(companyId, () => createInitialSession(currentCompany, outputLanguageForInterface(language)))
  }

  const busy = session.state === 'researching' || session.state === 'generating'
  const ideaStage = session.state === 'idea_ready' || previewReady

  function ratioBox(ratio: AspectRatio) {
    switch (ratio) {
      case '1:1': return 'studio-ratio-1x1'
      case '9:16': return 'studio-ratio-9x16'
      case '16:9': return 'studio-ratio-16x9'
      default: return 'studio-ratio-4x5'
    }
  }

  function resolutionFor(ratio: AspectRatio): string {
    switch (ratio) {
      case '1:1': return '1024 × 1024'
      case '9:16': return '1080 × 1920'
      case '16:9': return '1920 × 1080'
      default: return '1080 × 1350'
    }
  }

  const hashtagList = session.hashtags.split(/\s+/).filter(Boolean)

  function suggestTags() {
    const stock = String(currentCompany.name).replace(/[^a-zA-Z0-9]/g, '')
    const suggestions = [
      stock ? `#${stock}` : '',
      session.mediaType === 'Video' ? '#video' : '#creative',
    ].filter(Boolean)
    const next = new Set(hashtagList)
    for (const tag of suggestions) if (tag) next.add(tag)
    update({ hashtags: Array.from(next).join(' ') })
  }

  const companyOptions: StudioOption[] = companies.map((company) => ({
    key: company.id ?? company.name,
    label: company.name,
    hint: company.status || undefined,
    leadingIcon: 'apartment',
  }))

  function scrollToStep(key: string) {
    const anchor = {
      objective: 'studio-section-a',
      concept: 'studio-section-c',
      media: 'studio-section-b',
      publish: 'studio-preview',
    }[key]
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="create-studio flex flex-col min-w-0">
      {/* Header: title + description + quick controls */}
      <section className="flex flex-col gap-5 border-b border-outline-variant/30 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">{t('Create Social Post')}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-container/20 text-primary border border-primary/30">{t('Guided Studio')}</span>
            </div>
            <p className="text-xs font-normal text-outline mt-0.5">{t('Turn a brief into a post your team can review and schedule.')}</p>
          </div>
          {/* Quick flow controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40 shadow-inner" title={t('Estimate uses the selected model price. Final billing is confirmed by the server.')}>
              <span className="material-symbols-outlined text-[16px] text-tertiary" aria-hidden="true">electric_bolt</span>
              <span className="text-[11px] font-semibold text-outline">{t('Estimated Cost:')}</span>
              <span className="text-[11px] font-semibold text-tertiary-fixed">{estimatedMediaCredits == null ? t('Calculated by server') : t('About {cost} Credits', { cost: estimatedMediaCredits })}</span>
            </div>
            <StatusPill
              label={autosaveLabel}
              tone={autosaveStatus.state === 'error' ? 'danger' : autosaveStatus.state === 'saved' ? 'good' : 'neutral'}
            />
          </div>
        </div>

        {/* 4-step operational pipeline stepper bar */}
        <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-2.5 flex items-center justify-between gap-2 overflow-x-auto shadow-sm" role="navigation" aria-label={t('Workflow progress')}>
          {pipeline.map((step, index) => {
            const done = index < activeStep
            const active = index === activeStep
            const last = index === pipeline.length - 1
            return (
              <Fragment key={step.key}>
                <button
                  type="button"
                  onClick={() => scrollToStep(step.key)}
                  title={t('Go to step {n}', { n: String(index + 1) })}
                  className={
                    active
                      ? 'studio-step-btn flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-primary-container/20 border border-primary text-primary flex-1 min-w-[200px] shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                      : done
                        ? 'studio-step-btn flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 flex-1 min-w-[200px]'
                        : 'studio-step-btn flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest/50 border border-outline-variant/10 text-outline flex-1 min-w-[190px]'
                  }
                >
                  <div
                    className={
                      active
                        ? 'w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold shadow-md shadow-primary-container/50'
                        : done
                          ? 'w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center'
                          : 'w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant/30 text-outline flex items-center justify-center font-semibold'
                    }
                  >
                    {done ? <span className="material-symbols-outlined text-[15px]" aria-hidden="true">check</span> : index + 1}
                  </div>
                  <div className="flex flex-col min-w-0">
                    {active && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-tertiary-fixed font-bold uppercase tracking-wider">{t('Active')}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                      </div>
                    )}
                    {done && <span className="text-[11px] font-semibold text-emerald-300">{t('Step {n}', { n: String(index + 1) })}</span>}
                    {!active && !done && <span className="text-[11px] font-semibold text-outline">{t('Upcoming')}</span>}
                    <span className={`text-xs font-semibold truncate ${active ? 'text-tertiary-fixed font-bold' : done ? 'text-on-surface font-medium' : 'text-outline'}`}>
                      {t(step.label as TranslationKey)}
                    </span>
                  </div>
                </button>
                {!last && <span className="material-symbols-outlined text-outline-variant text-[18px] shrink-0" aria-hidden="true">chevron_right</span>}
              </Fragment>
            )
          })}
        </div>
      </section>

      {/* Two-column studio split workspace grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start mt-6">
        {/* LEFT COLUMN (7 cols): form & configuration */}
        <div className="xl:col-span-7 space-y-5">
          {workflowError && (
            <div className="p-3 rounded-lg border border-error/40 bg-error-container/20 text-on-error text-xs font-normal" role="alert">{workflowError}</div>
          )}

          {/* Section A: Target Business & Objective Card */}
          <section id="studio-section-a" className="bg-surface-container-low rounded-xl border border-outline-variant/30 p-5 shadow-lg space-y-4 scroll-mt-24">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">target</span>
                <h2 className="text-base font-semibold text-on-surface">{t('Target Business & Objective')}</h2>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">{t('Step 1')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-outline">{t('Managed Organization')}</label>
                <StudioDropdown
                  options={companyOptions}
                  value={companyId}
                  onSelect={(key) => onCompanyChange(key)}
                  disabled={false}
                  placeholder={t('Select company')}
                  leadingIcon="apartment"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-outline">{t('Campaign Objective')}</label>
                <StudioDropdown
                  options={OBJECTIVES.map((item) => ({ key: item, label: t(item as TranslationKey) }))}
                  value={session.objective}
                  onSelect={(key) => update({ objective: key })}
                  disabled={session.state !== 'draft'}
                  placeholder={t('Select objective')}
                  leadingIcon="flag"
                />
              </div>
            </div>

            {/* Platform targets */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-semibold text-outline">{t('Platform Targets')}</label>
              <div className="studio-platform-grid grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PLATFORMS.map((platform) => {
                  const checked = session.platforms.includes(platform)
                  return (
                    <label
                      key={platform}
                      className={`flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-lowest cursor-pointer transition-all ${
                        checked
                          ? 'border border-primary/40 text-on-surface hover:border-primary'
                          : 'border border-outline-variant/20 text-outline hover:border-outline-variant'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePlatform(platform)}
                        disabled={session.state !== 'draft'}
                        className="w-4 h-4 rounded border-outline-variant text-primary-container focus:ring-primary-container bg-surface-container-lowest"
                      />
                      <span className="text-xs font-semibold">{platform}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Reference upload / context files */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-semibold text-outline">{t('Attach reference files')}</label>
              <label className="studio-upload flex items-center justify-center gap-2 p-4 border border-dashed border-outline-variant/50 rounded-lg bg-surface-container-lowest cursor-pointer text-center hover:border-primary/50 transition-colors">
                <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">upload_file</span>
                <span className="text-xs font-normal text-outline">{t('Images, documents, PDFs, audio, or text.')}</span>
                <input
                  className="sr-only"
                  type="file"
                  multiple
                  accept="image/*,.md,.txt,.docx,.pptx,.csv,.pdf,audio/*"
                  onChange={(event) => handleFiles(event.target.files)}
                  disabled={session.state !== 'draft'}
                />
              </label>
              {session.referenceNames.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {session.referenceNames.map((name) => (
                    <span key={name} className="px-2.5 py-1 rounded-full bg-surface-container-lowest border border-primary/30 text-[11px] font-semibold text-primary">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section B: Format & Model Selection Card */}
          <section id="studio-section-b" className="bg-surface-container-low rounded-xl border border-outline-variant/30 p-5 shadow-lg space-y-4 scroll-mt-24">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">view_in_ar</span>
                <h2 className="text-base font-semibold text-on-surface">{t('Format & Model Selection')}</h2>
              </div>
              <span className="text-[11px] font-semibold text-tertiary bg-primary-container/20 border border-primary/30 px-2 py-0.5 rounded-full font-semibold">{t('Step 2')}</span>
            </div>

            {/* Format segmented selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-outline">{t('Media Generation Mode')}</label>
              <div className="grid grid-cols-2 p-1 bg-surface-container-lowest border border-outline-variant/30 rounded-lg gap-1">
                {(['Image', 'Video'] as const).map((type) => {
                  const on = session.mediaType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={session.state !== 'draft'}
                      onClick={() => update({ mediaType: type })}
                      className={`h-9 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                        on
                          ? 'bg-surface-container-high border border-outline-variant/40 text-on-surface shadow-sm'
                          : 'text-outline hover:text-on-surface hover:bg-surface-container-low/50'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[18px] ${on ? 'text-primary' : ''}`} aria-hidden="true">{type === 'Image' ? 'image' : 'videocam'}</span>
                      <span>{type === 'Video' ? t('Video (I2V)') : t('Image')}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* AI media model selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-outline">{t('Primary Visual Generative Engine')}</label>
              <div className="p-3.5 rounded-xl bg-primary-container/10 border-2 border-primary relative overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.15)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-md shrink-0">
                      <span className="material-symbols-outlined text-[22px]" aria-hidden="true">auto_awesome</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-on-surface font-bold truncate">{effectiveModelId || t('Not selected')}</span>
                        {selectedModelRow?.ready && (
                          <span className="text-[11px] font-semibold bg-primary/20 text-tertiary-fixed border border-primary/30 px-2 py-0.5 rounded-full">{t('Ready')}</span>
                        )}
                      </div>
                      <p className="text-xs font-normal text-on-surface-variant mt-0.5 truncate">{selectedModelRow?.provider || ''}</p>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap shrink-0">
                    <span className="text-[11px] font-semibold text-tertiary font-bold block">{selectedModelRow?.price || ''}</span>
                  </div>
                </div>
                {/* Structured model selector: family -> version -> mode */}
                <div className="mt-3 pt-3 border-t border-primary/20 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-outline">{t('Model Family')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[...new Set(mediaModels.map(famKey))].map((family) => {
                        const on = family === activeFamily
                        return (
                          <button
                            key={family}
                            type="button"
                            disabled={session.state !== 'draft'}
                            onClick={() => { const target = mediaModels.find((m) => famKey(m) === family) as AiModel; pickFamily(target) }}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              on
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-outline'
                            }`}
                          >
                            {family}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {versions.length > 1 && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-outline">{t('Model Version')}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {versions.map((version) => {
                          const on = version === activeVersion
                          const target = familyRows.find((m) => (m.version || '—') === version) as AiModel
                          return (
                            <button
                              key={version}
                              type="button"
                              disabled={session.state !== 'draft'}
                              onClick={() => pickVersion(target)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                on
                                  ? 'bg-primary/20 border-primary text-primary'
                                  : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-outline'
                              }`}
                            >
                              {version}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-outline">{t('Generation Mode')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {versionRows.map((item) => {
                        const on = item.name === effectiveModelId
                        return (
                          <button
                            key={item.name}
                            type="button"
                            disabled={session.state !== 'draft' || !item.ready}
                            onClick={() => pickModel(item)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              on
                                ? 'bg-primary-container text-on-primary border-primary shadow-sm'
                                : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-outline'
                            }`}
                          >
                            {item.mode || item.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {selectedModelRow?.resolution && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-on-surface-variant font-semibold">
                      <span>{t('Resolution')}: <span className="text-on-surface">{selectedModelRow.resolution}</span></span>
                      {selectedModelRow.price_per_sec != null && (
                        <span>{t('per second')}: <span className="text-on-surface">${selectedModelRow.price_per_sec}</span></span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Aspect ratio chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-outline">{t('Aspect Ratio Canvas')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {RATIOS.map((ratio) => {
                  const on = session.aspectRatio === ratio.value
                  return (
                    <button
                      key={ratio.value}
                      type="button"
                      disabled={session.state !== 'draft'}
                      onClick={() => update({ aspectRatio: ratio.value })}
                      className={`h-9 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors ${
                        on
                          ? 'bg-primary-container/20 border border-primary text-primary font-semibold shadow-sm'
                          : 'bg-surface-container-lowest border border-outline-variant/30 text-outline hover:text-on-surface'
                      }`}
                    >
                      <span className={`${ratio.shapeClass}`} />
                      <span>{t(ratio.label as TranslationKey)}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Video duration picker (only for video models with a duration window) */}
            {session.mediaType === 'Video' && durationCandidates.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-outline">{t('Video Duration')}</label>
                <div className="flex flex-wrap gap-2">
                  {durationCandidates.map((seconds) => {
                    const chosen = (session.durationSec ?? selectedMax) === seconds
                    const cost = selectedModelRow?.price_per_sec != null ? (selectedModelRow.price_per_sec * seconds).toFixed(3) : null
                    return (
                      <button
                        key={seconds}
                        type="button"
                        disabled={session.state !== 'draft'}
                        onClick={() => pickDuration(seconds)}
                        className={`h-9 px-3 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          chosen
                            ? 'bg-primary-container/20 border border-primary text-primary shadow-sm'
                            : 'bg-surface-container-lowest border border-outline-variant/30 text-outline hover:text-on-surface'
                        }`}
                      >
                        {seconds} {t('sec')}
                        {cost != null && <span className="ml-1 opacity-70 font-normal">·${cost}</span>}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs font-normal text-outline">
                  {selectedModelRow?.name ? `${selectedModelRow.name} · ` : ''}{t('Estimated cost')}: $
                  <span className="text-on-surface font-semibold">
                    {(selectedModelRow?.price_per_sec ?? 0) * (session.durationSec ?? selectedMax ?? 0)}
                  </span>{' '}
                  ({t('per second')}: ${selectedModelRow?.price_per_sec ?? 0})
                </p>
              </div>
            )}

            {/* Advanced collapsible parameters */}
            <details className="group bg-surface-container-lowest rounded-lg border border-outline-variant/30 p-3" open>
              <summary className="flex items-center justify-between cursor-pointer list-none select-none text-xs font-semibold text-outline group-hover:text-on-surface">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-tertiary" aria-hidden="true">tune</span>
                  <span className="text-on-surface font-medium">{t('Advanced Model Parameters')}</span>
                </div>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-150 group-open:rotate-180" aria-hidden="true">expand_more</span>
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-outline-variant/20">
                <div className="space-y-1">
                  <label className="text-[11px] text-outline uppercase font-semibold">Seed</label>
                  <input className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant/40 rounded text-xs font-normal text-on-surface focus:border-primary focus:ring-0" type="text" value={session.seed} onChange={(event) => update({ seed: event.target.value })} disabled={session.state !== 'draft'} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-outline uppercase font-semibold">Motion Strength</label>
                  <input className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant/40 rounded text-xs font-normal text-on-surface focus:border-primary focus:ring-0" type="text" value={session.motionStrength} onChange={(event) => update({ motionStrength: event.target.value })} disabled={session.state !== 'draft'} />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-outline uppercase font-semibold">CFG Guidance</label>
                  <input className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant/40 rounded text-xs font-normal text-on-surface focus:border-primary focus:ring-0" type="text" value={session.cfgGuidance} onChange={(event) => update({ cfgGuidance: event.target.value })} disabled={session.state !== 'draft'} />
                </div>
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[11px] text-outline uppercase font-semibold">{t('Negative Prompt Filter')}</label>
                  <input className="w-full h-8 px-2.5 bg-surface-container border border-outline-variant/40 rounded text-xs font-normal text-outline-variant focus:border-primary focus:text-on-surface focus:ring-0" type="text" value={session.negativePrompt} onChange={(event) => update({ negativePrompt: event.target.value })} disabled={session.state !== 'draft'} />
                </div>
              </div>
            </details>
            <p className="text-xs font-normal text-outline">{t('Advanced fields tune the generation request.')}</p>
          </section>

          {/* Section C: AI Copy Generation */}
          <section id="studio-section-c" className="bg-surface-container-low rounded-xl border border-outline-variant/30 p-5 shadow-lg space-y-4 scroll-mt-24">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">neurology</span>
                <h2 className="text-base font-semibold text-on-surface">{t('AI Copy Generation')}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-tertiary">{t('Included in server estimate')}</span>
                <button className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-on-surface" type="button" title={t('Regenerate')} onClick={() => { void regenerate() }} disabled={!ideaStage}>
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span>
                </button>
              </div>
            </div>

            {/* Hook / headline input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-outline">{t('Attention Hook / Title')}</label>
              <div className="relative">
                <input
                  className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-sm font-normal text-on-surface focus:border-primary focus:ring-1 focus:ring-primary pr-9"
                  type="text"
                  value={session.hook || session.ideaHook}
                  onChange={(event) => update({ hook: event.target.value })}
                  disabled={!ideaStage || session.state === 'published'}
                  placeholder={t('Attention hook for the post')}
                />
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-outline text-[18px]" aria-hidden="true">bolt</span>
              </div>
            </div>

            {/* Caption editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-outline">{t('Body Caption')}</label>
                <span className="text-[11px] font-semibold text-outline">{session.caption.length} / 2,200</span>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl overflow-hidden focus-within:border-primary">
                <textarea
                  className="w-full p-3 bg-transparent border-0 text-sm font-normal text-on-surface focus:ring-0 resize-y leading-relaxed"
                  rows={4}
                  value={session.caption}
                  onChange={(event) => update({ caption: event.target.value })}
                  disabled={!previewReady || session.state === 'published'}
                  placeholder={t('Caption becomes editable when the preview is ready.')}
                />
              </div>
            </div>

            {/* Hashtag chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-outline">{t('Localized Tags')}</label>
              {previewReady ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {hashtagList.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-surface-container-lowest border border-outline-variant/30 text-[11px] font-semibold text-on-surface flex items-center gap-1">
                      {tag}
                      {session.state !== 'published' && (
                        <button className="text-outline hover:text-on-surface text-[14px]" type="button" onClick={() => update({ hashtags: hashtagList.filter((t2) => t2 !== tag).join(' ') })} aria-label={t('Remove tag')}>×</button>
                      )}
                    </span>
                  ))}
                  <button className="px-2.5 py-1 rounded-full bg-primary-container/15 border border-primary/30 text-[11px] font-semibold text-primary hover:bg-primary-container/30 transition-colors flex items-center gap-1" type="button" onClick={suggestTags}>
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">add</span>
                    {t('Suggest More')}
                  </button>
                </div>
              ) : (
                <p className="text-xs font-normal text-outline">{t('Hashtags appear when the preview is ready.')}</p>
              )}
            </div>

            {/* Target CTA */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-outline">{t('Call to Action Link & Button Text')}</label>
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 h-9 px-3 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-xs font-normal text-on-surface focus:border-primary"
                  type="text"
                  value={session.cta}
                  onChange={(event) => update({ cta: event.target.value })}
                  disabled={session.state === 'published'}
                  placeholder={t('Claim offer / Book visit')}
                />
              </div>
            </div>

            {/* Idea review / actions zone */}
            {ideaStage && (
              <div className="p-3.5 rounded-lg bg-primary-container/10 border border-primary/20 space-y-3">
                <StatusPill label={session.state === 'idea_ready' ? t('Idea ready') : t('Approved idea')} tone="good" />
                {editingIdea && session.state === 'idea_ready' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="text-[11px] text-outline uppercase font-semibold">{t('Title')}</span>
                      <input className="w-full h-9 px-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-xs font-normal text-on-surface focus:border-primary focus:ring-0" value={session.ideaTitle} onChange={(event) => update({ ideaTitle: event.target.value })} />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] text-outline uppercase font-semibold">{t('Direction')}</span>
                      <textarea className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-xs font-normal text-on-surface focus:border-primary focus:ring-0 resize-y" rows={2} value={session.ideaSummary} onChange={(event) => update({ ideaSummary: event.target.value })} />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] text-outline uppercase font-semibold">{t('Hook')}</span>
                      <input className="w-full h-9 px-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-xs font-normal text-on-surface focus:border-primary focus:ring-0" value={session.ideaHook} onChange={(event) => update({ ideaHook: event.target.value })} />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] text-outline uppercase font-semibold">{t('Scene')}</span>
                      <textarea className="w-full p-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded text-xs font-normal text-on-surface focus:border-primary focus:ring-0 resize-y" rows={4} value={session.ideaScene} onChange={(event) => update({ ideaScene: event.target.value })} />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-base font-normal text-on-surface font-bold break-words">{session.ideaTitle}</h3>
                    <p className="text-sm font-normal text-on-surface-variant break-words">{session.ideaSummary}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
                        <span className="block text-[11px] text-outline uppercase font-semibold mb-1.5">{t('Hook')}</span>
                        <p className="text-xs font-normal text-on-surface break-words">{session.ideaHook}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30">
                        <span className="block text-[11px] text-outline uppercase font-semibold mb-1.5">{t('Scene')}</span>
                        <p className="text-xs font-normal text-on-surface break-words">{session.ideaScene}</p>
                      </div>
                    </div>
                  </div>
                )}
                {session.state === 'idea_ready' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button className="px-4 h-10 rounded-lg bg-primary-container text-on-primary hover:bg-[#ea580c] hover:text-on-primary text-xs font-semibold shadow-[0_0_12px_rgba(249,115,22,0.3)] active:scale-95 transition-all flex items-center gap-1.5" type="button" onClick={() => { void approveIdea() }}>
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">auto_awesome</span>
                      {t('Approve idea')}
                    </button>
                    <button className="h-10 px-3.5 rounded-lg border border-outline-variant/40 hover:border-outline text-outline hover:text-on-surface text-xs font-semibold transition-colors" type="button" onClick={() => setEditingIdea((value) => !value)}>{editingIdea ? t('Done editing') : t('Edit idea')}</button>
                    <button className="h-10 px-3.5 rounded-lg border border-outline-variant/40 hover:border-outline text-outline hover:text-on-surface text-xs font-semibold transition-colors" type="button" onClick={() => { void regenerate() }}>{t('Regenerate')}</button>
                    <button className="h-10 px-3.5 rounded-lg border border-outline-variant/40 hover:border-outline text-outline hover:text-on-surface text-xs font-semibold transition-colors" type="button" onClick={() => { void cancelFlow() }}>{t('Cancel')}</button>
                  </div>
                )}
              </div>
            )}

            {/* Draft state CTA */}
            {session.state === 'draft' || session.state === 'cancelled' ? (
              <div className="p-4 rounded-lg bg-primary-container/5 border border-dashed border-primary/30 text-center space-y-3">
                <p className="text-sm font-normal text-on-surface-variant font-medium">{session.state === 'cancelled' ? t('Workflow cancelled') : t('Ready to explore an idea')}</p>
                {session.state === 'draft' ? (
                  <button className="px-6 h-12 rounded-xl bg-primary-container hover:bg-[#ea580c] text-on-primary text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(249,115,22,0.45)] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed w-full" type="button" disabled={!canGenerate} onClick={() => { void startIdeaGeneration() }}>
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">bolt</span>
                    {t('Generate idea')}
                  </button>
                ) : (
                  <button className="px-6 h-12 rounded-xl bg-primary-container hover:bg-[#ea580c] text-on-primary text-sm font-bold shadow-[0_0_24px_rgba(249,115,22,0.45)] transition-all duration-150 active:scale-[0.98] w-full" type="button" onClick={resetSession}>
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add_circle</span>
                    {t('New brief')}
                  </button>
                )}
              </div>
            ) : null}

            {/* Busy state */}
            {busy && (
              <div className="flex flex-col items-center gap-3 p-5 text-center" role="status">
                <span className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-hidden="true" />
                <p className="text-sm font-normal text-on-surface font-medium">{session.state === 'researching' ? t('Reviewing the brief') : t('Preparing the preview')}</p>
                <small className="text-xs font-normal text-outline">{session.state === 'researching' ? t('Checking the brand context and drafting a direction…') : t('Building the media preview…')}</small>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN (5 cols): preview & publisher */}
        <div className="xl:col-span-5 space-y-5 sticky top-20">
          {/* Preview Stage Container */}
          <section id="studio-preview" className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-5 shadow-2xl space-y-4 scroll-mt-24">
            {/* Stage header & state */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-base font-semibold text-on-surface">{t('Live Media Preview Canvas')}</h3>
              </div>
            </div>

            {/* Canvas display with current aspect ratio */}
            <div className={`relative w-full max-w-[340px] mx-auto ${ratioBox(session.aspectRatio)} rounded-2xl overflow-hidden border border-outline-variant/50 shadow-[0_10px_40px_rgba(0,0,0,0.8)] bg-surface-container-lowest group`}>
              {session.mediaUrl ? (
                session.generatedMediaType === 'video'
                  ? <video className="w-full h-full object-cover" src={session.mediaUrl} controls playsInline loop muted />
                  : <img className="w-full h-full object-cover" src={session.mediaUrl} alt={t('Preview')} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${previewReady ? 'text-primary' : 'text-outline'}`}>
                    {busy ? t('Generating') : previewReady ? t('PREVIEW READY') : t('NO PREVIEW')}
                  </span>
                </div>
              )}
              {/* Top canvas badges */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-container-lowest/80 backdrop-blur-md text-primary border border-primary/30 shadow-md">
                  {selectedModelRow?.name || effectiveModelId || t('Not selected')}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 backdrop-blur-md text-on-surface border border-white/10">
                  {resolutionFor(session.aspectRatio)}
                </span>
              </div>
              {/* Bottom preview metadata & micro-bar */}
              <div className="absolute bottom-3 inset-x-3 p-3 rounded-xl bg-surface-container-lowest/85 backdrop-blur-md border border-outline-variant/30 space-y-2 pointer-events-none">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-on-surface font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-400" aria-hidden="true">timer</span>
                    {busy ? t('Generating') : previewReady ? t('Rendered in 18.2s') : t('Awaiting generation')}
                  </span>
                  <span className="text-tertiary-fixed font-bold">{t('Generation Cost: {cost} cr', { cost: '25' })} <span className="text-outline font-normal">({t('future')})</span></span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className={`h-full bg-primary ${busy ? 'w-2/3' : previewReady ? 'w-full' : 'w-0'} transition-all`} />
                </div>
              </div>
            </div>

            {/* Preview actions row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button className="h-9 rounded-lg bg-surface-container-lowest border border-outline-variant/30 hover:border-outline text-outline hover:text-on-surface flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" type="button" disabled={!previewReady || session.state === 'published'} onClick={saveDraft} title={t('Save draft')}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">save</span>
                <span>{t('Save draft')}</span>
              </button>
              <button className="h-9 rounded-lg bg-surface-container-lowest border border-outline-variant/30 hover:border-outline text-outline hover:text-on-surface flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" type="button" disabled={!ideaStage} onClick={() => { void regenerate() }}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">auto_mode</span>
                <span>{t('Regenerate')}</span>
              </button>
              <button className="h-9 rounded-lg bg-surface-container-lowest border border-outline-variant/30 hover:border-outline text-outline hover:text-on-surface flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" type="button" disabled={!previewReady} onClick={resetSession}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add_circle</span>
                <span>{t('New brief')}</span>
              </button>
              <button className="h-9 rounded-lg bg-surface-container-lowest border border-outline-variant/30 hover:border-outline text-outline hover:text-on-surface flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" type="button" disabled={!previewReady} onClick={() => { void cancelFlow() }}>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
                <span>{t('Clear')}</span>
              </button>
            </div>

            {/* Total cost summary breakdown */}
            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex items-center justify-between text-xs font-normal">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[18px]" aria-hidden="true">calculate</span>
                <span className="text-outline">{t('Calculated Pipeline Cost:')}</span>
              </div>
              <div className="text-right">
                <span className="text-on-surface font-semibold">{estimatedMediaCredits == null ? t('Final cost is calculated by the server') : t('Estimated media cost: {cost} Credits', { cost: estimatedMediaCredits })}</span>
              </div>
            </div>
          </section>

          {/* Dispatch & Scheduling */}
          {previewReady ? (
            <section className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <span className="text-sm font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">schedule_send</span>
                  {t('Dispatch & Scheduling')}
                </span>
              </div>

              <SchedulePicker
                value={session.scheduledFor}
                onChange={(iso) => { update({ scheduledFor: iso }); setInvalidSchedule(false) }}
                invalid={invalidSchedule}
                errorMessage={t('Choose a future date and time first.')}
                t={t}
                language={language}
              />

              {!accountReady && (
                <div className="rounded-lg border border-status-warning/40 bg-status-warning/10 p-3 text-xs text-status-warning" role="status">
                  <strong>{t('Publishing is not ready')}</strong>
                  <ul className="mt-1 list-disc pl-4">
                    {(publishReadiness.companyId === currentCompany.id && publishReadiness.errors.length
                      ? publishReadiness.errors
                      : [t('Checking connected accounts…')]).map((message) => <li key={message}>{message}</li>)}
                  </ul>
                  <button className="mt-2 underline" type="button" onClick={() => setReadinessVersion((value) => value + 1)}>{t('Check again')}</button>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  className="w-full h-12 rounded-xl bg-primary-container hover:bg-[#ea580c] text-on-primary font-semibold text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(249,115,22,0.45)] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  disabled={!accountReady || session.state === 'scheduled' || !session.workflowId}
                  onClick={() => { void schedule() }}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">event_available</span>
                  {session.state === 'scheduled' ? t('Scheduled') : t('Schedule Publication')}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button className="h-10 rounded-lg bg-surface-container border border-outline-variant/40 hover:border-outline text-on-surface-variant hover:text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors" type="button" onClick={saveDraft}>
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">save</span>
                    {t('Save draft')}
                  </button>
                  <button className="h-10 rounded-lg bg-surface-container border border-outline-variant/40 hover:border-outline text-on-surface-variant hover:text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!accountReady || !session.workflowId} type="button" onClick={() => { void publishNow() }}>
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">send</span>
                    {t('Publish now')}
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-5 shadow-2xl">
              <p className="text-xs font-normal text-outline">{t('Approved preview becomes schedulable here.')}</p>
            </section>
          )}

          {/* Activity */}
          <section className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <span className="text-sm font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">history</span>
                {t('Activity')}
              </span>
            </div>
            <ol className="flex flex-col gap-2 list-none p-0 m-0" aria-live="polite">
              {session.activity.map((entry, index) => (
                <li key={`${index}-${entry.code}`} className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-xs font-normal text-on-surface-variant break-words">
                  {activity(entry)}
                </li>
              ))}
            </ol>
          </section>

          <p className="text-xs font-normal text-outline text-center pb-4">
            {t('Ideas and preview generation are live on the platform. Publishing keeps honest limits until social accounts are connected.')}
          </p>
        </div>
      </div>
    </div>
  )
}


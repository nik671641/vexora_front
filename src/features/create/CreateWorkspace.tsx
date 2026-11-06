import { useEffect, useState } from 'react'
import type { ActivityCode, AiModel, Company } from '../../shared/types/product'
import { useI18n, outputLanguageForInterface } from '../../i18n/context'
import {
  appendActivity, briefForBackend, captionFromIdea, createInitialSession,
  hashtagsFromIdea, languageFromLabel, mediaTypeToValue, draftDataFromSession, type AspectRatio, type CreateSession,
} from './createSession'
import {
  approveWorkflow, attachReference, cancelWorkflow, createWorkflow,
  editWorkflow, generateIdea as generateIdeaApi, getWorkflow, publishWorkflow, regenerateWorkflow, scheduleWorkflow, saveDraft as saveWorkflowDraft,
} from '../../api/workflows'
import type { Workflow } from '../../api/workflows'
import { listModels } from '../../api/models'
import { createReference } from '../../api/references'
import { testPublishReadiness } from '../../api/accounts'
import { ApiError } from '../../api/errors'
import { updateContent } from '../../api/content'
import { ContentStudioView } from './ContentStudioView'


type SessionUpdate = (current: CreateSession) => CreateSession
export type AutosaveStatus = {
  state: 'idle' | 'saving' | 'saved' | 'error'
  savedAt?: string
  message?: string
}
const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

export function CreateWorkspace({
  currentCompany, session, onSessionChange, companies, onCompanyChange, autosaveStatus, onContentSaved,
}: {
  currentCompany: Company
  session: CreateSession
  onSessionChange: (companyId: string, update: SessionUpdate) => void
  companies: Company[]
  onCompanyChange: (companyId: string) => void
  autosaveStatus: AutosaveStatus
  onContentSaved: () => Promise<void>
}) {
  const { t, language, formatDateTime } = useI18n()
  const companyId = currentCompany.id ?? currentCompany.name
  const [invalidSchedule, setInvalidSchedule] = useState(false)
  const [workflowError, setWorkflowError] = useState<string | null>(null)
  const [pollVersion, setPollVersion] = useState(0)
  const [generationStatus, setGenerationStatus] = useState<{ workflowId: string; phase: 'queued' | 'running' | 'retrying' | 'reconnecting' } | null>(null)
  const [availableModels, setAvailableModels] = useState<AiModel[]>([])
  const [readinessVersion, setReadinessVersion] = useState(0)
  const [manualSaveState, setManualSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [publishReadiness, setPublishReadiness] = useState<{
    companyId: string
    ready: boolean
    errors: string[]
  }>({ companyId: '', ready: false, errors: [] })
  const mediaModels = availableModels.filter((item) => item.media === session.mediaType)
  const preferredModel = session.mediaType === 'Image' ? currentCompany.preferredImageModel : currentCompany.preferredVideoModel
  const effectiveModelId = session.modelId && mediaModels.some((item) => item.name === session.modelId)
    ? session.modelId
    : (mediaModels.find((item) => item.ready && item.name === preferredModel)?.name ?? mediaModels.find((item) => item.ready)?.name ?? '')
  const selectedModelRow = mediaModels.find((item) => item.name === effectiveModelId)
  const supportedDurations = selectedModelRow?.generation_options?.durations ?? []
  const supportedResolutions = selectedModelRow?.generation_options?.resolutions ?? []
  const effectiveDuration = session.mediaType === 'Video' && supportedDurations.length
    ? (supportedDurations.includes(session.durationSec ?? -1) ? session.durationSec : supportedDurations[0])
    : session.durationSec
  const effectiveResolution = supportedResolutions.includes(session.videoResolution) ? session.videoResolution : ''
  const effectiveSession = { ...session, durationSec: effectiveDuration, videoResolution: effectiveResolution }
  const accountReady = publishReadiness.companyId === currentCompany.id && publishReadiness.ready
  const canGenerate = Boolean(session.objective) && session.platforms.length > 0 && Boolean(selectedModelRow?.ready)
  const estimatedMediaCredits = (() => {
    if (!selectedModelRow) return null
    if (session.mediaType === 'Video' && selectedModelRow.price_per_sec != null && effectiveDuration) {
      return Math.ceil(Number(selectedModelRow.price_per_sec) * effectiveDuration * 100)
    }
    const amount = /\$\s*(\d+(?:\.\d+)?)/.exec(selectedModelRow.price)?.[1]
    return amount ? Math.ceil(Number(amount) * 100) : null
  })()
  const autosaveLabel = session.state !== 'draft' ? t('Saved') : autosaveStatus.state === 'saving'
    ? t('Saving draft…')
    : autosaveStatus.state === 'saved' && autosaveStatus.savedAt
      ? t('Saved at {time}', { time: formatDateTime(autosaveStatus.savedAt) })
      : autosaveStatus.state === 'error'
        ? t('Draft not saved')
        : t('Autosave ready')

  function pickModel(name: string) {
    const row = mediaModels.find((model) => model.name === name)
    if (!row || session.state !== 'draft') return
    const duration = row.min_duration_sec != null && row.max_duration_sec != null
      ? Math.min(Math.max(session.durationSec ?? row.max_duration_sec, row.min_duration_sec), row.max_duration_sec)
      : null
    const durations = row.generation_options?.durations ?? []
    const resolutions = row.generation_options?.resolutions ?? []
    const ratios = row.generation_options?.aspect_ratios ?? []
    update({
      modelId: row.name,
      durationSec: durations.length ? (durations.includes(session.durationSec ?? -1) ? session.durationSec : durations[0]) : duration,
      videoResolution: resolutions.includes(session.videoResolution) ? session.videoResolution : '',
      aspectRatio: ratios.length && !ratios.includes(session.aspectRatio) ? '9:16' as AspectRatio : session.aspectRatio,
    })
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
      let attempt = 0
      let failedChecks = 0
      while (!cancelled) {
        await sleep(attempt++ < 15 ? 1600 : 5000)
        if (cancelled) return
        let wf: Workflow
        const requestController = new AbortController()
        const stopRequest = () => requestController.abort()
        controller.signal.addEventListener('abort', stopRequest, { once: true })
        const requestTimeout = window.setTimeout(stopRequest, 15000)
        try {
          wf = await getWorkflow(workflowId, requestController.signal)
          if (cancelled) return
          failedChecks = 0
          setWorkflowError(null)
          setGenerationStatus({ workflowId, phase: wf.generation_status?.phase ?? 'queued' })
        } catch (error) {
          if (cancelled) return
          if (error instanceof ApiError && (error.kind === 'not_found' || error.kind === 'permission')) {
            setWorkflowError(error.message)
            return
          }
          if (++failedChecks >= 3) setGenerationStatus({ workflowId, phase: 'reconnecting' })
          continue
        } finally {
          window.clearTimeout(requestTimeout)
          controller.signal.removeEventListener('abort', stopRequest)
        }
        if (wf.state !== expected) {
          finish(wf, expected === 'researching' ? 'researchFinished' : 'previewReady')
          return
        }
      }
    })()

    return () => { cancelled = true; controller.abort() }
  }, [session.state, session.workflowId, companyId, onSessionChange, currentCompany, t, pollVersion])

  function update(patch: Partial<CreateSession>) {
    setManualSaveState('idle')
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
          duration_sec: effectiveDuration,
          reference_ids: session.referenceIds ?? [],
          draft_data: draftDataFromSession(effectiveSession),
        })
        workflowId = created.id
        onSessionChange(companyId, (current) => ({ ...current, workflowId: workflowId!, modelId: effectiveModelId }))
      } else {
        await saveWorkflowDraft(workflowId, {
          brief: briefForBackend(session),
          media_type: mediaTypeToValue(session.mediaType),
          content_language: languageFromLabel(session.language),
          model_id: effectiveModelId,
          aspect_ratio: session.aspectRatio,
          duration_sec: effectiveDuration,
          draft_data: draftDataFromSession(effectiveSession),
        })
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

  async function saveDraft() {
    if (manualSaveState === 'saving') return
    setWorkflowError(null)
    setManualSaveState('saving')
    try {
      const payload = {
        brief: briefForBackend(session),
        media_type: mediaTypeToValue(session.mediaType),
        content_language: languageFromLabel(session.language),
        model_id: effectiveModelId || undefined,
        aspect_ratio: session.aspectRatio,
        duration_sec: effectiveDuration,
        draft_data: draftDataFromSession(effectiveSession),
      }
      let workflow: Workflow
      if (!session.workflowId) {
        workflow = await createWorkflow({
          ...payload,
          company_id: currentCompany.id as string,
          reference_ids: session.referenceIds,
        })
      } else if (session.state === 'draft') {
        workflow = await saveWorkflowDraft(session.workflowId, payload)
      } else {
        workflow = await getWorkflow(session.workflowId)
      }

      if (workflow.content_item_id) {
        await updateContent(workflow.content_item_id, {
          topic: (session.hook || session.ideaHook || session.ideaTitle || session.brief).trim().slice(0, 500),
          caption: session.caption || session.ideaSummary,
          hashtags: session.hashtags.split(/\s+/).filter(Boolean),
        })
      }

      const savedAt = new Date().toISOString()
      onSessionChange(companyId, (current) => appendActivity({
        ...current,
        workflowId: workflow.id,
        savedAt,
      }, 'draftSaved'))
      await onContentSaved()
      setManualSaveState('saved')
    } catch (error) {
      setManualSaveState('idle')
      handleApiError(error)
    }
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


  return (
    <ContentStudioView
      company={currentCompany}
      companies={companies}
      onCompanyChange={onCompanyChange}
      session={effectiveSession}
      models={mediaModels}
      modelId={effectiveModelId}
      autosaveLabel={autosaveLabel}
      autosaveStatus={session.state === 'draft' ? autosaveStatus.state : 'saved'}
      manualSaveState={manualSaveState}
      estimatedCredits={estimatedMediaCredits}
      error={workflowError}
      generationPhase={generationStatus?.workflowId === session.workflowId ? generationStatus.phase : 'queued'}
      onCheckStatus={() => setPollVersion((value) => value + 1)}
      canGenerate={canGenerate}
      previewReady={previewReady}
      accountReady={accountReady}
      readinessErrors={publishReadiness.companyId === currentCompany.id ? publishReadiness.errors : []}
      invalidSchedule={invalidSchedule}
      onUpdate={update}
      onModelChange={pickModel}
      onTogglePlatform={togglePlatform}
      onFiles={handleFiles}
      onGenerate={() => { void startIdeaGeneration() }}
      onApprove={() => { void approveIdea() }}
      onRegenerate={() => { void regenerate() }}
      onCancel={() => { void cancelFlow() }}
      onSave={() => { void saveDraft() }}
      onSchedule={() => { void schedule() }}
      onPublish={() => { void publishNow() }}
      onReset={resetSession}
      onReadinessCheck={() => setReadinessVersion((value) => value + 1)}
    />
  )
}


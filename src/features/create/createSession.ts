import type { WorkflowState } from '../../api/workflows'
import type { ActivityCode, ActivityEvent, Company } from '../../shared/types/product'

export type CreateSession = {
  id: string
  state: WorkflowState
  mediaType: 'Image' | 'Video'
  brief: string
  language: string
  referenceNames: string[]
  referenceIds: string[]
  ideaTitle: string
  ideaSummary: string
  ideaHook: string
  ideaScene: string
  caption: string
  hashtags: string
  scheduledFor: string
  savedAt: string
  activity: ActivityEvent[]
  // Model chosen at content creation for the selected output type (display name,
  // e.g. "Seedance 2.5"). Sent as workflow.model_id and resolved server-side.
  modelId: string
  // Actual generated media URL + media type (real backend preview, empty in the
  // browser-only demo). Populated from workflow.media_asset_* on preview ready.
  mediaUrl: string
  generatedMediaType: 'image' | 'video' | ''
  // Backend workflow id (empty in the browser-only demo). Filled once a real
  // workflow is created so idea/approve/regenerate hit the API.
  workflowId: string
  // Studio fields surfaced in the new UI. The campaign objective and target
  // platforms enrich the brief sent to the backend; aspect ratio and the
  // advanced fields only shape the local preview canvas for now.
  objective: string
  platforms: string[]
  aspectRatio: AspectRatio
  // Selected video duration in seconds for video models (clamped to the chosen
  // model's min/max window in the UI). Sent as workflow.duration_sec; the media
  // pipeline uses it instead of the old hardcoded default.
  durationSec: number | null
  videoResolution: string
  seed: string
  motionStrength: string
  cfgGuidance: string
  negativePrompt: string
  // Attention hook and call-to-action surfaced in the copy editor. They are
  // persisted into the editable caption when the preview becomes ready.
  hook: string
  cta: string
}

export type AspectRatio = '1:1' | '9:16' | '16:9' | '4:5'

function createSessionId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()

  // getRandomValues works on local-network HTTP, where randomUUID is unavailable.
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  return `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function createInitialSession(_company: Company, language = 'English'): CreateSession {
  return {
    id: createSessionId(),
    state: 'draft',
    mediaType: 'Image',
    brief: '',
    language,
    referenceNames: [],
    referenceIds: [],
    ideaTitle: '',
    ideaSummary: '',
    ideaHook: '',
    ideaScene: '',
    caption: '',
    hashtags: '',
    scheduledFor: '',
    savedAt: '',
    activity: [{ code: 'briefStarted' }],
    modelId: '',
    mediaUrl: '',
    generatedMediaType: '',
    workflowId: '',
    objective: '',
    platforms: ['Instagram', 'Facebook'],
    aspectRatio: '9:16',
    durationSec: null,
    videoResolution: '',
    seed: '482910',
    motionStrength: '6.5',
    cfgGuidance: '7.0',
    negativePrompt: 'blurry, amateur, deformed roofing, watermark, cartoonish, low resolution',
    hook: '',
    cta: '',
  }
}

/** Map the UI media type to the backend enum value used by /api/workflows. */
export function mediaTypeToValue(mediaType: CreateSession['mediaType']): 'image' | 'video' {
  return ({ Image: 'image', Video: 'video' } as const)[mediaType]
}

/** Map the UI language label to the backend content_language code. */
export function languageFromLabel(label: string): 'en' | 'ru' | 'ro' {
  return ({ English: 'en', Russian: 'ru', Romanian: 'ro' } as const)[label] ?? 'en'
}

/**
 * Compose the brief actually sent to the backend from the studio fields so the
 * new UI (objective + platform targets) genuinely influences generation, while
 * the plain text brief keeps its exact wording for display and editing.
 */
export function briefForBackend(session: CreateSession): string {
  const parts = [session.brief.trim()]
  if (session.objective) parts.push(`Campaign objective: ${session.objective}`)
  if (session.platforms.length) parts.push(`Platform targets: ${session.platforms.join(', ')}`)
  if (session.aspectRatio) parts.push(`Aspect ratio: ${session.aspectRatio}`)
  return parts.filter(Boolean).join('\n')
}

/** Build an editable caption from the approved idea (local draft, not sent). */
export function captionFromIdea(session: CreateSession, company: Company): string {
  const callToAction = session.language === 'Russian'
    ? `Подробнее — в ${company.name}.`
    : session.language === 'Romanian'
      ? `Află mai multe de la ${company.name}.`
      : `Learn more from ${company.name}.`
  return `${session.ideaHook} ${session.ideaSummary} ${callToAction}`.trim()
}

/** Build local hashtags from the approved idea (local draft, not sent). */
export function hashtagsFromIdea(session: CreateSession, company: Company): string {
  return `#${company.name.replace(/[^a-zA-Z0-9]/g, '')} #${session.mediaType === 'Video' ? 'video' : 'creative'}`
}

export function appendActivity(session: CreateSession, code: ActivityCode, count?: number): CreateSession {
  return { ...session, activity: [{ code, count }, ...session.activity].slice(0, 8) }
}

/* ------------------------------------------------------------------ */
/* Autosave: serialize the studio session into workflow.draft_data and  */
/* rebuild a session from a persisted draft workflow.                  */
/* ------------------------------------------------------------------ */

/** Serializable snapshot of the create-studio fields worth persisting. */
export function draftDataFromSession(session: CreateSession): Record<string, unknown> {
  return {
    mediaType: session.mediaType,
    brief: session.brief,
    language: session.language,
    referenceNames: session.referenceNames,
    referenceIds: session.referenceIds,
    objective: session.objective,
    platforms: session.platforms,
    aspectRatio: session.aspectRatio,
    durationSec: session.durationSec,
    videoResolution: session.videoResolution,
    modelId: session.modelId,
    seed: session.seed,
    motionStrength: session.motionStrength,
    cfgGuidance: session.cfgGuidance,
    negativePrompt: session.negativePrompt,
    hook: session.hook,
    cta: session.cta,
    caption: session.caption,
    hashtags: session.hashtags,
    scheduledFor: session.scheduledFor,
  }
}

type PersistedDraft = Partial<CreateSession>

/** Rebuild a CreateSession from a persisted workflow (its scalar fields +
 *  the structured `draft_data` snapshot). Missing values fall back to the
 *  initial session so the returned object is always fully populated. */
export function sessionFromWorkflow(workflow: {
  id: string
  state: CreateSession['state'] | (string & {})
  media_type?: string
  content_language?: string
  brief?: string
  model_id?: string
  aspect_ratio?: string
  duration_sec?: number | null
  draft_data?: Record<string, unknown> | null
  idea?: { title?: string; summary?: string; hook?: string; scene?: string } | null
  media_asset_url?: string | null
  media_asset_media_type?: 'image' | 'video' | null
}, company: Company, fallbackLanguage: string): CreateSession {
  const raw = (workflow.draft_data ?? {}) as PersistedDraft
  const base = createInitialSession(company, fallbackLanguage)
  const languageLabel = workflow.content_language === 'ru'
    ? 'Russian'
    : workflow.content_language === 'ro'
      ? 'Romanian'
      : 'English'
  return {
    ...base,
    id: workflow.id,
    state: workflow.state as CreateSession['state'],
    mediaType: (raw.mediaType as CreateSession['mediaType']) ?? (workflow.media_type === 'video' ? 'Video' : 'Image'),
    brief: raw.brief ?? workflow.brief ?? '',
    language: raw.language ?? languageLabel,
    referenceNames: raw.referenceNames ?? [],
    referenceIds: raw.referenceIds ?? [],
    objective: raw.objective ?? '',
    platforms: raw.platforms ?? base.platforms,
    aspectRatio: (raw.aspectRatio as CreateSession['aspectRatio']) ?? (workflow.aspect_ratio as CreateSession['aspectRatio']) ?? base.aspectRatio,
    durationSec: raw.durationSec ?? workflow.duration_sec ?? null,
    videoResolution: raw.videoResolution ?? '',
    modelId: raw.modelId ?? workflow.model_id ?? '',
    seed: raw.seed ?? base.seed,
    motionStrength: raw.motionStrength ?? base.motionStrength,
    cfgGuidance: raw.cfgGuidance ?? base.cfgGuidance,
    negativePrompt: raw.negativePrompt ?? base.negativePrompt,
    hook: raw.hook ?? '',
    cta: raw.cta ?? '',
    caption: raw.caption ?? '',
    hashtags: raw.hashtags ?? '',
    scheduledFor: raw.scheduledFor ?? '',
    ideaTitle: workflow.idea?.title ?? raw.ideaTitle ?? '',
    ideaSummary: workflow.idea?.summary ?? raw.ideaSummary ?? '',
    ideaHook: workflow.idea?.hook ?? raw.ideaHook ?? '',
    ideaScene: workflow.idea?.scene ?? raw.ideaScene ?? '',
    mediaUrl: workflow.media_asset_url ?? '',
    generatedMediaType: workflow.media_asset_media_type ?? '',
    workflowId: workflow.id,
  }
}

export type ViewId =
  | 'dashboard'
  | 'create'
  | 'companies'
  | 'content'
  | 'approvals'
  | 'calendar'
  | 'references'
  | 'models'
  | 'accounts'
  | 'settings'

export type AccountPageId = 'general' | 'plan' | 'credits' | 'usage' | 'support'

export type StatusTone = 'good' | 'warn' | 'danger' | 'neutral'

export type DemoUser = { id?: string; name: string; email: string; avatarUrl?: string; activeCompanyId?: string | null }

export type Company = {
  id?: string
  role?: 'owner' | 'editor' | 'viewer'
  name: string
  site: string
  status: string
  tone: string
  posts: number
  readiness: number
  description?: string
  products?: string
  services?: string
  advantages?: string
  targetAudience?: string
  competitors?: string
  countries?: string
  brandStyle?: string
  visualRules?: string
  logoUrl?: string
  logoImageUrl?: string
  links?: string
  socialAccounts?: string
  preferredImageModel?: string
  preferredVideoModel?: string
  /** AI production credit balance, server-controlled. */
  credits?: number
}

export type WorkflowStep = {
  label: string
  state: 'done' | 'active' | 'next'
}

export type ReferenceItem = {
  name: string
  type: string
  state: string
}

export type ActivityCode =
  | 'briefStarted' | 'researchStarted' | 'researchFinished' | 'generationStarted'
  | 'previewReady' | 'filesAttached' | 'ideaRegenerated' | 'workflowCancelled'
  | 'newIdeaRequested' | 'draftSaved' | 'scheduledDemo' | 'publishedDemo'
  | 'contentEdited' | 'sampleScheduled' | 'sampleApproved' | 'sampleWaiting'
  | 'sampleFailed'

export type ActivityEvent = { code: ActivityCode; count?: number }

export type ContentItem = {
  id: string
  source: 'sample' | 'local'
  title: string
  company: string
  status: string
  type: string
  time: string
  brief?: string
  idea?: string
  caption?: string
  hashtags?: string
  model?: string
  language?: string
  scheduledFor?: string
  mediaUrl?: string
  thumbnailUrl?: string
  activity?: ActivityEvent[]
  /** Backend workflow id that produced this content item (draft resume). */
  workflowId?: string
}

export type AiModel = {
  name: string
  provider: string
  media: string
  price: string
  ready: boolean
  /** Workflow kind: text_to_image / text_to_video / image_to_video. */
  workflow?: string
  /** Structured catalog metadata (family -> version -> mode) so the selector
   *  can group models like a real provider catalog. */
  family?: string
  version?: string
  mode?: string
  resolution?: string
  /** Video duration window (seconds); undefined for image models. */
  min_duration_sec?: number | null
  max_duration_sec?: number | null
  /** USD per second (discounted paid price and pre-discount base). */
  price_per_sec?: number | null
  base_price_per_sec?: number | null
}

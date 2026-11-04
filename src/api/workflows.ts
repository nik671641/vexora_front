import { apiRequest } from './client'

export type WorkflowState =
  | 'draft'
  | 'awaiting_company'
  | 'awaiting_company_confirmation'
  | 'researching'
  | 'idea_ready'
  | 'generating'
  | 'preview_ready'
  | 'publishing'
  | 'scheduled'
  | 'published'
  | 'failed'
  | 'cancelled'

export type Workflow = {
  id: string
  company_id: string
  created_by_id?: string
  state: WorkflowState
  media_type: 'auto' | 'image' | 'video'
  content_language?: string
  brief: string
  model_id?: string
  aspect_ratio?: string
  duration_sec?: number | null
  draft_data?: Record<string, unknown>
  research?: {
    focus: string
    competitors?: string[]
    notes?: string[]
    language?: string
  }
  idea?: {
    title: string
    summary: string
    hook: string
    scene: string
  }
  content_item_id?: string | null
  media_asset_url?: string | null
  media_asset_media_type?: 'image' | 'video' | null
  allowed_actions?: string[]
  last_error_code?: string
  last_error_message?: string
  created_at?: string
  updated_at?: string
}

export type WorkflowEvent = {
  id: string
  type: string
  status: string
  progress?: number | null
  message?: string
  payload?: Record<string, unknown>
  created_at: string
}

export function listWorkflows(companyId?: string, signal?: AbortSignal) {
  const query = companyId ? `?company_id=${companyId}` : ''
  return apiRequest<Workflow[]>(`/api/workflows${query}`, { signal, retrySafeGet: true })
}

export function createWorkflow(payload: {
  company_id: string
  media_type: string
  brief: string
  content_language?: string
  model_id?: string
  aspect_ratio?: string
  duration_sec?: number | null
  reference_ids?: string[]
  draft_data?: Record<string, unknown>
}) {
  return apiRequest<Workflow>('/api/workflows', { method: 'POST', body: payload })
}

/** Autosave the create-studio session into an existing draft workflow. */
export function saveDraft(workflowId: string, payload: {
  brief?: string
  media_type?: string
  content_language?: string
  model_id?: string
  aspect_ratio?: string
  duration_sec?: number | null
  draft_data?: Record<string, unknown>
}) {
  return apiRequest<Workflow>(`/api/workflows/${workflowId}`, { method: 'PATCH', body: payload })
}

export function attachReference(workflowId: string, referenceId: string) {
  return apiRequest<Workflow>(`/api/workflows/${workflowId}/references`, {
    method: 'POST',
    body: { reference_id: referenceId },
  })
}

export function getWorkflow(workflowId: string, signal?: AbortSignal) {
  return apiRequest<Workflow>(`/api/workflows/${workflowId}`, { signal, retrySafeGet: true })
}

export function listWorkflowEvents(workflowId: string, signal?: AbortSignal) {
  return apiRequest<WorkflowEvent[]>(`/api/workflows/${workflowId}/events`, { signal, retrySafeGet: true })
}

export function generateIdea(workflowId: string) {
  return apiRequest<Workflow>(`/api/workflows/${workflowId}/idea`, { method: 'POST' })
}

export function approveWorkflow(workflowId: string) {
  return apiRequest<Workflow>(`/api/workflows/${workflowId}/approve`, { method: 'POST' })
}

export function editWorkflow(
  workflowId: string,
  payload?: { feedback?: string; idea?: { title: string; summary: string; hook: string; scene: string } },
) {
  return apiRequest<Workflow>(`/api/workflows/${workflowId}/edit`, {
    method: 'POST',
    body: payload ?? {},
  })
}

export function regenerateWorkflow(workflowId: string) {
  return apiRequest<Workflow>(`/api/workflows/${workflowId}/regenerate`, { method: 'POST' })
}

export function cancelWorkflow(workflowId: string) {
  return apiRequest<Workflow>(`/api/workflows/${workflowId}/cancel`, { method: 'POST' })
}

export function publishWorkflow(workflowId: string) {
  return apiRequest<Workflow>(`/api/workflows/${workflowId}/publish`, { method: 'POST' })
}

export function scheduleWorkflow(workflowId: string, scheduled_for: string) {
  return apiRequest<Workflow>(`/api/workflows/${workflowId}/schedule`, {
    method: 'POST',
    body: { scheduled_for },
  })
}

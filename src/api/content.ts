import type { ContentItem } from '../shared/types/product'
import { API_BASE_URL, apiRequest } from './client'

export type ContentPatch = {
  caption?: string
  hashtags?: string[]
  scheduled_for?: string
}

/** Raw shape returned by the backend content endpoints. */
type ContentItemDto = {
  id: string
  company_id: string
  topic: string
  idea?: unknown
  research?: unknown
  brief?: string
  caption: string
  hashtags: string[]
  media_type: string
  media_provider: string
  model_id?: string
  media_prompt?: string
  media_asset_id?: string | null
  thumbnail_asset_id?: string | null
  scheduled_for?: string | null
  publication_status: string
  source_url?: string
  external_post_id?: string
  workflow_id?: string | null
  created_at: string
  updated_at: string
}

const contentStatusDisplay: Record<string, string> = {
  draft: 'Draft',
  approved: 'Approved',
  scheduled: 'Scheduled',
  publishing: 'Publishing',
  published: 'Published',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

const mediaTypeDisplay: Record<string, string> = {
  image: 'Image',
  video: 'Video',
}

export function mapContentItem(dto: ContentItemDto, companyName: string): ContentItem {
  const status = contentStatusDisplay[dto.publication_status] ?? dto.publication_status
  const type = mediaTypeDisplay[dto.media_type] ?? 'Image'
  return {
    id: dto.id,
    source: 'local',
    title: dto.topic || dto.caption?.slice(0, 70) || 'Untitled content',
    company: companyName,
    status,
    type: type as ContentItem['type'],
    time: dto.scheduled_for ? new Date(dto.scheduled_for).toLocaleString() : '',
    brief: dto.topic,
    idea: typeof dto.idea === 'string' ? dto.idea : (dto.idea as { summary?: string } | null)?.summary,
    caption: dto.caption,
    hashtags: dto.hashtags?.join(' ') ?? '',
    model: dto.model_id || dto.media_provider || '',
    language: '',
    scheduledFor: dto.scheduled_for ?? undefined,
    mediaUrl: dto.media_asset_id ? `${API_BASE_URL}/api/media/assets/${dto.media_asset_id}` : undefined,
    thumbnailUrl: dto.thumbnail_asset_id ? `${API_BASE_URL}/api/media/assets/${dto.thumbnail_asset_id}` : undefined,
    activity: [],
    workflowId: dto.workflow_id ?? undefined,
  }
}

export function listContent(signal?: AbortSignal) {
  return apiRequest<ContentItemDto[]>('/api/content', { signal, retrySafeGet: true })
}

export function getContent(contentId: string, signal?: AbortSignal) {
  return apiRequest<ContentItemDto>(`/api/content/${contentId}`, { signal, retrySafeGet: true })
}

export function updateContent(contentId: string, payload: ContentPatch) {
  return apiRequest<ContentItemDto>(`/api/content/${contentId}`, { method: 'PATCH', body: payload })
}

export function approveContent(contentId: string) {
  return apiRequest<ContentItemDto>(`/api/content/${contentId}/approve`, { method: 'POST' })
}

export function deleteContent(contentId: string) {
  return apiRequest<void>(`/api/content/${contentId}`, { method: 'DELETE' })
}

export function duplicateContent(contentId: string) {
  return apiRequest<ContentItemDto>(`/api/content/${contentId}/duplicate`, { method: 'POST' })
}

export function publishContent(contentId: string) {
  return apiRequest<ContentItemDto>(`/api/content/${contentId}/publish`, { method: 'POST' })
}

export function scheduleContent(contentId: string, scheduled_for: string) {
  return apiRequest<ContentItemDto>(`/api/content/${contentId}/schedule`, {
    method: 'POST',
    body: { scheduled_for },
  })
}

import { apiRequest } from './client'

export type ReferenceDto = {
  id: string
  kind: 'photo' | 'file' | 'voice'
  original_file_name: string
  size_bytes: number
  mime_type: string
  checksum: string
  caption: string
  text_excerpt: string
  summary: string
  metadata: Record<string, unknown>
  created_at: string
}

export function listReferences(signal?: AbortSignal) {
  return apiRequest<ReferenceDto[]>('/api/references', { signal, retrySafeGet: true })
}

export function createReference(payload: FormData) {
  return apiRequest<ReferenceDto>('/api/references', { method: 'POST', body: payload })
}

export function getReference(referenceId: string, signal?: AbortSignal) {
  return apiRequest<ReferenceDto>(`/api/references/${referenceId}`, { signal, retrySafeGet: true })
}

export function deleteReference(referenceId: string) {
  return apiRequest<void>(`/api/references/${referenceId}`, { method: 'DELETE' })
}

export function clearReferences() {
  return apiRequest<void>('/api/references', { method: 'DELETE' })
}

export function uploadPhotos(payload: FormData) {
  return apiRequest<ReferenceDto[]>('/api/uploads/photos', { method: 'POST', body: payload })
}

export function uploadFiles(payload: FormData) {
  return apiRequest<ReferenceDto[]>('/api/uploads/files', { method: 'POST', body: payload })
}

export function uploadVoice(payload: FormData) {
  return apiRequest<ReferenceDto>('/api/uploads/voice', { method: 'POST', body: payload })
}

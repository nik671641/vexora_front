import type { AiModel } from '../shared/types/product'
import { apiRequest } from './client'

export function listModels(mediaType?: 'image' | 'video', signal?: AbortSignal) {
  const query = mediaType ? `?media_type=${mediaType}` : ''
  return apiRequest<AiModel[]>(`/api/models${query}`, { signal, retrySafeGet: true })
}

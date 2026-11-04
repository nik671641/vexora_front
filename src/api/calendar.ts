import type { ContentItem } from '../shared/types/product'
import { apiRequest } from './client'

export function listCalendarItems(signal?: AbortSignal) {
  return apiRequest<ContentItem[]>('/api/calendar', { signal, retrySafeGet: true })
}

export function updateCalendarItem(contentId: string, payload: { scheduled_for: string }) {
  return apiRequest<ContentItem>(`/api/calendar/items/${contentId}`, {
    method: 'PATCH',
    body: payload,
  })
}

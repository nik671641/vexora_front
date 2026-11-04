import type { StatusTone } from '../types/product'

export function toneForStatus(status: string): StatusTone {
  if (status === 'Failed' || status === 'Cancelled') return 'danger'
  if (status === 'Approved' || status === 'Scheduled' || status === 'Preview ready' || status === 'Published') return 'good'
  return 'neutral'
}

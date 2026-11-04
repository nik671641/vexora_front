import { apiRequest } from './client'

export type AccountConnection = {
  id: string
  provider: string
  platform: string
  account_id: string
  username?: string
  status: string
  publish_readiness: string
  last_error?: string
}

export function listAccountConnections(signal?: AbortSignal) {
  return apiRequest<AccountConnection[]>('/api/accounts/connections', { signal, retrySafeGet: true })
}

export function getCompanyAccounts(companyId: string, signal?: AbortSignal) {
  return apiRequest<AccountConnection[]>(`/api/companies/${companyId}/accounts`, {
    signal,
    retrySafeGet: true,
  })
}

export function updateCompanyAccounts(companyId: string, payload: { account_ids: string[] }) {
  return apiRequest<AccountConnection[]>(`/api/companies/${companyId}/accounts`, {
    method: 'PATCH',
    body: payload,
  })
}

export function testPublishReadiness(companyId: string) {
  return apiRequest<{ ready: boolean; errors: string[] }>('/api/accounts/test-publish-readiness', {
    method: 'POST',
    body: { company_id: companyId },
  })
}

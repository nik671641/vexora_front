import { apiRequest } from './client'
import type { DemoUser } from '../shared/types/product'

export type UserProfile = {
  id: string
  email: string
  name: string
  avatar_url: string | null
  interface_language: 'en' | 'ru' | 'ro'
  active_company_id: string | null
}

export function toWorkspaceUser(profile: UserProfile, refreshAvatar = false): DemoUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    activeCompanyId: profile.active_company_id,
    avatarUrl: profile.avatar_url
      ? `${profile.avatar_url}${refreshAvatar ? `?v=${Date.now()}` : ''}`
      : undefined,
  }
}

export function getCurrentUser(signal?: AbortSignal) {
  return apiRequest<UserProfile>('/api/me', { signal, retrySafeGet: true })
}

export function register(payload: { name: string; email: string; password: string }) {
  return apiRequest<UserProfile>('/api/auth/register', { method: 'POST', body: payload })
}

export function login(payload: { email: string; password: string }) {
  return apiRequest<UserProfile>('/api/auth/login', { method: 'POST', body: payload })
}

export function logout() {
  return apiRequest<void>('/api/auth/logout', { method: 'POST' })
}

export function updateProfile(payload: Partial<Pick<UserProfile, 'name' | 'email' | 'interface_language'>>) {
  return apiRequest<UserProfile>('/api/me', { method: 'PATCH', body: payload })
}

export function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<UserProfile>('/api/me/avatar', { method: 'POST', body: form })
}

export function removeAvatar() {
  return apiRequest<void>('/api/me/avatar', { method: 'DELETE' })
}

export function getHealth(signal?: AbortSignal) {
  return apiRequest<{ status: string }>('/api/health', { signal, retrySafeGet: true })
}

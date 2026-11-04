import { ApiError } from './errors'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  retrySafeGet?: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export { API_BASE_URL }

async function csrfToken(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/auth/csrf`, { credentials: 'include' })
  if (!response.ok) throw await responseError(response)
  const payload = (await response.json()) as { csrf_token: string }
  return payload.csrf_token
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, retrySafeGet, headers, ...init } = options
  const method = (init.method ?? 'GET').toUpperCase()
  const requestHeaders = new Headers(headers)
  if (body !== undefined && !(body instanceof FormData)) requestHeaders.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    try {
      requestHeaders.set('X-CSRFToken', await csrfToken())
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(error instanceof Error ? error.message : 'Network request failed', 'unknown')
    }
  }
  const request = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      method,
      headers: requestHeaders,
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
    })

  const response = await request().catch((error: unknown) => {
    throw new ApiError(error instanceof Error ? error.message : 'Network request failed', 'unknown')
  })

  if (response.status >= 500 && method === 'GET' && retrySafeGet) {
    const retryResponse = await request()
    return parseResponse<T>(retryResponse)
  }

  return parseResponse<T>(response)
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await responseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function responseError(response: Response): Promise<ApiError> {
  const fallback = `Request failed with status ${response.status}`
  const kind = kindForStatus(response.status)
  try {
    const payload = (await response.json()) as {
      message?: string
      error?: string | { code?: string; message?: string; details?: Record<string, unknown> }
    }
    if (typeof payload.error === 'object' && payload.error) {
      const detail = Object.values(payload.error.details ?? {})
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .find((value) => typeof value === 'string')
      return new ApiError(typeof detail === 'string' ? detail : payload.error.message ?? fallback, kind, response.status, payload.error.code)
    }
    return new ApiError(payload.message ?? payload.error ?? fallback, kind, response.status)
  } catch {
    return new ApiError(fallback, kind, response.status)
  }
}

function kindForStatus(status: number) {
  if (status === 400 || status === 422) return 'validation'
  if (status === 401 || status === 403) return 'permission'
  if (status === 404) return 'not_found'
  return 'unknown'
}

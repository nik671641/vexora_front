export type ApiErrorKind =
  | 'validation'
  | 'permission'
  | 'configuration'
  | 'provider_timeout'
  | 'temporary_provider'
  | 'publish'
  | 'upload'
  | 'not_found'
  | 'unknown'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly code?: string

  constructor(message: string, kind: ApiErrorKind, status?: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.code = code
  }
}

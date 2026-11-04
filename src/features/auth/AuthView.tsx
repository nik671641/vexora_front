import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { login, register, toWorkspaceUser, updateProfile } from '../../api/auth'
import { API_BASE_URL } from '../../api/client'
import { ApiError } from '../../api/errors'
import { useI18n, type InterfaceLanguage } from '../../i18n/context'
import type { TranslationKey } from '../../i18n/translations'
import type { DemoUser } from '../../shared/types/product'
import { Select } from '../../shared/components/Select'
import './AuthView.css'

type AuthMode = 'login' | 'register'
type Field = 'name' | 'email' | 'password' | 'confirmPassword'
type FieldErrors = Partial<Record<Field, TranslationKey>>

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
  { value: 'ro', label: 'RO' },
]

function SocialButton({ icon, label, onSso, provider }: { icon: ReactNode; label: string; onSso: (provider: 'google' | 'apple') => void; provider: 'google' | 'apple' }) {
  return (
    <button
      aria-label={label}
      className="auth-sso"
      onClick={() => onSso(provider)}
      type="button"
    >
      <span className="auth-sso-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

export function AuthView({
  initialMode = 'login', onBack, onEnter, onModeChange,
}: {
  initialMode?: AuthMode
  onBack: () => void
  onEnter: (user: DemoUser) => void
  onModeChange?: (mode: AuthMode) => void
}) {
  const { language, setLanguage, t } = useI18n()

  /** Map backend SSO error codes to friendly i18n messages (English fallback). */
  function ssoErrorMessage(code: string): string {
    const map: Record<string, TranslationKey> = {
      access_denied: 'Sign-in was cancelled. You can still use email to sign in.',
      invalid_state: 'Security check failed. Please try signing in again.',
      invalid_token: 'We could not verify your account with this provider. Try again or use email.',
      email_required: 'This provider did not share a verified email address. Use email or another account.',
      misconfigured: 'Social sign-in is not configured yet. Please use email for now.',
    }
    const key = map[code]
    return key ? t(key) : t('We could not sign you in with that provider. Please try again.')
  }

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(true)
  const [ssoNotice, setSsoNotice] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(() => {
    const query = window.location.hash.split('?')[1] ?? ''
    const error = new URLSearchParams(query).get('error')
    return error ? ssoErrorMessage(error) : null
  })
  const [pending, setPending] = useState(false)

  function switchMode(nextMode: AuthMode) {
    if (nextMode === mode) return
    setMode(nextMode)
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setErrors({})
    setServerError(null)
    setSsoNotice('')
    onModeChange?.(nextMode)
  }

  useEffect(() => {
    const query = window.location.hash.split('?')[1] ?? ''
    // The error lives in the URL because the provider bounces back to the app;
    // clear it so navigation and retries do not show a stale message.
    if (query) {
      const hash = window.location.hash.split('?')[0]
      window.history.replaceState(null, '', hash)
    }
  }, [])

  function handleSso(provider: 'google' | 'apple') {
    // Full browser redirect: the provider page opens, then the backend logs the
    // user in and bounces back here so the app can pick up the new session.
    window.location.assign(`${API_BASE_URL}/api/auth/social/${provider}/authorize`)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: FieldErrors = {}
    if (mode === 'register' && name.trim().length < 2) nextErrors.name = 'Enter at least 2 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Enter your password.'
    else if (mode === 'register' && password.length < 8) nextErrors.password = 'Use at least 8 characters.'
    if (mode === 'register' && password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    if (mode === 'register' && !agreed) nextErrors.confirmPassword = 'Please accept the Terms of Service.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setServerError(null)
    setPending(true)
    try {
      let profile = mode === 'register'
        ? await register({ name: name.trim(), email: email.trim(), password })
        : await login({ email: email.trim(), password })
      if (mode === 'register' && profile.interface_language !== language) {
        try {
          profile = await updateProfile({ interface_language: language })
        } catch {
          // The account exists and the session is active even if this optional preference fails.
        }
      } else if (mode === 'login') {
        setLanguage(profile.interface_language)
      }
      onEnter(toWorkspaceUser(profile))
    } catch (error) {
      if (error instanceof ApiError && error.code === 'invalid_credentials') {
        setServerError(t('Incorrect email or password.'))
      } else if (error instanceof ApiError && error.code === 'csrf_failed') {
        setServerError(t('Security check failed. Refresh the page and try again.'))
      } else if (error instanceof ApiError && error.code === 'rate_limited') {
        setServerError(t('Too many attempts. Please try again later.'))
      } else {
        setServerError(error instanceof Error ? error.message : 'Request failed')
      }
    } finally {
      setPending(false)
    }
  }

  const passwordStrength = (() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    return score
  })()

  const strengthLabel = passwordStrength === 0
    ? ''
    : passwordStrength <= 1
      ? t('Security: Weak')
      : passwordStrength === 2
        ? t('Security: Fair')
        : t('Security: Strong')

  const header = (
    <header className="auth-header">
      <a className="auth-brand" href="#top" onClick={(event) => { event.preventDefault(); onBack() }}>
        <span className="auth-brand-mark" aria-hidden="true">
          <img src="/vexora-logo.svg" alt="" width="76" height="76" draggable={false} />
        </span>
        <span>
          <span className="auth-brand-name">Vexora</span>
          <span className="auth-brand-tag">{t('Contractor AI')}</span>
        </span>
      </a>
      <div className="auth-header-right">
        <span className="auth-help-line">
          <span className="material-symbols-outlined" aria-hidden="true">support_agent</span>
          {t('Staff help')}
        </span>
        {mode === 'login'
          ? <a className="auth-header-cta" href="#register" onClick={(event) => { event.preventDefault(); switchMode('register') }}>{t('Create your account')}</a>
          : <a className="auth-header-cta" href="#signin" onClick={(event) => { event.preventDefault(); switchMode('login') }}>{t('Sign in')}</a>}
      </div>
    </header>
  )

  const footer = (
    <footer className="auth-footer">
      <div className="auth-footer-copy">{t('© 2026 Vexora Inc. All rights reserved.')}</div>
      <div className="auth-footer-links">
        <a href="#terms">{t('Terms of Service')}</a>
        <a href="#privacy">{t('Privacy Policy')}</a>
        <a href="#security">{t('Security Whitepaper')}</a>
        <span className="auth-footer-lang">
          <span className="material-symbols-outlined" aria-hidden="true">language</span>
          <Select
            id="auth-language"
            ariaLabel={t('Interface language')}
            className="gf-select--compact auth-language-select"
            hideChevron
            value={language}
            onChange={(value) => setLanguage(value as InterfaceLanguage)}
            options={LANGUAGE_OPTIONS}
          />
        </span>
      </div>
    </footer>
  )

  const ssoButtons = (
    <div className="auth-sso-group">
      <SocialButton
        provider="google"
        onSso={handleSso}
        label={t('Continue with Google')}
        icon={(
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 6.3 10.1 6.3z" />
          </svg>
        )}
      />
      <SocialButton
        provider="apple"
        onSso={handleSso}
        label={t('Continue with Apple')}
        icon={(
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M16.7 3.6c.3-.9.5-1.9.4-3-.5.1-1 .4-1.4.8-.4.4-.7 1-.8 1.6-.1.8.2 1.6.6 2.2.4.6 1 .9 1.2 1.8 0-.2.1-.4.1-.6l-.1-.8Zm1.5 4.2c-.6-.7-1.3-1.1-2-1.1-1 0-1.8.5-2.7.5-.9 0-1.7-.5-2.7-.5-.9 0-1.6.5-2.1 1.3 1.3.8 2.4 1.6 3 2.9.5 1.1.4 2.2-.2 3.3-.5 1-1.2 1.8-2 2.7-.4.5-.8 1-1.2 1.6-.3.4-.6.9-.5 1.1.2.6.8 1 1.4 1.1.5.1.9-.2 1.3-.4.4-.2.8-.4 1.3-.4.5 0 .9.2 1.3.4.4.2.8.5 1.3.4.6-.1 1.2-.6 1.4-1.1.2-.2.3-.5.5-.9.2-.4.5-1 1-1.7-.8-.5-1.4-1-1.7-1.7-.3-.9-.1-1.8.6-2.5.5-.6 1.3-1 2.5-1.4v-.4c-.1-.1-.4-.6-.8-1.2Zm-3.5-.6c.2-.6.7-1.1 1.2-1.4.5-.3 1-.3 1-.3.1-.8 0-1.6-.3-2.2-.3-.7-.9-1.2-1.5-1.5-.7-.3-1.5-.3-1.5-.3.1.9.4 1.7.9 2.3.5.6 1.1 1 1.6 1.3l-1.4 2.1Z" />
          </svg>
        )}
      />
    </div>
  )

  const emailInput = (fieldId: string) => (
    <label className="auth-field" htmlFor={fieldId}>
      <span className="auth-field-label-row">
        <span className="auth-field-label">{t('Work Email Address')}</span>
        <span className="auth-field-hint">{t('Company domain')}</span>
      </span>
      <span className="auth-input-wrap">
        <span className="auth-input-icon" aria-hidden="true"><span className="material-symbols-outlined">mail</span></span>
        <input
          id={fieldId}
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${fieldId}-error` : undefined}
          inputMode="email"
          onChange={(event) => { setEmail(event.target.value); setServerError(null); setErrors((current) => ({ ...current, email: undefined })) }}
          placeholder="name@company.com"
          required
          type="email"
          value={email}
        />
      </span>
      {errors.email && <small className="auth-error" id={`${fieldId}-error`}>{t(errors.email)}</small>}
    </label>
  )

  const passwordInput = (fieldId: string, withStrength: boolean) => (
    <label className="auth-field" htmlFor={fieldId}>
      <span className="auth-field-label-row">
        <span className="auth-field-label">{withStrength ? t('Create Master Password') : t('Password')}</span>
        {withStrength
          ? <span className="auth-field-hint">{strengthLabel}</span>
          : <span className="auth-field-link" onClick={() => setSsoNotice(t('Password reset will be available soon.'))}>{t('Forgot password?')}</span>}
      </span>
      <span className="auth-input-wrap">
        <span className="auth-input-icon" aria-hidden="true"><span className="material-symbols-outlined">lock</span></span>
        <input
          id={fieldId}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? `${fieldId}-error` : undefined}
          onChange={(event) => { setPassword(event.target.value); setServerError(null); setErrors((current) => ({ ...current, password: undefined })) }}
          placeholder={withStrength ? t('Enter strong password') : t('Enter your password')}
          required
          type={showPassword ? 'text' : 'password'}
          value={password}
        />
        <button aria-label={showPassword ? t('Hide password') : t('Show password')} aria-pressed={showPassword} className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} type="button">
          <span className="material-symbols-outlined" aria-hidden="true">{showPassword ? 'visibility_off' : 'visibility'}</span>
        </button>
      </span>
      {errors.password && <small className="auth-error" id={`${fieldId}-error`}>{t(errors.password)}</small>}
      {withStrength && (
        <span className="auth-strength" aria-hidden="true">
          <span className={passwordStrength >= 1 ? 'on' : ''} data-level="1" />
          <span className={passwordStrength >= 2 ? 'on' : ''} data-level="2" />
          <span className={passwordStrength >= 3 ? 'on' : ''} data-level="3" />
        </span>
      )}
    </label>
  )

  const confirmPasswordInput = (fieldId: string) => (
    <label className="auth-field" htmlFor={fieldId}>
      <span className="auth-field-label">{t('Confirm password')}</span>
      <span className="auth-input-wrap">
        <span className="auth-input-icon" aria-hidden="true"><span className="material-symbols-outlined">lock</span></span>
        <input
          id={fieldId}
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? `${fieldId}-error` : undefined}
          onChange={(event) => { setConfirmPassword(event.target.value); setServerError(null); setErrors((current) => ({ ...current, confirmPassword: undefined })) }}
          placeholder={t('Repeat password')}
          required
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
        />
      </span>
      {errors.confirmPassword && <small className="auth-error" id={`${fieldId}-error`}>{t(errors.confirmPassword)}</small>}
    </label>
  )

  return (
    <div className="auth-screen">
      {/* Ambient obsidian background */}
      <div className="auth-orbs" aria-hidden="true">
        <div className="auth-orb auth-orb--top" />
        <div className="auth-orb auth-orb--bottom" />
        <div className="auth-orb auth-orb--grid" />
      </div>

      {header}

      <main className="auth-main-content">
        {mode === 'login' ? (
          /* ------------------------------ LOGIN ------------------------------ */
          <div className="auth-card auth-card--login">
            <div className="auth-card-glow" aria-hidden="true" />
            <div className="auth-card-heading auth-card-heading--center">
              <span className="auth-eyebrow">
                <span className="material-symbols-outlined" aria-hidden="true">business</span>
                {t('Contractor AI Workspace')}
              </span>
              <h1>{t('Welcome Back')}</h1>
              <p>{t('Access your automated pipeline, reels & jobsite feeds.')}</p>
            </div>

            {ssoButtons}

            <div className="auth-divider"><span>{t('or sign in with email')}</span></div>

            <form className="auth-form auth-form--login" noValidate onSubmit={submit}>
              {emailInput('login-email')}
              {passwordInput('login-password', false)}
              {ssoNotice && <p className="auth-sso-notice" role="status">{ssoNotice}</p>}
              {serverError && <p className="auth-error" role="alert">{serverError}</p>}
              <div className="pt-2">
                <button className="auth-submit" disabled={pending} type="submit">
                  <span>{pending ? t('Please wait...') : t('Sign In to Workspace')}</span>
                  <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                </button>
              </div>
            </form>

            <div className="auth-card-footer">
              <p>{t("Don't have a contractor account?")} <a onClick={() => switchMode('register')} href="#register">{t('Create your account')}</a></p>
            </div>
          </div>
        ) : (
          /* ------------------------------ REGISTER ------------------------------ */
          <div className="auth-register">
            <aside className="auth-register-story">
              <div className="auth-story-badge">
                <span className="material-symbols-outlined" aria-hidden="true">bolt</span>
                {t('NO CREDIT CARD REQUIRED • 14-DAY TRIAL')}
              </div>
              <h2>{t('Automate social content for your trade.')}</h2>
              <p>{t('Built strictly for trade professionals. Turn job-site photos into ready-to-post reels and project showcases.')}</p>

              <div className="auth-credit-card">
                <div className="auth-credit-icon"><span className="material-symbols-outlined" aria-hidden="true">card_giftcard</span></div>
                <div className="auth-credit-copy">
                  <div className="auth-credit-title">
                    <span>{t('Transparent model-based pricing')}</span>
                    <span className="auth-credit-bonus">{t('Estimate')}</span>
                  </div>
                  <p>{t('Review the selected model estimate before generation. The server remains the source of truth for credits.')}</p>
                </div>
              </div>

              <ul className="auth-story-list">
                <li><span className="auth-check" aria-hidden="true">✓</span>{t('Instant AI hooks & video reels tailored for trade estimators')}</li>
                <li><span className="auth-check" aria-hidden="true">✓</span>{t('Approval-first publishing across Instagram, Meta, & LinkedIn')}</li>
                <li><span className="auth-check" aria-hidden="true">✓</span>{t('Account-based workspace with a server-controlled model catalog')}</li>
              </ul>

              <div className="auth-story-trades">
                <span className="auth-story-trades-label">{t('Tailored for licensed field specialists')}</span>
                <div className="auth-story-trades-pills">
                  <span><span className="material-symbols-outlined" aria-hidden="true">roofing</span>{t('Roofing')}</span>
                  <span><span className="material-symbols-outlined" aria-hidden="true">handyman</span>{t('Remodeling')}</span>
                  <span><span className="material-symbols-outlined" aria-hidden="true">hvac</span>{t('HVAC & Plumbing')}</span>
                  <span><span className="material-symbols-outlined" aria-hidden="true">yard</span>{t('Landscaping')}</span>
                </div>
              </div>

              <figure className="auth-testimonial">
                <div className="auth-testimonial-stars" aria-label={t('Illustrative workflow')}>
                  <span className="material-symbols-outlined">fact_check</span>
                  <span className="auth-testimonial-score">{t('Illustrative workflow')}</span>
                </div>
                <blockquote>
                  {t('Upload real jobsite materials, review the generated idea and media, then approve the post before scheduling or publishing.')}
                </blockquote>
                <figcaption>
                  <span className="auth-testimonial-avatar">MV</span>
                  <span>
                    <strong>{t('Contractor workflow example')}</strong>
                    <em>{t('No fabricated customer results')}</em>
                  </span>
                </figcaption>
              </figure>

              <div className="auth-social-metrics">
                <div><strong>AI</strong><span>{t('Multi-model catalog')}</span></div>
                <div><strong>OK</strong><span>{t('Approval-first')}</span></div>
                <div><strong>Auto</strong><span>{t('Server draft autosave')}</span></div>
              </div>
            </aside>

            <div className="auth-register-form">
              <div className="auth-card">
                <div className="auth-card-glow" aria-hidden="true" />
                <div className="auth-card-heading">
                  <h1>{t('Create your account')}</h1>
                  <p>{t('Create an account to configure a company and start an approval-first workflow.')}</p>
                </div>

                {ssoButtons}

                <div className="auth-divider"><span>{t('or register with company email')}</span></div>

                <form className="auth-form auth-form--register" noValidate onSubmit={submit}>
                  {mode === 'register' && (
                    <label className="auth-field" htmlFor="register-name">
                      <span className="auth-field-label">{t('Full Name')}</span>
                      <span className="auth-input-wrap">
                        <span className="auth-input-icon" aria-hidden="true"><span className="material-symbols-outlined">person</span></span>
                        <input
                          id="register-name"
                          autoComplete="name"
                          aria-invalid={Boolean(errors.name)}
                          aria-describedby={errors.name ? 'register-name-error' : undefined}
                          onChange={(event) => { setName(event.target.value); setServerError(null); setErrors((current) => ({ ...current, name: undefined })) }}
                          placeholder={t('Name and surname')}
                          required
                          value={name}
                        />
                      </span>
                      {errors.name && <small className="auth-error" id="register-name-error">{t(errors.name)}</small>}
                    </label>
                  )}
                  {emailInput('register-email')}
                  {passwordInput('register-password', true)}
                  {confirmPasswordInput('register-confirm')}

                  <label className="auth-terms">
                    <input checked={agreed} onChange={(event) => setAgreed(event.target.checked)} type="checkbox" />
                    <span>{t('I agree to the Terms of Service and Privacy Policy.')}</span>
                  </label>

                  {ssoNotice && <p className="auth-sso-notice" role="status">{ssoNotice}</p>}
                  {serverError && <p className="auth-error" role="alert">{serverError}</p>}

                  <div className="pt-2">
                    <button className="auth-submit" disabled={pending} type="submit">
                      <span>{pending ? t('Please wait...') : t('Create Workspace')}</span>
                      <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                    </button>
                    <div className="auth-submit-lock">
                      <span className="material-symbols-outlined" aria-hidden="true">lock</span>
                      {t('Session-protected account • Review before publishing')}
                    </div>
                  </div>
                </form>

                <div className="auth-card-footer">
                  <p>{t('Already have an account?')} <a onClick={() => switchMode('login')} href="#signin">{t('Sign in')}</a></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {footer}
    </div>
  )
}

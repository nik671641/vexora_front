import { useEffect, useState, type FormEvent } from 'react'
import { login, register, toWorkspaceUser, updateProfile } from '../../api/auth'
import { API_BASE_URL } from '../../api/client'
import { ApiError } from '../../api/errors'
import { useI18n, type InterfaceLanguage } from '../../i18n/context'
import type { TranslationKey } from '../../i18n/translations'
import { BrandLogo } from '../../shared/components/BrandLogo'
import type { DemoUser } from '../../shared/types/product'
import './AuthView.css'

type AuthMode = 'login' | 'register'
type Field = 'name' | 'email' | 'password' | 'confirmPassword' | 'terms'
type FieldErrors = Partial<Record<Field, TranslationKey>>

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
  { value: 'ro', label: 'RO' },
]

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
  const [agreed, setAgreed] = useState(false)
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
    document.documentElement.classList.add('vexora-auth-active')
    return () => document.documentElement.classList.remove('vexora-auth-active')
  }, [])

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
    if (pending) return
    const nextErrors: FieldErrors = {}
    if (mode === 'register' && name.trim().length < 2) nextErrors.name = 'Enter at least 2 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Enter your password.'
    else if (mode === 'register' && password.length < 8) nextErrors.password = 'Use at least 8 characters.'
    if (mode === 'register' && password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    if (mode === 'register' && !agreed) nextErrors.terms = 'Please accept the Terms of Service.'
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

  const copy = {
    ru: {
      login: 'Войти в аккаунт', register: 'Регистрация', tagline: 'Платформа управления контентом для бизнеса',
      name: 'Имя и фамилия', email: 'Рабочий email', password: 'Пароль', confirm: 'Подтверждение пароля',
      namePlaceholder: 'Алексей Кузнецов', passwordHint: 'Минимум 8 символов', forgot: 'Забыли пароль?',
      enter: 'Войти в Vexora', create: 'Создать аккаунт', divider: 'или продолжить через',
      noAccount: 'Нет аккаунта?', createLink: 'Зарегистрируйте аккаунт компании', hasAccount: 'Уже есть аккаунт?',
      signInLink: 'Войдите в Vexora', registerHint: 'После регистрации вы сможете создать профиль компании.',
      session: 'Ваши данные входа используются только для авторизации', back: 'На главную',
      help: 'Помощь со входом', helpText: 'Используйте email и пароль вашего аккаунта или продолжите через Google или Apple. Если провайдер недоступен, используйте вход по email.',
      google: 'Продолжить с Google', apple: 'Продолжить с Apple', language: 'Язык интерфейса',
      copyright: '© 2026 Vexora', terms: 'Я согласен с условиями использования и политикой конфиденциальности.',
      registerTitle: 'Создайте аккаунт Vexora', registerDescription: 'Единое пространство для создания и согласования контента',
      security: 'Вход в рабочее пространство', strength: 'Надёжность пароля',
    },
    en: {
      login: 'Sign in to account', register: 'Register', tagline: 'Content management platform for business',
      name: 'Full name', email: 'Work email', password: 'Password', confirm: 'Confirm password',
      namePlaceholder: 'Alex Morgan', passwordHint: 'At least 8 characters', forgot: 'Forgot password?',
      enter: 'Sign in to Vexora', create: 'Create account', divider: 'or continue with',
      noAccount: 'No account yet?', createLink: 'Create your company account', hasAccount: 'Already have an account?',
      signInLink: 'Sign in to Vexora', registerHint: 'You can create a company profile after registration.',
      session: 'Your sign-in details are used only for authentication', back: 'Back to home',
      help: 'Sign-in help', helpText: 'Use your account email and password, or continue with Google or Apple. If a provider is unavailable, sign in with email.',
      google: 'Continue with Google', apple: 'Continue with Apple', language: 'Interface language',
      copyright: '© 2026 Vexora', terms: 'I agree to the Terms of Service and Privacy Policy.',
      registerTitle: 'Create your Vexora account', registerDescription: 'One workspace for content creation and approval',
      security: 'Workspace sign-in', strength: 'Password strength',
    },
    ro: {
      login: 'Intră în cont', register: 'Înregistrare', tagline: 'Platformă de gestionare a conținutului pentru companii',
      name: 'Nume complet', email: 'Email de serviciu', password: 'Parolă', confirm: 'Confirmă parola',
      namePlaceholder: 'Alexandru Popescu', passwordHint: 'Cel puțin 8 caractere', forgot: 'Ai uitat parola?',
      enter: 'Intră în Vexora', create: 'Creează cont', divider: 'sau continuă cu',
      noAccount: 'Nu ai cont?', createLink: 'Creează contul companiei', hasAccount: 'Ai deja un cont?',
      signInLink: 'Intră în Vexora', registerHint: 'Poți crea profilul companiei după înregistrare.',
      session: 'Datele de conectare sunt folosite doar pentru autentificare', back: 'Pagina principală',
      help: 'Ajutor la autentificare', helpText: 'Folosește emailul și parola contului sau continuă cu Google ori Apple. Dacă furnizorul nu este disponibil, folosește autentificarea prin email.',
      google: 'Continuă cu Google', apple: 'Continuă cu Apple', language: 'Limba interfeței',
      copyright: '© 2026 Vexora', terms: 'Sunt de acord cu Termenii de utilizare și Politica de confidențialitate.',
      registerTitle: 'Creează contul Vexora', registerDescription: 'Un spațiu pentru crearea și aprobarea conținutului',
      security: 'Autentificare în spațiul de lucru', strength: 'Siguranța parolei',
    },
  }[language]
  const isRegister = mode === 'register'

  function clearField(field: Field) {
    setErrors((current) => ({ ...current, [field]: undefined }))
    setServerError(null)
  }

  const icon = (symbol: string) => <span className="material-symbols-outlined" aria-hidden="true">{symbol}</span>

  function passwordField(id: string, confirm = false) {
    const field = confirm ? 'confirmPassword' : 'password'
    return <div className="vx-auth-field">
      <div className="vx-auth-label-row">
        <label htmlFor={id}>{confirm ? copy.confirm : copy.password}</label>
        {!confirm && !isRegister && <button type="button" className="vx-auth-text-button" onClick={() => setSsoNotice(t('Password reset will be available soon.'))}>{copy.forgot}</button>}
      </div>
      <div className="vx-auth-input-wrap">
        <input id={id} name={field} type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'}
          placeholder="••••••••••••" required disabled={pending}
          aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${id}-error` : isRegister && !confirm ? 'vx-password-hint' : undefined}
          value={confirm ? confirmPassword : password} onChange={(event) => { (confirm ? setConfirmPassword : setPassword)(event.target.value); clearField(field) }} />
        <button type="button" className="vx-auth-input-action" aria-label={showPassword ? t('Hide password') : t('Show password')} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{icon(showPassword ? 'visibility_off' : 'visibility')}</button>
      </div>
      {errors[field] && <p className="vx-auth-field-error" id={`${id}-error`}>{t(errors[field])}</p>}
      {isRegister && !confirm && <div className="vx-auth-password-hint" id="vx-password-hint">
        <div className="vx-auth-strength" aria-hidden="true">{[1, 2, 3].map((level) => <span className={passwordStrength >= level ? 'is-filled' : ''} key={level} />)}</div>
        <div><span>{copy.passwordHint}</span><span>{password ? `${copy.strength}: ${strengthLabel.replace(/^.*?:\s*/, '')}` : ''}</span></div>
      </div>}
    </div>
  }

  return <div className={`vx-auth-page${isRegister ? ' is-register' : ''}`}>
    <header className="vx-auth-header">
      <div className="vx-auth-header-brand">
        <a href="#/" onClick={(event) => { event.preventDefault(); onBack() }} aria-label={`Vexora — ${copy.back}`}><BrandLogo /></a>
        <span className="vx-auth-header-separator">/</span><span className="vx-auth-route">{isRegister ? 'register' : 'sign-in'}</span>
      </div>
      <div className="vx-auth-header-tools">
        <span className="vx-auth-access-label">{icon('lock')}{copy.security}</span>
        <label className="vx-auth-language"><span className="vx-auth-sr-only">{copy.language}</span><select value={language} onChange={(event) => setLanguage(event.target.value as InterfaceLanguage)}>{LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      </div>
    </header>

    <main className="vx-auth-main">
      <div className="vx-auth-column">
        <div className="vx-auth-heading">
          <h1>{isRegister ? copy.registerTitle : 'Vexora'}</h1>
          <p>{isRegister ? copy.registerDescription : copy.tagline}</p>
        </div>

        <section className="vx-auth-panel" aria-label={isRegister ? copy.register : copy.login}>
          <nav className="vx-auth-tabs" aria-label={copy.security}>
            <a className={isRegister ? '' : 'is-active'} href="#/signin" aria-current={!isRegister ? 'page' : undefined} aria-disabled={pending} onClick={(event) => { event.preventDefault(); if (!pending) switchMode('login') }}>{copy.login}</a>
            <a className={isRegister ? 'is-active' : ''} href="#/register" aria-current={isRegister ? 'page' : undefined} aria-disabled={pending} onClick={(event) => { event.preventDefault(); if (!pending) switchMode('register') }}>{copy.register}</a>
          </nav>
          <div className="vx-auth-panel-body">
            <form noValidate onSubmit={submit} className="vx-auth-form" aria-busy={pending}>
              {isRegister && <div className="vx-auth-field"><label htmlFor="vx-auth-name">{copy.name}</label><input id="vx-auth-name" name="name" autoComplete="name" value={name} placeholder={copy.namePlaceholder} required disabled={pending} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'vx-auth-name-error' : undefined} onChange={(event) => { setName(event.target.value); clearField('name') }} />{errors.name && <p className="vx-auth-field-error" id="vx-auth-name-error">{t(errors.name)}</p>}</div>}
              <div className="vx-auth-field">
                <label htmlFor="vx-auth-email">{copy.email}</label>
                <div className="vx-auth-input-wrap"><input id="vx-auth-email" name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="alex@company.com" value={email} required disabled={pending} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'vx-auth-email-error' : undefined} onChange={(event) => { setEmail(event.target.value); clearField('email') }} /><span className="vx-auth-input-icon">{icon('domain')}</span></div>
                {errors.email && <p className="vx-auth-field-error" id="vx-auth-email-error">{t(errors.email)}</p>}
              </div>
              {passwordField('vx-auth-password')}
              {isRegister && passwordField('vx-auth-confirm', true)}
              {isRegister && <div><label className="vx-auth-agreement"><input type="checkbox" checked={agreed} disabled={pending} aria-invalid={Boolean(errors.terms)} aria-describedby={errors.terms ? 'vx-auth-terms-error' : undefined} onChange={(event) => { setAgreed(event.target.checked); clearField('terms') }} /><span>{copy.terms}</span></label>{errors.terms && <p className="vx-auth-field-error" id="vx-auth-terms-error">{t(errors.terms)}</p>}</div>}
              {serverError && <p className="vx-auth-notice is-error" role="alert">{serverError}</p>}
              {ssoNotice && <p className="vx-auth-notice" role="status">{ssoNotice}</p>}
              <button className="vx-auth-submit" type="submit" disabled={pending}><span>{pending ? t('Please wait...') : isRegister ? copy.create : copy.enter}</span>{icon(pending ? 'hourglass_empty' : 'arrow_forward')}</button>
              {isRegister && <p className="vx-auth-register-hint">{copy.registerHint}</p>}
            </form>
            <div className="vx-auth-divider"><span>{copy.divider}</span></div>
            <div className="vx-auth-providers">
              <button type="button" disabled={pending} onClick={() => handleSso('google')}><svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>{copy.google}</button>
              <button type="button" disabled={pending} onClick={() => handleSso('apple')}><svg width="17" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.1 12.3c0-2.1 1.7-3.2 1.8-3.3-1-1.5-2.6-1.7-3.1-1.7-1.3-.2-2.6.8-3.3.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.8.9-3.6 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1.1 1.5 2.2 2.6 2.1 1.1 0 1.5-.7 2.9-.7 1.3 0 1.7.7 2.9.7s1.9-1 2.6-2c.8-1.2 1.1-2.4 1.2-2.5-.1 0-2.2-.9-2.2-3.3ZM14.9 5.9c.6-.8 1.1-1.8 1-2.9-.9 0-2 .6-2.7 1.4-.6.7-1.2 1.7-1.1 2.8 1 .1 2.1-.5 2.8-1.3Z"/></svg>{copy.apple}</button>
            </div>
          </div>
          <div className="vx-auth-panel-footer"><p>{isRegister ? copy.hasAccount : copy.noAccount}{' '}<a href={isRegister ? '#/signin' : '#/register'} aria-disabled={pending} onClick={(event) => { event.preventDefault(); if (!pending) switchMode(isRegister ? 'login' : 'register') }}>{isRegister ? copy.signInLink : copy.createLink}</a></p></div>
        </section>
        <p className="vx-auth-session-note">{icon('lock')}{copy.session}</p>
      </div>
    </main>
    <footer className="vx-auth-footer"><span>{copy.copyright}</span><div><button type="button" onClick={() => setSsoNotice(copy.helpText)}>{copy.help}</button><a href="#/" onClick={(event) => { event.preventDefault(); onBack() }}>{copy.back}{icon('north_east')}</a></div></footer>
  </div>
}

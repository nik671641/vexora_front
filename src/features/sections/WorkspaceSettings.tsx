import { useState } from 'react'
import { updateProfile } from '../../api/auth'
import { useI18n, type InterfaceLanguage } from '../../i18n/context'
import type { Company } from '../../shared/types/product'

export function WorkspaceSettings({ currentCompany }: { currentCompany: Company }) {
  const { t, label, language, setLanguage } = useI18n()
  const text = (ru: string, en: string, ro: string) => ({ ru, en, ro })[language]
  const [draftLanguage, setDraftLanguage] = useState<InterfaceLanguage>(language)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function save() {
    if (busy) return
    setBusy(true); setMessage(''); setError('')
    try { const profile = await updateProfile({ interface_language: draftLanguage }); setLanguage(profile.interface_language); setMessage(t('Saved')) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Request failed') }
    finally { setBusy(false) }
  }
  const tabs = [
    ['general', text('Основные', 'General', 'Generale')],
    ['content', text('Контент и AI-правила', 'Content and AI rules', 'Conținut și reguli AI')],
    ['access', text('Участники и доступ', 'Members and access', 'Membri și acces')],
    ['notifications', text('Уведомления', 'Notifications', 'Notificări')],
    ['billing', text('Кредиты', 'Credits', 'Credite')],
  ]
  return <div className="precision-settings-page"><section className="page-hero"><div><p className="eyebrow">{currentCompany.name}</p><h2>{t('Workspace settings')}</h2><p>{text('Параметры рабочей среды, контекст компании и доступ к публикации.', 'Workspace preferences, company context and publishing access.', 'Preferințe de lucru, contextul companiei și acces la publicare.')}</p></div></section>
    <nav className="precision-settings-tabs" aria-label={t('Settings sections')}>{tabs.map(([id, name]) => <a key={id} href={`#workspace-${id}`} onClick={(event) => { event.preventDefault(); document.getElementById(`workspace-${id}`)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }) }}>{name}</a>)}</nav>
    <div className="precision-settings-document">
      <section id="workspace-general"><header><h3>{text('Основные параметры', 'General preferences', 'Preferințe generale')}</h3>{currentCompany.id && <small>ID: {currentCompany.id.slice(0, 8)}</small>}</header>
        <div className="precision-setting-row"><div><strong>{t('Company')}</strong><p>{text('Активный бренд для создания контента.', 'The active brand used for content creation.', 'Brandul activ utilizat la crearea conținutului.')}</p></div><div className="precision-setting-value">{currentCompany.logoImageUrl && <img width="44" height="44" alt="" src={currentCompany.logoImageUrl} />}<span>{currentCompany.name || '—'}</span><a href="#/companies" className="secondary-button">{text('Изменить', 'Edit', 'Editează')}</a></div></div>
        <div className="precision-setting-row"><div><strong>{t('Interface language')}</strong><p>{text('Сохраняется в профиле пользователя.', 'Saved to your user profile.', 'Se salvează în profilul utilizatorului.')}</p></div><select aria-label={t('Interface language')} value={draftLanguage} onChange={(event) => { setDraftLanguage(event.target.value as InterfaceLanguage); setMessage('') }} disabled={busy}><option value="ru">Русский (RU)</option><option value="en">English (EN)</option><option value="ro">Română (RO)</option></select></div>
        <div className="precision-setting-row"><div><strong>{text('Часовой пояс', 'Time zone', 'Fus orar')}</strong><p>{text('Даты и время показываются в часовом поясе вашего устройства.', 'Dates and times use your device time zone.', 'Data și ora folosesc fusul orar al dispozitivului.')}</p></div><code>{Intl.DateTimeFormat().resolvedOptions().timeZone}</code></div>
        <div className="precision-setting-row"><div><strong>{text('Формат календаря', 'Calendar format', 'Format calendar')}</strong><p>{text('Календарь использует локализованные даты и неделю с понедельника.', 'The calendar uses localized dates and a Monday-first week.', 'Calendarul folosește date localizate și săptămâni de luni.')}</p></div><span>{new Intl.DateTimeFormat({ ru: 'ru-RU', en: 'en-US', ro: 'ro-RO' }[language]).format(new Date())}</span></div>
        {error && <p className="precision-inline-notice" role="alert">{error}</p>}{message && <p className="precision-inline-notice" role="status">{message}</p>}<footer><button type="button" className="secondary-button" disabled={busy || draftLanguage === language} onClick={() => { setDraftLanguage(language); setMessage(''); setError('') }}>{t('Cancel')}</button><button type="button" className="primary-button" disabled={busy || draftLanguage === language} onClick={() => { void save() }}>{busy ? t('Saving…') : t('Save Changes')}</button></footer>
      </section>
      <section id="workspace-content"><header><h3>{text('Контент и AI-правила', 'Content and AI rules', 'Conținut și reguli AI')}</h3><a href="#/companies">{text('Изменить', 'Edit', 'Editează')} →</a></header><div className="precision-setting-row"><div><strong>{t('Tone of voice')}</strong><p>{text('Используется при подготовке текстов.', 'Used when generating copy.', 'Folosit la generarea textelor.')}</p></div><p>{currentCompany.tone || '—'}</p></div><div className="precision-setting-row"><strong>{t('Visual rules')}</strong><p>{currentCompany.visualRules || '—'}</p></div><div className="precision-setting-row"><strong>{t('Model')}</strong><div>{currentCompany.preferredImageModel || '—'}<br />{currentCompany.preferredVideoModel || '—'}<p><a href="#/models">{t('Models')} →</a></p></div></div></section>
      <section id="workspace-access"><header><h3>{text('Участники и доступ', 'Members and access', 'Membri și acces')}</h3></header><div className="precision-setting-row"><div><strong>{text('Ваша роль в компании', 'Your company role', 'Rolul tău în companie')}</strong><p>{text('Права проверяются сервером.', 'Access is enforced by the server.', 'Accesul este verificat de server.')}</p></div><span>{currentCompany.role ? label(currentCompany.role) : '—'}</span></div><p className="precision-inline-notice">{text('Приглашения участников и изменение ролей пока недоступны.', 'Member invitations and role management are not available yet.', 'Invitațiile și gestionarea rolurilor nu sunt încă disponibile.')}</p></section>
      <section id="workspace-notifications"><header><h3>{text('Уведомления', 'Notifications', 'Notificări')}</h3></header><div className="precision-setting-row"><div><strong>{text('Материалы на согласовании', 'Content awaiting approval', 'Conținut de aprobat')}</strong><p>{text('Индикатор в верхней панели появляется при наличии черновиков на проверку.', 'The header indicator appears when drafts are awaiting review.', 'Indicatorul din antet apare când există ciorne de verificat.')}</p></div><a className="secondary-button" href="#/approvals">{t('Open')}</a></div><p className="precision-inline-notice">{text('Email-уведомления пока не подключены.', 'Email notifications are not connected yet.', 'Notificările prin email nu sunt încă conectate.')}</p></section>
      <section id="workspace-billing"><header><h3>{text('Кредиты компании', 'Company credits', 'Creditele companiei')}</h3></header><div className="precision-setting-row"><div><strong>{t('Available balance')}</strong><p>{currentCompany.name}</p></div><strong className="precision-credit-value">{new Intl.NumberFormat(language).format(currentCompany.credits ?? 0)} {t('credits')}</strong></div><footer><a className="secondary-button" href="#/models">{t('Models')}</a><a className="primary-button" href="#/accounts/plan">{t('Plan & Credits')}</a></footer></section>
    </div>
  </div>
}

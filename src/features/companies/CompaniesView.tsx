import { useMemo, useRef, useState } from 'react'
import type { Company } from '../../shared/types/product'
import { StatusPill } from '../../shared/components/StatusPill'
import { Select } from '../../shared/components/Select'
import { useI18n } from '../../i18n/context'
import { generateCompanyDraft } from '../../api/companies'
import './CompaniesView.css'

const imageTypes = ['image/png', 'image/jpeg', 'image/webp']
const maxImageBytes = 2 * 1024 * 1024
const countryCodes = `AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW`.split(' ')

const emptyCompany: Company = {
  name: '', site: '', status: 'Draft', tone: '', posts: 0, readiness: 0,
  description: '', products: '', services: '', advantages: '', targetAudience: '',
  competitors: '', countries: '', brandStyle: '', visualRules: '', logoUrl: '',
  links: '', socialAccounts: '',
}

type ProfileMode = 'assisted' | 'manual'
type ProfileSection = 'basics' | 'offer' | 'audience' | 'brand' | 'channels'
type MissingEssential =
  | 'Add a clear company description'
  | 'List the main services'
  | 'Define the target audience'
  | 'Set the tone of voice'
  | 'Add visual guardrails'

export function CompaniesView({
  activeCompany, companies, onCompanySelect, onCompanySave, onCompanyArchive,
  onCompanyLogoUpload, onCompanyLogoRemove,
}: {
  activeCompany: Company | null
  companies: Company[]
  onCompanySelect: (companyId: string) => Promise<void>
  onCompanySave: (company: Company) => Promise<Company>
  onCompanyArchive: (companyId: string) => Promise<void>
  onCompanyLogoUpload?: (companyId: string, file: File) => Promise<Company>
  onCompanyLogoRemove?: (companyId: string) => Promise<Company>
}) {
  const { t, label, language } = useI18n()
  const [draft, setDraft] = useState<Company>(activeCompany ?? emptyCompany)
  const [mode, setMode] = useState<ProfileMode>(activeCompany ? 'manual' : 'assisted')
  const [activeSection, setActiveSection] = useState<ProfileSection>('basics')
  const [aiGenerated, setAiGenerated] = useState(false)
  const [deleteArmed, setDeleteArmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiUncertainties, setAiUncertainties] = useState<string[]>([])
  const [isSaved, setIsSaved] = useState(Boolean(activeCompany?.id))
  const [logoError, setLogoError] = useState<string | null>(null)
  const [failedLogoUrl, setFailedLogoUrl] = useState('')
  const editorRef = useRef<HTMLElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const isNewCompany = !draft.id
  const canEdit = draft.role !== 'viewer'
  const profileScore = useMemo(() => calculateReadiness(draft), [draft])
  const previewLogoUrl = draft.logoImageUrl || draft.logoUrl?.trim() || ''
  const canUploadLogo = Boolean(draft.id && onCompanyLogoUpload && canEdit)
  const showProfileEditor = mode === 'manual' || !isNewCompany || aiGenerated
  const missingEssentials = useMemo(() => getMissingEssentials(draft), [draft])
  const countryOptions = useMemo(() => {
    const locale = language === 'ru' ? 'ru' : language === 'ro' ? 'ro' : 'en'
    const names = new Intl.DisplayNames([locale], { type: 'region' })
    return countryCodes
      .map((code) => ({ code, label: names.of(code) ?? code }))
      .sort((left, right) => left.label.localeCompare(right.label, locale))
  }, [language])
  const selectedCountry = draft.countries?.trim() ?? ''
  const countrySelectOptions = useMemo(() => {
    const options = countryOptions.map((country) => ({ value: country.label, label: country.label }))
    if (selectedCountry && !options.some((country) => country.value === selectedCountry)) options.unshift({ value: selectedCountry, label: selectedCountry })
    return [{ value: '', label: t('Select country') }, ...options]
  }, [countryOptions, selectedCountry, t])

  function scrollToEditor() {
    if (window.matchMedia('(max-width: 1100px)').matches) {
      window.requestAnimationFrame(() => editorRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      }))
    }
  }

  async function selectCompany(company: Company) {
    if (!company.id) return
    setBusy(true)
    setError(null)
    try {
      await onCompanySelect(company.id)
      setDraft(company)
      setMode('manual')
      setActiveSection('basics')
      setAiGenerated(false)
      setIsSaved(true)
      setLogoError(null)
      setDeleteArmed(false)
      setAiUncertainties([])
      scrollToEditor()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Request failed'))
    } finally {
      setBusy(false)
    }
  }

  function updateDraft(field: keyof Company, value: string) {
    setDraft((current) => {
      const updated = { ...current, [field]: value }
      return { ...updated, readiness: calculateReadiness(updated) }
    })
    setIsSaved(false)
  }

  function startNewCompany() {
    setDraft({ ...emptyCompany })
    setMode('assisted')
    setActiveSection('basics')
    setAiGenerated(false)
    setIsSaved(false)
    setLogoError(null)
    setDeleteArmed(false)
    setError(null)
    setAiUncertainties([])
    scrollToEditor()
  }

  async function saveCompany() {
    const normalized: Company = {
      ...draft,
      name: draft.name.trim(),
      site: draft.site.trim(),
      readiness: profileScore,
      status: profileScore > 80 ? 'Active' : 'Draft',
    }
    setBusy(true)
    setError(null)
    try {
      const saved = await onCompanySave(normalized)
      setDraft(saved)
      setMode('manual')
      setIsSaved(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Request failed'))
    } finally {
      setBusy(false)
    }
  }

  async function generateDraft() {
    setBusy(true)
    setGenerating(true)
    setError(null)
    setAiUncertainties([])
    try {
      const result = await generateCompanyDraft(draft, language)
      setDraft((current) => {
        const filled = Object.fromEntries(
          Object.entries(result.draft).filter(([, value]) => typeof value === 'string' && value.trim()),
        ) as Partial<Company>
        const updated = { ...current, ...filled }
        return { ...updated, readiness: calculateReadiness(updated) }
      })
      setAiUncertainties(result.uncertainties)
      setAiGenerated(true)
      setActiveSection('basics')
      setIsSaved(false)
      window.requestAnimationFrame(() => profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Request failed'))
    } finally {
      setGenerating(false)
      setBusy(false)
    }
  }

  async function archiveCompany() {
    if (!draft.id || draft.role !== 'owner') return
    setBusy(true)
    setError(null)
    try {
      await onCompanyArchive(draft.id)
      startNewCompany()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Request failed'))
    } finally {
      setBusy(false)
    }
  }

  async function uploadLogo(file: File) {
    if (!draft.id || !onCompanyLogoUpload) return
    if (!imageTypes.includes(file.type) || file.size === 0 || file.size > maxImageBytes) {
      setLogoError(t('Choose a PNG, JPG or WebP image under 2 MB.'))
      return
    }
    setBusy(true)
    setLogoError(null)
    try {
      const updated = await onCompanyLogoUpload(draft.id, file)
      setDraft((current) => ({ ...current, logoImageUrl: updated.logoImageUrl }))
      setFailedLogoUrl('')
    } catch (cause) {
      setLogoError(cause instanceof Error ? cause.message : t('Upload failed'))
    } finally {
      setBusy(false)
    }
  }

  async function removeLogo() {
    if (!draft.id || !onCompanyLogoRemove) return
    setBusy(true)
    setLogoError(null)
    try {
      const updated = await onCompanyLogoRemove(draft.id)
      setDraft((current) => ({ ...current, logoImageUrl: updated.logoImageUrl }))
      setFailedLogoUrl('')
    } catch (cause) {
      setLogoError(cause instanceof Error ? cause.message : t('Request failed'))
    } finally {
      setBusy(false)
    }
  }

  function resetDraft() {
    setDraft(activeCompany ?? { ...emptyCompany })
    setMode(activeCompany ? 'manual' : 'assisted')
    setActiveSection('basics')
    setAiGenerated(false)
    setIsSaved(Boolean(activeCompany?.id))
    setLogoError(null)
    setError(null)
  }

  return (
    <div className="companies-page">
      <section className="page-hero companies-hero">
        <div>
          <p className="eyebrow">{t('Brand workspace')}</p>
          <h2>{t('Company profiles')}</h2>
          <p>{t('Give AI a reliable source of truth for every brief, caption, and visual.')}</p>
        </div>
        <button className="primary-button" disabled={busy} onClick={startNewCompany} type="button">
          <span className="material-symbols-outlined" aria-hidden="true">add_business</span>
          {t('New company')}
        </button>
      </section>

      <div className="companies-workspace">
        <aside className="panel company-rail">
          <div className="company-rail-heading">
            <div><strong>{t('Your companies')}</strong><span>{t('{count} profiles', { count: companies.length })}</span></div>
            <button aria-label={t('New company')} className="company-add-compact" onClick={startNewCompany} type="button">+</button>
          </div>
          <div className="company-list">
            {companies.map((company) => (
              <button className={`company-list-card ${company.id === draft.id ? 'selected' : ''}`} disabled={busy} key={company.id ?? company.name} onClick={() => { void selectCompany(company) }} type="button">
                <span className="company-list-avatar">{company.name.slice(0, 2).toUpperCase()}</span>
                <span className="company-list-copy"><strong>{company.name}</strong></span>
              </button>
            ))}
            {!companies.length && <div className="company-rail-empty"><span className="material-symbols-outlined" aria-hidden="true">domain_add</span><strong>{t('Create your first profile')}</strong><p>{t('AI can build it from your website in about a minute.')}</p></div>}
          </div>
        </aside>

        <section className="company-editor" ref={editorRef}>
          <div className="company-editor-head">
            <div>
              <div className="company-editor-title-row"><h3>{isNewCompany ? t('Create a company profile') : draft.name}</h3>{!isNewCompany && <StatusPill label={label(draft.status)} tone={draft.status === 'Active' ? 'good' : 'warn'} />}</div>
              <p>{isNewCompany ? t('Start with AI, then review and adjust the result before saving.') : t('Keep this source of truth accurate so generated content stays on-brand.')}</p>
            </div>
            <div className="company-editor-head-actions">
              {!isNewCompany && canEdit && <button aria-expanded={mode === 'assisted'} className="company-ai-toggle" onClick={() => setMode((current) => current === 'assisted' ? 'manual' : 'assisted')} type="button"><span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>{mode === 'assisted' ? t('Close AI assistant') : t('Improve profile with AI')}</button>}
              {!isSaved && canEdit && <span className="company-unsaved"><i />{t('Unsaved changes')}</span>}
            </div>
          </div>

          {error && <p className="account-error" role="alert">{error}</p>}
          {draft.role === 'viewer' && <p className="company-readonly-note">{t('Viewer access: this profile is read-only.')}</p>}

          {isNewCompany && <div className="company-mode-switch" role="tablist" aria-label={t('Creation method')}>
            <button aria-selected={mode === 'assisted'} className={mode === 'assisted' ? 'selected' : ''} onClick={() => setMode('assisted')} role="tab" type="button"><span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>{t('Create with AI')}</button>
            <button aria-selected={mode === 'manual'} className={mode === 'manual' ? 'selected' : ''} onClick={() => setMode('manual')} role="tab" type="button">{t('Fill manually')}</button>
          </div>}

          {mode === 'assisted' && (
            <section className="company-ai-onboarding">
              <div className="company-ai-heading"><span className="company-ai-icon material-symbols-outlined" aria-hidden="true">auto_awesome</span><div><span className="company-ai-kicker">{t('AI profile builder')}</span><h4>{isNewCompany ? t('Tell us about the business') : t('Refresh this profile with AI')}</h4><p>{t('Enter a website or add a short description. AI will prepare the complete profile for review.')}</p></div></div>
              <div className="company-ai-fields">
                <label>{t('Company name')}<input disabled={!canEdit} onChange={(event) => updateDraft('name', event.target.value)} placeholder={t('e.g. Northstar Roofing')} value={draft.name} /></label>
                <label>{t('Company website')}<input disabled={!canEdit} onChange={(event) => updateDraft('site', event.target.value)} placeholder="https://example.com" value={draft.site} /></label>
                <label className="span-2">{t('Extra context')}<textarea disabled={!canEdit} onChange={(event) => updateDraft('description', event.target.value)} placeholder={t('What do you sell, where do you work, and what makes the business different?')} rows={4} value={draft.description} /></label>
              </div>
              <div className="company-ai-actions">
                <button aria-busy={generating} className={`primary-button company-generate-button${generating ? ' is-generating' : ''}`} disabled={busy || !canEdit || (!draft.name.trim() && !draft.site.trim() && !(draft.description ?? '').trim())} onClick={() => { void generateDraft() }} type="button">
                  {generating ? <span className="company-generate-spinner" aria-hidden="true" /> : <span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>}
                  {generating ? t('Building your profile…') : isNewCompany ? t('Build profile with AI') : t('Improve profile with AI')}
                </button>
              </div>
              {aiGenerated && <div className="company-ai-result" role="status"><span className="material-symbols-outlined" aria-hidden="true">check_circle</span><div><strong>{t('AI draft is ready for review')}</strong><p>{aiUncertainties.length ? t('{count} items need your attention.', { count: aiUncertainties.length }) : t('All main sections were filled. Check the details below.')}</p></div></div>}
            </section>
          )}

          {!showProfileEditor && <div className="company-ai-placeholder"><span className="material-symbols-outlined" aria-hidden="true">magic_button</span><strong>{t('Your structured profile will appear here')}</strong><p>{t('AI will organize the business into clear sections that you can review before saving.')}</p></div>}

          {showProfileEditor && (
            <div className="company-profile-area" ref={profileRef}>
              <div className="company-profile-main">
                <nav className="company-profile-tabs" aria-label={t('Profile sections')}>
                  <ProfileTab active={activeSection === 'basics'} complete={sectionCompletion(draft, ['name', 'site', 'description']) === 100} icon="business" label={t('Basics')} onClick={() => { setActiveSection('basics'); document.getElementById('company-section-basics')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }) }} />
                  <ProfileTab active={activeSection === 'offer'} complete={sectionCompletion(draft, ['products', 'services', 'advantages']) === 100} icon="storefront" label={t('Offer')} onClick={() => { setActiveSection('offer'); document.getElementById('company-section-offer')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }) }} />
                  <ProfileTab active={activeSection === 'audience'} complete={sectionCompletion(draft, ['targetAudience', 'countries', 'competitors']) === 100} icon="groups" label={t('Audience')} onClick={() => { setActiveSection('audience'); document.getElementById('company-section-audience')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }) }} />
                  <ProfileTab active={activeSection === 'brand'} complete={sectionCompletion(draft, ['tone', 'brandStyle', 'visualRules']) === 100} icon="palette" label={t('Brand')} onClick={() => { setActiveSection('brand'); document.getElementById('company-section-brand')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }) }} />
                  <ProfileTab active={activeSection === 'channels'} complete={sectionCompletion(draft, ['logoUrl', 'links', 'socialAccounts']) === 100} icon="link" label={t('Channels')} onClick={() => { setActiveSection('channels'); document.getElementById('company-section-channels')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }) }} />
                </nav>

                <section id="company-section-basics" className="company-tab-panel">
                  <div className="company-tab-heading"><span className="material-symbols-outlined" aria-hidden="true">business</span><div><h4>{t('Business basics')}</h4><p>{t('Identity and the short summary used across the platform.')}</p></div></div>
                  <div className="company-section-grid"><label>{t('Name')}<input disabled={!canEdit} onChange={(event) => updateDraft('name', event.target.value)} value={draft.name} /></label><label>{t('Website')}<input disabled={!canEdit} onChange={(event) => updateDraft('site', event.target.value)} value={draft.site} /></label><label className="span-2"><FieldTitle hint={t('A short factual summary that AI uses to understand the business and write accurate content.')}>{t('Description')}</FieldTitle><textarea disabled={!canEdit} onChange={(event) => updateDraft('description', event.target.value)} rows={4} value={draft.description} /></label></div>
                </section>

                <section id="company-section-offer" className="company-tab-panel">
                  <div className="company-tab-heading"><span className="material-symbols-outlined" aria-hidden="true">storefront</span><div><h4>{t('Offer & differentiation')}</h4><p>{t('What the company sells and why customers should choose it.')}</p></div></div>
                  <div className="company-section-grid three-columns"><label><FieldTitle hint={t('Tangible goods, software, subscriptions, or named product lines that customers can buy.')}>{t('Products')}</FieldTitle><textarea disabled={!canEdit} onChange={(event) => updateDraft('products', event.target.value)} placeholder={t('One item per line')} rows={6} value={draft.products} /></label><label><FieldTitle hint={t('Work the company performs for customers, such as consultations, installation, or support.')}>{t('Services')}</FieldTitle><textarea disabled={!canEdit} onChange={(event) => updateDraft('services', event.target.value)} placeholder={t('One item per line')} rows={6} value={draft.services} /></label><label><FieldTitle hint={t('Specific reasons to choose this company: expertise, speed, warranty, location, process, or results.')}>{t('Advantages')}</FieldTitle><textarea disabled={!canEdit} onChange={(event) => updateDraft('advantages', event.target.value)} placeholder={t('One advantage per line')} rows={6} value={draft.advantages} /></label></div>
                </section>

                <section id="company-section-audience" className="company-tab-panel">
                  <div className="company-tab-heading"><span className="material-symbols-outlined" aria-hidden="true">groups</span><div><h4>{t('Audience & market')}</h4><p>{t('Who the content should reach and the market context around them.')}</p></div></div>
                  <div className="company-section-grid"><label className="span-2"><FieldTitle hint={t('Describe the people or companies the content should address: their needs, context, and buying intent.')}>{t('Target audience')}</FieldTitle><textarea disabled={!canEdit} onChange={(event) => updateDraft('targetAudience', event.target.value)} rows={4} value={draft.targetAudience} /></label></div>
                  <div className="company-market-grid">
                    <div className="company-country-picker"><FieldTitle hint={t('Select the country where the company works or wants to attract customers.')}>{t('Country')}</FieldTitle><Select ariaLabel={t('Country')} className="company-country-select" disabled={!canEdit} onChange={(value) => updateDraft('countries', value)} options={countrySelectOptions} value={selectedCountry} /></div>
                    <label><FieldTitle hint={t('Companies customers may compare with you. Add one company per line.')}>{t('Competitors')}</FieldTitle><textarea disabled={!canEdit} onChange={(event) => updateDraft('competitors', event.target.value)} placeholder={t('One company per line')} rows={3} value={draft.competitors} /></label>
                  </div>
                </section>

                <section id="company-section-brand" className="company-tab-panel">
                  <div className="company-tab-heading"><span className="material-symbols-outlined" aria-hidden="true">palette</span><div><h4>{t('Voice & visual identity')}</h4><p>{t('Creative guardrails inherited by generated copy and media.')}</p></div></div>
                  <div className="company-section-grid"><label><FieldTitle hint={t('How the company should sound in text: formal or friendly, concise or detailed, serious or playful.')}>{t('Tone of voice')}</FieldTitle><textarea disabled={!canEdit} onChange={(event) => updateDraft('tone', event.target.value)} rows={4} value={draft.tone} /></label><label><FieldTitle hint={t('The overall character of the brand, including the mood and impression it should create.')}>{t('Brand style')}</FieldTitle><textarea disabled={!canEdit} onChange={(event) => updateDraft('brandStyle', event.target.value)} rows={4} value={draft.brandStyle} /></label><label className="span-2"><FieldTitle hint={t('Rules for generated images and video: colors, composition, forbidden elements, logo use, and photography style.')}>{t('Visual rules')}</FieldTitle><textarea disabled={!canEdit} onChange={(event) => updateDraft('visualRules', event.target.value)} rows={4} value={draft.visualRules} /></label></div>
                </section>

                <section id="company-section-channels" className="company-tab-panel">
                  <div className="company-tab-heading"><span className="material-symbols-outlined" aria-hidden="true">link</span><div><h4>{t('Brand assets & channels')}</h4><p>{t('Optional links and account labels used as supporting context.')}</p></div></div>
                  <div className="company-section-grid"><label><FieldTitle hint={t('A direct public link to the company logo. You can also upload the logo in the panel on the right.')}>{t('Logo URL')}</FieldTitle><input disabled={!canEdit} onChange={(event) => updateDraft('logoUrl', event.target.value)} value={draft.logoUrl} /></label><label><FieldTitle hint={t('Useful public pages that give AI more context, such as catalogs, portfolios, or service pages.')}>{t('Links')}</FieldTitle><input disabled={!canEdit} onChange={(event) => updateDraft('links', event.target.value)} placeholder={t('Comma-separated URLs')} value={draft.links} /></label><label className="span-2"><FieldTitle hint={t('Names or links of the company social profiles used for content and publishing context.')}>{t('Social accounts')}</FieldTitle><input disabled={!canEdit} onChange={(event) => updateDraft('socialAccounts', event.target.value)} placeholder="Instagram, Facebook, LinkedIn" value={draft.socialAccounts} /></label></div>
                </section>

                <div className="company-form-actions"><div><button className={`primary-button company-save-button${isSaved ? ' is-saved' : ''}`} onClick={() => { void saveCompany() }} type="button" disabled={!draft.name.trim() || !canEdit || busy || isSaved}>{isSaved ? t('Profile saved') : t('Save company profile')}</button><button className="secondary-button" disabled={busy || isSaved} onClick={resetDraft} type="button">{t('Discard changes')}</button></div>{draft.id && draft.role === 'owner' && <button className="company-archive-button" disabled={busy} onClick={() => setDeleteArmed((value) => !value)} type="button">{t('Archive company')}</button>}</div>

                {deleteArmed && draft.role === 'owner' && <div className="delete-warning company-archive-warning"><div><strong>{t('Archive this company?')}</strong><p>{t('It will disappear from your workspace. An administrator can restore it.')}</p></div><button className="danger-button" disabled={busy} onClick={() => { void archiveCompany() }} type="button">{t('Confirm archive')}</button><button className="secondary-button" disabled={busy} onClick={() => setDeleteArmed(false)} type="button">{t('Cancel')}</button></div>}
              </div>

              <aside className="company-profile-summary">
                <div className="company-summary-card">
                  <div className="company-logo-row compact"><input accept="image/png,image/jpeg,image/webp" aria-label={t('Choose company image')} className="visually-hidden" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void uploadLogo(file) }} ref={logoInputRef} type="file" /><button aria-label={t('Choose company image')} className="company-logo-preview" disabled={!canUploadLogo || busy} onClick={() => logoInputRef.current?.click()} type="button">{previewLogoUrl && failedLogoUrl !== previewLogoUrl ? <img alt="" onError={() => setFailedLogoUrl(previewLogoUrl)} src={previewLogoUrl} /> : draft.name ? draft.name.slice(0, 2).toUpperCase() : 'CO'}</button><div><strong>{draft.name || t('Untitled company')}</strong></div></div>
                  {logoError && <p className="company-logo-error" role="alert">{logoError}</p>}
                  <div className="company-logo-toolbar"><button className="secondary-button" disabled={!canUploadLogo || busy} onClick={() => logoInputRef.current?.click()} type="button">{t('Upload logo')}</button>{draft.logoImageUrl && onCompanyLogoRemove && <button className="ghost-button" disabled={busy || !canEdit} onClick={() => { void removeLogo() }} type="button">{t('Remove')}</button>}</div>
                  {!draft.id && <small>{t('Save the company before uploading a logo.')}</small>}
                </div>
                <div className="company-summary-card"><div className="company-summary-title"><strong>{t('Profile readiness')}</strong><b>{profileScore}%</b></div><div aria-label={t('Profile readiness')} aria-valuemax={100} aria-valuemin={0} aria-valuenow={profileScore} className="company-readiness-track" role="progressbar"><span style={{ width: `${profileScore}%` }} /></div>{missingEssentials.length ? <><span className="company-missing-label">{t('Recommended next')}</span><ul>{missingEssentials.map((item) => <li key={item}>{t(item)}</li>)}</ul></> : <p className="company-complete-note"><span className="material-symbols-outlined" aria-hidden="true">verified</span>{t('Core profile is ready for generation.')}</p>}</div>
                {aiUncertainties.length > 0 && <div className="company-summary-card attention"><div className="company-summary-title"><strong>{t('Needs your review')}</strong><b>{aiUncertainties.length}</b></div><ul>{aiUncertainties.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div>}
              </aside>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function FieldTitle({ children, hint }: { children: string; hint: string }) {
  return <span className="company-field-title">{children}<span aria-label={hint} className="company-field-help" tabIndex={0}>!<span role="tooltip">{hint}</span></span></span>
}

function ProfileTab({ active, complete, icon, label, onClick }: { active: boolean; complete: boolean; icon: string; label: string; onClick: () => void }) {
  return <button aria-current={active ? 'page' : undefined} className={active ? 'active' : ''} onClick={onClick} type="button"><span className="material-symbols-outlined" aria-hidden="true">{icon}</span><span>{label}</span>{complete && <i aria-label="complete" />}</button>
}

function sectionCompletion(company: Company, fields: Array<keyof Company>) {
  const filled = fields.filter((field) => String(company[field] ?? '').trim()).length
  return Math.round((filled / fields.length) * 100)
}

function getMissingEssentials(company: Company): MissingEssential[] {
  const essentials: Array<[keyof Company, MissingEssential]> = [['description', 'Add a clear company description'], ['services', 'List the main services'], ['targetAudience', 'Define the target audience'], ['tone', 'Set the tone of voice'], ['visualRules', 'Add visual guardrails']]
  return essentials.filter(([field]) => !String(company[field] ?? '').trim()).slice(0, 3).map(([, text]) => text)
}

function calculateReadiness(company: Company) {
  const fields: Array<keyof Company> = ['name', 'site', 'description', 'products', 'services', 'advantages', 'targetAudience', 'tone', 'brandStyle', 'visualRules', 'socialAccounts', 'preferredImageModel', 'preferredVideoModel']
  const filled = fields.filter((field) => String(company[field] ?? '').trim().length > 0).length
  return Math.round((filled / fields.length) * 100)
}

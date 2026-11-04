import type { Company } from '../shared/types/product'
import type { InterfaceLanguage } from '../i18n/context'
import { apiRequest } from './client'

type CompanyDto = {
  id: string
  name: string
  website: string
  description: string
  products: string[]
  services: string[]
  advantages: string[]
  target_audience: string
  tone_of_voice: string
  competitors: string[]
  countries: string[]
  brand_style: string
  visual_rules: string
  logo_url: string
  logo_image_url: string | null
  links: string[]
  social_accounts: string[]
  preferred_image_model: string
  preferred_video_model: string
  role: 'owner' | 'editor' | 'viewer'
  readiness: number
  status: 'active' | 'draft'
  posts: number
  credits: number
}

type Page<T> = { count: number; next: string | null; results: T[] }

type CompanyDraftDto = Pick<CompanyDto,
  'name' | 'website' | 'logo_url' | 'description' | 'products' | 'services' | 'advantages' |
  'target_audience' | 'tone_of_voice' | 'competitors' | 'countries' | 'brand_style' | 'visual_rules'
>

export type GeneratedCompanyDraft = {
  draft: Partial<Company>
  uncertainties: string[]
}

function lines(value?: string): string[] {
  return (value ?? '').split(/\r?\n/).map((part) => part.trim()).filter(Boolean)
}

function commaList(value?: string): string[] {
  return (value ?? '').split(/[,\r\n]+/).map((part) => part.trim()).filter(Boolean)
}

function webUrl(value?: string): string {
  const trimmed = (value ?? '').trim()
  return trimmed && !/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed
}

function fromDto(dto: CompanyDto): Company {
  return {
    id: dto.id,
    role: dto.role,
    name: dto.name,
    site: dto.website,
    status: dto.status === 'active' ? 'Active' : 'Draft',
    tone: dto.tone_of_voice,
    posts: dto.posts,
    readiness: dto.readiness,
    description: dto.description,
    products: dto.products.join('\n'),
    services: dto.services.join('\n'),
    advantages: dto.advantages.join('\n'),
    targetAudience: dto.target_audience,
    competitors: dto.competitors.join('\n'),
    countries: dto.countries.join(', '),
    brandStyle: dto.brand_style,
    visualRules: dto.visual_rules,
    logoUrl: dto.logo_url,
    logoImageUrl: dto.logo_image_url ?? '',
    links: dto.links.join(', '),
    socialAccounts: dto.social_accounts.join(', '),
    preferredImageModel: dto.preferred_image_model,
    preferredVideoModel: dto.preferred_video_model,
    credits: Number(dto.credits) || 0,
  }
}

function toPayload(company: Company) {
  return {
    name: company.name.trim(),
    website: webUrl(company.site),
    description: company.description?.trim() ?? '',
    products: lines(company.products),
    services: lines(company.services),
    advantages: lines(company.advantages),
    target_audience: company.targetAudience?.trim() ?? '',
    tone_of_voice: company.tone?.trim() ?? '',
    competitors: lines(company.competitors),
    countries: commaList(company.countries),
    brand_style: company.brandStyle?.trim() ?? '',
    visual_rules: company.visualRules?.trim() ?? '',
    logo_url: webUrl(company.logoUrl),
    links: commaList(company.links).map(webUrl),
    social_accounts: commaList(company.socialAccounts),
    preferred_image_model: company.preferredImageModel ?? '',
    preferred_video_model: company.preferredVideoModel ?? '',
  }
}

export async function listCompanies(signal?: AbortSignal): Promise<Company[]> {
  const companies: Company[] = []
  let page = 1
  while (true) {
    const data = await apiRequest<Page<CompanyDto>>(`/api/companies?page=${page}`, { signal, retrySafeGet: true })
    companies.push(...data.results.map(fromDto))
    if (!data.next) return companies
    page += 1
  }
}

export async function createCompany(company: Company): Promise<Company> {
  return fromDto(await apiRequest<CompanyDto>('/api/companies', { method: 'POST', body: toPayload(company) }))
}

export async function generateCompanyDraft(company: Company, language: InterfaceLanguage): Promise<GeneratedCompanyDraft> {
  const result = await apiRequest<{ draft: CompanyDraftDto; uncertainties: string[] }>(
    '/api/companies/generate-draft',
    {
      method: 'POST',
      body: {
        name: company.name.trim(),
        website: webUrl(company.site),
        context: company.description?.trim() ?? '',
        language,
      },
    },
  )
  const dto = result.draft
  return {
    draft: {
      name: dto.name,
      site: dto.website,
      logoUrl: dto.logo_url,
      description: dto.description,
      products: dto.products.join('\n'),
      services: dto.services.join('\n'),
      advantages: dto.advantages.join('\n'),
      targetAudience: dto.target_audience,
      tone: dto.tone_of_voice,
      competitors: dto.competitors.join('\n'),
      countries: dto.countries.join(', '),
      brandStyle: dto.brand_style,
      visualRules: dto.visual_rules,
    },
    uncertainties: result.uncertainties,
  }
}

export async function updateCompany(company: Company): Promise<Company> {
  if (!company.id) throw new Error('Company ID is missing')
  return fromDto(await apiRequest<CompanyDto>(`/api/companies/${company.id}`, { method: 'PATCH', body: toPayload(company) }))
}

export async function uploadCompanyLogo(companyId: string, file: File): Promise<Company> {
  const form = new FormData()
  form.append('file', file)
  return fromDto(await apiRequest<CompanyDto>(`/api/companies/${companyId}/logo`, { method: 'POST', body: form }))
}

export async function removeCompanyLogo(companyId: string): Promise<Company> {
  return fromDto(await apiRequest<CompanyDto>(`/api/companies/${companyId}/logo`, { method: 'DELETE' }))
}

export async function selectCompany(companyId: string): Promise<Company> {
  return fromDto(await apiRequest<CompanyDto>(`/api/companies/${companyId}/select`, { method: 'POST' }))
}

export function archiveCompany(companyId: string) {
  return apiRequest<void>(`/api/companies/${companyId}`, { method: 'DELETE' })
}

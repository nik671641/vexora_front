import './BrandLogo.css'

export const BRAND_NAME = 'Vexora'

export function BrandLogo({ tone = 'default' }: { tone?: 'default' | 'light' }) {
  return <span className={`brand-logo brand-logo--${tone}`}>{BRAND_NAME}</span>
}

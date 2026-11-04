import './BrandLogo.css'

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <img
      aria-hidden="true"
      className={`brand-symbol ${className}`}
      src="/vexora-logo.svg"
      alt=""
      draggable={false}
    />
  )
}

export function BrandLogo({ tone = 'default' }: { tone?: 'default' | 'light' }) {
  return (
    <span className={`brand-logo brand-logo--${tone}`}>
      <BrandMark />
      <span className="brand-wordmark">Vexora</span>
    </span>
  )
}

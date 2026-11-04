import { useEffect } from 'react'
import type { SupportMessage } from '../support/supportDemo'

/**
 * Landing page — pixel-port of
 * vexora_autoadify_inspired_dark_landing_page/code.html
 * Rendered strictly in English; the orange/amber palette is isolated in
 * .landing-orange so the rest of the app keeps its violet theme.
 */
type LandingPageProps = {
  onSignIn: () => void
  onRegister: () => void
  supportMessages: SupportMessage[]
  onSupportSend: (text: string) => void
}

const marqueeItems: { label: string; dot?: string }[] = [
  { label: 'GPT-5.6', dot: 'bg-primary-container' },
  { label: 'Claude Opus 4.8', dot: 'bg-status-info' },
  { label: 'Veo 3.1 4K', dot: 'bg-status-operational' },
  { label: 'Kling 3.0 Pro', dot: 'bg-status-warning' },
  { label: 'Higgsfield Seedance 2.0' },
  { label: 'Runway Gen-4.5' },
  { label: 'Gemini 3.1 Pro' },
  { label: 'ElevenLabs Dialogue v3' },
  { label: 'Nano Banana Pro' },
  { label: 'Grok 4.3' },
]

export function LandingPage({ onSignIn, onRegister }: LandingPageProps) {
  // Dark overscroll background while the landing is mounted.
  useEffect(() => {
    document.documentElement.classList.add('landing-active')
    return () => document.documentElement.classList.remove('landing-active')
  }, [])

  // In-page anchors scroll instead of touching the router fragment.
  const sc = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const auth = (fn: () => void) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    fn()
  }

  return (
    <div className="landing landing-orange bg-canvas-base text-text-primary antialiased selection:bg-primary-container selection:text-text-primary min-h-screen flex flex-col font-body-md text-body-md overflow-x-hidden">
      {/* 1. ANNOUNCEMENT TOP BAR (empty in the design but keeps the border) */}
      <aside aria-label="Announcement" className="w-full bg-surface-container-lowest border-b border-border-structural/80 py-2.5 px-4 text-center relative z-50" />

      {/* 2. STICKY HEADER */}
      <header className="bg-canvas-base/90 backdrop-blur-md top-0 sticky z-50 border-b border-border-structural shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Brand Logo (new Vexora mark) */}
          <a className="text-headline-md font-headline-md font-bold tracking-tight text-text-primary flex items-center gap-2.5 group" href="#" onClick={sc('ai-manager')}>
            <img src="/vexora-logo.svg" alt="Vexora" className="w-14 h-14 group-hover:scale-105 transition-transform duration-150" />
            <span className="tracking-tight font-extrabold text-headline-md">Vexora</span>
            <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-wider font-semibold rounded bg-surface-layer-2 text-text-tertiary border border-border-structural">v3.2</span>
          </a>
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 font-label-md text-label-md">
            <a className="text-text-primary font-semibold border-b-2 border-primary-container pb-1 transition-colors duration-150" href="#ai-manager" onClick={sc('ai-manager')}>AI Manager</a>
            <a className="text-text-tertiary hover:text-text-primary transition-colors duration-150 hover:border-primary-container/40" href="#workflows" onClick={sc('workflows')}>Workflows</a>
            <a className="text-text-tertiary hover:text-text-primary transition-colors duration-150 hover:border-primary-container/40" href="#ai-studio" onClick={sc('ai-studio')}>AI Studio</a>
            <a className="text-text-tertiary hover:text-text-primary transition-colors duration-150 hover:border-primary-container/40" href="#integrations" onClick={sc('developer-mcp')}>Integrations</a>
            <a className="text-text-tertiary hover:text-text-primary transition-colors duration-150 hover:border-primary-container/40" href="#pricing" onClick={sc('pricing')}>Pricing</a>
            <a className="text-text-tertiary hover:text-text-primary transition-colors duration-150 hover:border-primary-container/40" href="#developer-mcp" onClick={sc('developer-mcp')}>API &amp; MCP</a>
          </nav>
          {/* Trailing Action Buttons */}
          <div className="flex items-center gap-3">
            <a className="hidden sm:inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-layer-1 border border-transparent hover:border-border-structural font-label-lg text-label-lg transition-all duration-150" href="#signin" onClick={auth(onSignIn)}>
              Sign in
            </a>
            <a className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-text-primary font-label-lg text-label-lg font-semibold amber-glow-btn hover:bg-accent-orange-deep active:scale-[0.99] transition-all duration-150 border border-primary-fixed/20" href="#register" onClick={auth(onRegister)}>
              <span>Create account</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* 3. HERO SECTION */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
          {/* Ambient Background Glow Gradients */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary-container/10 blur-[130px] rounded-full pointer-events-none -z-10"></div>
          <div className="absolute top-64 right-10 w-[420px] h-[300px] bg-accent-orange-deep/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-layer-1 border border-border-interactive/80 text-text-secondary mb-6 font-label-sm text-label-sm shadow-sm hover:border-primary-container/50 transition-colors">
              <span className="material-symbols-outlined text-accent-amber-glow text-base">bolt</span>
              <span>No API keys, no extra subscriptions · 80+ AI Models</span>
            </div>
            {/* Headline */}
            <h1 className="font-display-lg text-headline-xl-mobile sm:text-headline-xl md:text-display-lg font-extrabold tracking-tight text-text-primary max-w-4xl mx-auto leading-tight">
              AI social media automation, powered by one <span className="bg-clip-text text-transparent bg-gradient-to-r from-text-primary via-primary-container to-accent-amber-glow">AI Agent</span>, Workflows &amp; 80+ AI Models
            </h1>
            {/* Subheadline */}
            <p className="mt-6 font-body-lg text-body-md sm:text-body-lg text-text-tertiary max-w-3xl mx-auto">
              One agent plans the campaign, 80+ best-in-class models (Kling, Seedance, Veo 3.1, GPT-5.6, Claude Opus 4.8) make the copy, images and video, and workflows repeat it across 10 platforms. You approve before anything goes live.
            </p>
            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <a className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-primary-container text-text-primary font-label-lg text-label-lg font-bold amber-glow-btn hover:bg-accent-orange-deep active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-primary-fixed/30" href="#register" onClick={auth(onRegister)}>
                <span>Create account</span>
                <span className="material-symbols-outlined text-lg">bolt</span>
              </a>
              <a className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-surface-layer-1 hover:bg-surface-layer-2 text-text-secondary hover:text-text-primary font-label-lg text-label-lg font-semibold border border-border-structural hover:border-border-interactive transition-all flex items-center justify-center gap-2" href="#workflows" onClick={sc('workflows')}>
                <span>Explore AI Workflows</span>
                <span className="material-symbols-outlined text-lg text-text-muted">account_tree</span>
              </a>
            </div>
            {/* Guarantees Row */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-8 font-label-sm text-label-sm text-text-tertiary">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-status-operational text-base">check_circle</span>
                <span>No credit card to start</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-status-operational text-base">check_circle</span>
                <span>Free plan available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-status-operational text-base">check_circle</span>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
          {/* Live Marquee Ticker */}
          <div className="mt-14 w-full border-y border-border-structural/60 bg-surface-dim/70 backdrop-blur-sm py-3.5 overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-canvas-base to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-canvas-base to-transparent z-10 pointer-events-none"></div>
            <div className="animate-marquee whitespace-nowrap">
              {[0, 1].map((batch) => (
                <div key={batch} className="flex items-center gap-6 pr-6 text-text-tertiary text-xs font-mono uppercase tracking-wider font-semibold">
                  {marqueeItems.map((item) => (
                    <span key={item.label} className="px-3 py-1 rounded bg-surface-layer-1 border border-border-structural flex items-center gap-1.5 text-text-secondary">
                      {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`}></span>}
                      {item.label}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* 4. INTERACTIVE PRODUCT WINDOW (AI MANAGER SHOWCASE) */}
        <section className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="ai-manager">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-accent-amber-glow font-label-sm text-label-sm uppercase tracking-wider font-semibold">Live Experience</span>
            <h2 className="text-headline-lg font-headline-lg text-text-primary mt-1">A look inside the AI Manager</h2>
            <p className="text-text-tertiary font-body-md text-body-md mt-2">Plan an entire campaign in one prompt. Review every platform draft, adjust instantly, and approve with a single click.</p>
          </div>
          {/* App Console Mockup Frame */}
          <div className="w-full rounded-xl bg-surface-layer-1 border border-border-interactive shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* App Window Header Bar */}
            <div className="h-11 bg-surface-dim border-b border-border-structural px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-status-critical/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-status-warning/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-status-operational/80 inline-block"></span>
              </div>
              {/* URL Pill */}
              <div className="px-4 py-1 rounded-md bg-canvas-base border border-border-structural font-mono text-xs text-text-tertiary flex items-center gap-2">
                <span className="material-symbols-outlined text-xs text-status-operational">lock</span>
                <span className="text-text-secondary font-medium">app.vexora.ai/ai-manager</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
                <span className="px-2 py-0.5 rounded bg-surface-layer-2 border border-border-structural hidden sm:inline">⌘K</span>
                <span className="w-2 h-2 rounded-full bg-status-operational"></span>
              </div>
            </div>
            {/* App Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
              {/* Left App Sidebar (3 cols) */}
              <div className="lg:col-span-3 bg-surface-dim border-r border-border-structural p-4 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Workspace Switcher */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-layer-1 border border-border-structural">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-accent-amber-glow font-bold text-xs">AF</div>
                      <div>
                        <div className="text-text-primary text-xs font-semibold">Apex Contracting</div>
                        <div className="text-text-muted text-[11px] font-mono">@apex.builds</div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-text-muted text-sm">unfold_more</span>
                  </div>
                  {/* Navigation links */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary-container/15 text-text-primary border-l-2 border-primary-container font-label-md text-label-md font-semibold">
                      <span className="material-symbols-outlined text-accent-amber-glow text-base">smart_toy</span>
                      <span>AI Manager</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-text-tertiary hover:bg-surface-layer-1 font-label-md text-label-md cursor-pointer">
                      <span className="material-symbols-outlined text-base">palette</span>
                      <span>AI Studio</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-text-tertiary hover:bg-surface-layer-1 font-label-md text-label-md cursor-pointer">
                      <span className="material-symbols-outlined text-base">account_tree</span>
                      <span>Workflows</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-text-tertiary hover:bg-surface-layer-1 font-label-md text-label-md cursor-pointer">
                      <span className="material-symbols-outlined text-base">calendar_month</span>
                      <span>Calendar</span>
                    </div>
                  </div>
                  {/* Chat History Section */}
                  <div className="pt-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted mb-2 px-2">Active Sessions</div>
                    <div className="space-y-1">
                      <div className="px-2.5 py-1.5 rounded bg-surface-layer-2 text-text-secondary text-xs font-medium truncate border-l border-primary-container">Residential Exterior Launch</div>
                      <div className="px-2.5 py-1.5 rounded hover:bg-surface-layer-1 text-text-muted text-xs truncate cursor-pointer">Commercial Drone Reels</div>
                      <div className="px-2.5 py-1.5 rounded hover:bg-surface-layer-1 text-text-muted text-xs truncate cursor-pointer">Jobsite Before / After Sprint</div>
                      <div className="px-2.5 py-1.5 rounded hover:bg-surface-layer-1 text-text-muted text-xs truncate cursor-pointer">Black Friday Equipment Sale</div>
                    </div>
                  </div>
                </div>
                {/* Connected Accounts Footnote */}
                <div className="pt-4 border-t border-border-structural/60">
                  <div className="text-[11px] font-mono text-text-muted mb-1.5 flex items-center justify-between">
                    <span>CONNECTED PLATFORMS</span>
                    <span className="text-status-operational font-bold">10/10</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-tertiary">
                    <span className="material-symbols-outlined text-xs text-status-operational">check_circle</span>
                    <span className="text-[11px]">Procore &amp; Shopify Synced (1m ago)</span>
                  </div>
                </div>
              </div>
              {/* Main Transcript Canvas (9 cols) */}
              <div className="lg:col-span-9 bg-surface-floor p-4 sm:p-6 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Prompt from User */}
                  <div className="flex items-start gap-3 justify-end">
                    <div className="max-w-xl bg-surface-layer-2 border border-border-interactive rounded-xl rounded-tr-none p-4 text-text-primary text-body-md">
                      <p className="font-medium text-text-secondary">
                        “Plan launch week for our new residential exterior line: three project showcases, one post a day, each with cinematic video. Keep it on-brand, local Seattle hashtags, under 150 characters.”
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-surface-bright flex items-center justify-center text-text-primary font-bold text-xs shrink-0 border border-border-structural">YOU</div>
                  </div>
                  {/* AI Agent Execution Status Card */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-accent-orange-deep flex items-center justify-center text-text-primary text-xs shrink-0 shadow-md">
                      <span className="material-symbols-outlined text-sm">smart_toy</span>
                    </div>
                    <div className="flex-grow space-y-3">
                      <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-4 max-w-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-border-structural/70">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-status-operational animate-ping"></span>
                            <span className="text-text-primary font-semibold text-xs">Finished: 8 of 8 steps done</span>
                          </div>
                          <span className="text-text-muted font-mono text-xs">1m 24s total</span>
                        </div>
                        {/* Steps checklist mini */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px] font-mono text-text-tertiary">
                          <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Catalog Synced</div>
                          <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Brand Voice Set</div>
                          <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Kling 3.0 Cloned</div>
                          <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Slots Scheduled</div>
                        </div>
                      </div>
                      {/* Approval Required Banner */}
                      <div className="bg-surface-layer-1 border-2 border-primary-container/60 rounded-xl p-4 max-w-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 px-3 py-1 bg-primary-container/20 border-b border-l border-primary-container/40 text-accent-amber-glow font-mono text-[10px] uppercase font-bold tracking-wider">
                          Approval Required
                        </div>
                        <h3 className="text-headline-sm font-headline-sm text-text-primary font-bold">Content Plan: 3 posts · Tue 21 Oct – Thu 23 Oct</h3>
                        <p className="text-body-sm text-text-tertiary mt-1">
                          Approving saves them as drafts. Nothing is published until you press Schedule.
                        </p>
                        {/* Post Previews Carousel / Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                          {/* Post 1 */}
                          <div className="bg-surface-dim border border-border-structural rounded-lg p-2.5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-text-muted font-mono mb-2">
                                <span>Tue 21 Oct · 10:00</span>
                                <span className="text-accent-amber-glow">Instagram</span>
                              </div>
                              <div className="h-28 rounded bg-surface-layer-2 border border-border-structural flex items-center justify-center relative overflow-hidden mb-2">
                                <img className="w-full h-full object-cover" alt="A cinematic architectural close-up of dark modern cedar shingle siding on a luxury contemporary home during Pacific Northwest golden hour" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-WGHex-Fp3ciErcr4kKGtN_PR0_PeRtSkny64p4fYXpLzjWBWt6rM8zSVh1rZZvhRPylvVOL_EV69wn4xZxNa2wBuz_QxxlMgaU11Xsrdf4GmOlttgFcxeN5fD3N4iZDJkToIvSzX5Mh6bmeMFTs3VdU_SRs4EdEhGF7fWUyK0s0qzvsEamaFMHp_UJ0eVo71GofL64ZJzJomcwH5Orxm-ZHPVMWs7_sMC4NMH_O-VzvFHVrwJd1x" />
                                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-canvas-base/80 font-mono text-[9px] text-text-primary">Veo 3.1</span>
                              </div>
                              <p className="text-[11px] text-text-secondary leading-snug line-clamp-2">
                                Cedar siding precision in Mercer Island. Clean lines, lifetime sealant.
                              </p>
                            </div>
                            <div className="mt-2 text-[10px] font-mono text-text-muted">#SeattleBuilder #ModernLiving</div>
                          </div>
                          {/* Post 2 */}
                          <div className="bg-surface-dim border border-border-structural rounded-lg p-2.5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-text-muted font-mono mb-2">
                                <span>Wed 22 Oct · 12:30</span>
                                <span className="text-status-info">TikTok</span>
                              </div>
                              <div className="h-28 rounded bg-surface-layer-2 border border-border-structural flex items-center justify-center relative overflow-hidden mb-2">
                                <img className="w-full h-full object-cover" alt="Dynamic vertical drone footage push-in toward a standing seam matte black metal roof installation" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWfuMiL03LtxTlbEP3y_VqRNlp-1zZeOJAOpGu6d5Elcd5zKWDQQjQrPtW5nG6pfe4fPWc4bcHVKvSGezZVA9OiAKywoGVNuBazGPLqf8jgXq0ai5P-Rfu2WCTCSlWkEu6QadOOL0jDwwCyUdIdxnDbi2JLWOFXWAh2d4hQxaKsBG-0IK9VQtLSdA7eCEpOgQunOlopIEy2BCZlKRkG83ElVqeIIeU79q5WLHSj0YiFPmN2azmvdkX" />
                                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-canvas-base/80 font-mono text-[9px] text-text-primary">Kling 3.0</span>
                              </div>
                              <p className="text-[11px] text-text-secondary leading-snug line-clamp-2">
                                Watch 48 hours of standing seam steel roof installation in 7 seconds.
                              </p>
                            </div>
                            <div className="mt-2 text-[10px] font-mono text-text-muted">#TradeCraft #RoofingReels</div>
                          </div>
                          {/* Post 3 */}
                          <div className="bg-surface-dim border border-border-structural rounded-lg p-2.5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-text-muted font-mono mb-2">
                                <span>Thu 23 Oct · 18:00</span>
                                <span className="text-status-operational">LinkedIn</span>
                              </div>
                              <div className="h-28 rounded bg-surface-layer-2 border border-border-structural flex items-center justify-center relative overflow-hidden mb-2">
                                <img className="w-full h-full object-cover" alt="Before and after split architectural photography of a commercial brick facade renovated" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFdrWptgVbVdIcMLo6K9e2tZMXDag2lAm4ug6WjjRkplOqdxvmibvgmrlD7ElK_cx8s7tYMU1FWTX8rQnXt4k7lD2Ra2PpoAY5J-mauXSgiK0VO1R9HCDudkWDdQtsXhcP5e43mssIv-w_ia9s2mJtIMo2tzIdt3WF7oRvHagjd16WQfzInDKn7oRNhv7Hqk5aBf6QnoJy9u3_aXFoMMdG9vOm39taWmOWozUXGvLFjtDuN1B4oaG4" />
                                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-canvas-base/80 font-mono text-[9px] text-text-primary">Seedream 5</span>
                              </div>
                              <p className="text-[11px] text-text-secondary leading-snug line-clamp-2">
                                Structural exterior retrofitting for high wind zones: 3 things we learned.
                              </p>
                            </div>
                            <div className="mt-2 text-[10px] font-mono text-text-muted">#CommercialGeneral #ProjectLog</div>
                          </div>
                        </div>
                        {/* Action Decision Buttons */}
                        <div className="mt-4 pt-3 border-t border-border-structural flex items-center justify-end gap-3">
                          <button className="px-4 py-2 rounded-lg bg-surface-layer-2 hover:bg-surface-layer-3 text-text-tertiary hover:text-text-primary text-label-md font-label-md border border-border-structural transition-all" type="button">
                            Reject / Change Prompt
                          </button>
                          <button className="px-5 py-2 rounded-lg bg-primary-container hover:bg-accent-orange-deep text-text-primary text-label-md font-label-md font-bold amber-glow-btn transition-all flex items-center gap-1.5" type="button">
                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                            <span>Approve 3 Posts</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Bottom Prompt Input Simulator */}
                <div className="mt-6 pt-4 border-t border-border-structural/80 flex items-center gap-2">
                  <div className="flex-grow relative">
                    <input className="w-full h-11 bg-surface-dim border border-border-interactive rounded-lg px-3.5 text-text-primary placeholder:text-text-muted text-body-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" placeholder="Reply to adjust voice, swap models, or push dates (e.g. 'Make TikTok hook punchier')..." type="text" />
                  </div>
                  <button className="h-11 px-4 rounded-lg bg-surface-layer-2 hover:bg-primary-container text-text-secondary hover:text-text-primary border border-border-structural font-label-md text-label-md transition-all flex items-center gap-1" type="button">
                    <span>Send</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. 3-STEP FOUNDATION ("Everything already connected") */}
        <section className="py-16 md:py-24 bg-surface-layer-1 border-y border-border-structural">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-accent-amber-glow font-label-sm text-label-sm uppercase tracking-wider font-semibold">Core Architecture</span>
              <h2 className="text-headline-xl font-headline-xl text-text-primary font-bold mt-1">Everything already connected</h2>
              <p className="text-text-tertiary font-body-lg text-body-lg mt-3">
                One subscription covers the models, your storefront, your jobsite assets, and every platform. No API keys, no extra subscriptions, no tab-switching.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 01 */}
              <div className="bg-surface-dim border border-border-structural rounded-xl p-6 relative group amber-card-hairline transition-all">
                <div className="font-mono text-accent-amber-glow text-sm font-bold tracking-wider mb-3">01 · CREATE</div>
                <h3 className="text-headline-md font-headline-md font-bold text-text-primary">80+ AI models</h3>
                <p className="text-text-tertiary text-body-sm font-body-sm mt-2">
                  Text, image, video and voice. Swap any model at any step — Kling, Veo 3.1, Claude Opus, GPT-5.6 — with zero API keys to configure.
                </p>
                <div className="mt-6 flex flex-wrap gap-1.5 font-mono text-[11px] text-text-secondary">
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">GPT-5.6</span>
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">Claude 4.8</span>
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">Kling 3.0</span>
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">Veo 3.1</span>
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">ElevenLabs</span>
                </div>
              </div>
              {/* Step 02 */}
              <div className="bg-surface-dim border border-border-structural rounded-xl p-6 relative group amber-card-hairline transition-all">
                <div className="font-mono text-accent-amber-glow text-sm font-bold tracking-wider mb-3">02 · SOURCE</div>
                <h3 className="text-headline-md font-headline-md font-bold text-text-primary">Your own material</h3>
                <p className="text-text-tertiary text-body-sm font-body-sm mt-2">
                  Jobsite photos, 4K drone clips, past post archives, brand guidelines, or live Shopify &amp; CRM catalogs. It works from what you already have.
                </p>
                <div className="mt-6 flex flex-wrap gap-1.5 font-mono text-[11px] text-text-secondary">
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">Shopify</span>
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">WooCommerce</span>
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">Procore</span>
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">Google Drive</span>
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">Brand Kits</span>
                </div>
              </div>
              {/* Step 03 */}
              <div className="bg-surface-dim border border-border-structural rounded-xl p-6 relative group amber-card-hairline transition-all">
                <div className="font-mono text-accent-amber-glow text-sm font-bold tracking-wider mb-3">03 · PUBLISH</div>
                <h3 className="text-headline-md font-headline-md font-bold text-text-primary">10 platforms</h3>
                <p className="text-text-tertiary text-body-sm font-body-sm mt-2">
                  Scheduled at the best algorithmic window for each channel, then published automatically via official verified APIs once approved.
                </p>
                <div className="mt-6 flex flex-wrap gap-1.5 font-mono text-[11px] text-text-secondary">
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">Instagram</span>
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">TikTok</span>
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">YouTube</span>
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">LinkedIn</span>
                  <span className="px-2.5 py-1 rounded bg-surface-layer-2 border border-border-structural">X / Meta / Threads</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* 6. AUDIENCE GRID ("One input in. A week of content out.") */}
        <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-accent-amber-glow font-label-sm text-label-sm uppercase tracking-wider font-semibold">Tailored Workflows</span>
            <h2 className="text-headline-xl font-headline-xl text-text-primary font-bold mt-1">One input in. A week of content out.</h2>
            <p className="text-text-tertiary font-body-md text-body-md mt-2">
              Whatever you already produce, Vexora turns it into everything else. Bring rough footage, job updates, a store catalog — or a single sentence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-6 hover:border-border-interactive transition-all">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-surface-layer-2 text-text-secondary text-xs font-semibold">Content Creators &amp; Media</span>
                <span className="material-symbols-outlined text-text-muted">movie</span>
              </div>
              <h3 className="text-headline-md font-headline-md font-bold text-text-primary mt-4">One video. Ten platforms.</h3>
              <p className="text-text-tertiary text-body-sm font-body-sm mt-2">
                Bring a script, a raw longform recording, or a rough idea. Vexora writes platform-tailored hooks, renders 9:16 vertical b-roll cuts, and sets optimal tags.
              </p>
              <div className="mt-6 pt-4 border-t border-border-structural grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-dim p-3 rounded-lg border border-border-structural">
                  <span className="text-text-muted font-mono block text-[10px]">YOU GIVE IT</span>
                  <span className="text-text-primary font-medium mt-1 block">1 script or raw clip</span>
                </div>
                <div className="bg-surface-dim p-3 rounded-lg border border-primary-container/30">
                  <span className="text-accent-amber-glow font-mono block text-[10px]">IT PUBLISHES</span>
                  <span className="text-text-primary font-medium mt-1 block">Full week of clips &amp; posts</span>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-6 hover:border-border-interactive transition-all">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-surface-layer-2 text-text-secondary text-xs font-semibold">Trade Contractors &amp; Builders</span>
                <span className="material-symbols-outlined text-text-muted">construction</span>
              </div>
              <h3 className="text-headline-md font-headline-md font-bold text-text-primary mt-4">Jobsite photos turn into leads.</h3>
              <p className="text-text-tertiary text-body-sm font-body-sm mt-2">
                Snap project photos or upload drone walkthroughs before you leave the site. AI sharpens framing, writes case study captions, and targets local zip codes.
              </p>
              <div className="mt-6 pt-4 border-t border-border-structural grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-dim p-3 rounded-lg border border-border-structural">
                  <span className="text-text-muted font-mono block text-[10px]">YOU GIVE IT</span>
                  <span className="text-text-primary font-medium mt-1 block">3 site completion photos</span>
                </div>
                <div className="bg-surface-dim p-3 rounded-lg border border-primary-container/30">
                  <span className="text-accent-amber-glow font-mono block text-[10px]">IT PUBLISHES</span>
                  <span className="text-text-primary font-medium mt-1 block">Geo-targeted multi-channel reel</span>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-6 hover:border-border-interactive transition-all">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-surface-layer-2 text-text-secondary text-xs font-semibold">Brands &amp; E-commerce Stores</span>
                <span className="material-symbols-outlined text-text-muted">shopping_bag</span>
              </div>
              <h3 className="text-headline-md font-headline-md font-bold text-text-primary mt-4">Products post themselves.</h3>
              <p className="text-text-tertiary text-body-sm font-body-sm mt-2">
                Connect Shopify or WooCommerce. The moment you publish a new SKU, Vexora detects price and imagery to launch an automated 3-day multi-asset campaign.
              </p>
              <div className="mt-6 pt-4 border-t border-border-structural grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-dim p-3 rounded-lg border border-border-structural">
                  <span className="text-text-muted font-mono block text-[10px]">YOU GIVE IT</span>
                  <span className="text-text-primary font-medium mt-1 block">1 new SKU in store</span>
                </div>
                <div className="bg-surface-dim p-3 rounded-lg border border-primary-container/30">
                  <span className="text-accent-amber-glow font-mono block text-[10px]">IT PUBLISHES</span>
                  <span className="text-text-primary font-medium mt-1 block">Live across feeds instantly</span>
                </div>
              </div>
            </div>
            {/* Card 4 */}
            <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-6 hover:border-border-interactive transition-all">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-surface-layer-2 text-text-secondary text-xs font-semibold">Solo Operators &amp; Tech Founders</span>
                <span className="material-symbols-outlined text-text-muted">terminal</span>
              </div>
              <h3 className="text-headline-md font-headline-md font-bold text-text-primary mt-4">Build in public. Automatically.</h3>
              <p className="text-text-tertiary text-body-sm font-body-sm mt-2">
                AI converts git commits, sprint notes, or bullet changelogs into engaging high-impact threads, LinkedIn carousel decks, and video updates.
              </p>
              <div className="mt-6 pt-4 border-t border-border-structural grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-dim p-3 rounded-lg border border-border-structural">
                  <span className="text-text-muted font-mono block text-[10px]">YOU GIVE IT</span>
                  <span className="text-text-primary font-medium mt-1 block">Weekly changelog bullet list</span>
                </div>
                <div className="bg-surface-dim p-3 rounded-lg border border-primary-container/30">
                  <span className="text-accent-amber-glow font-mono block text-[10px]">IT PUBLISHES</span>
                  <span className="text-text-primary font-medium mt-1 block">Build-in-public stories &amp; posts</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. AI STUDIO FEATURE SECTION (Model Stats & Playground Widget) */}
        <section className="py-16 md:py-24 bg-surface-dim border-t border-border-structural" id="ai-studio">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-accent-amber-glow font-label-sm text-label-sm uppercase tracking-wider font-semibold">The Engine</span>
              <h2 className="text-headline-xl font-headline-xl text-text-primary font-bold mt-1">
                The world's best AI models, working alongside you.
              </h2>
              <p className="text-text-tertiary font-body-lg text-body-lg mt-3">
                Not one model — a whole roster. GPT-5.6 and Claude Opus 4.8 write your captions, Nano Banana Pro designs visuals, Veo 3.1 and Kling 3.0 turn them into video, ElevenLabs gives them voice.
              </p>
            </div>
            {/* 4 Stats Badges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-5">
                <div className="text-metric-num font-metric-num text-primary-container">24</div>
                <div className="text-text-primary font-semibold text-sm mt-1">Text Models</div>
                <div className="text-text-muted text-xs font-mono mt-1">GPT-5.6, Claude Opus 4.8, Gemini 3.1</div>
              </div>
              <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-5">
                <div className="text-metric-num font-metric-num text-accent-amber-glow">23</div>
                <div className="text-text-primary font-semibold text-sm mt-1">Image Models</div>
                <div className="text-text-muted text-xs font-mono mt-1">Nano Banana Pro, Seedream 5 Pro</div>
              </div>
              <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-5">
                <div className="text-metric-num font-metric-num text-status-operational">37</div>
                <div className="text-text-primary font-semibold text-sm mt-1">Video Models</div>
                <div className="text-text-muted text-xs font-mono mt-1">Veo 3.1, Kling 3.0 4K, Runway Gen-4.5</div>
              </div>
              <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-5">
                <div className="text-metric-num font-metric-num text-status-info">3</div>
                <div className="text-text-primary font-semibold text-sm mt-1">Audio Models</div>
                <div className="text-text-muted text-xs font-mono mt-1">ElevenLabs Dialogue v3, Music Gen</div>
              </div>
            </div>
            {/* Interactive Studio Playground Widget */}
            <div className="bg-surface-layer-1 border border-border-interactive rounded-xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-surface-layer-2 border-b border-border-structural flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary-container"></span>
                  <span className="text-text-primary font-semibold text-sm">AI Studio Workbench</span>
                </div>
                {/* Model Category Selector Tabs */}
                <div className="flex items-center gap-1 bg-surface-dim p-1 rounded-lg border border-border-structural font-label-sm text-label-sm">
                  <button className="px-3 py-1 rounded bg-surface-layer-1 text-text-primary font-semibold border border-border-interactive" type="button">Text &amp; Copy</button>
                  <button className="px-3 py-1 rounded text-text-tertiary hover:text-text-primary" type="button">Image Gen</button>
                  <button className="px-3 py-1 rounded text-text-tertiary hover:text-text-primary" type="button">Video 4K</button>
                  <button className="px-3 py-1 rounded text-text-tertiary hover:text-text-primary" type="button">Audio Voice</button>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Playground Left: Model config & prompt */}
                <div className="lg:col-span-6 space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-text-muted mb-1.5">Selected Primary Model</label>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-dim border border-border-structural">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-primary-container">tune</span>
                        <div>
                          <div className="text-text-primary text-xs font-bold">Veo 3.1 + Kling 3.0 Pro Reel Sync</div>
                          <div className="text-text-muted text-[11px]">80+ available · Swap any model at any step</div>
                        </div>
                      </div>
                      <span className="text-xs text-status-operational font-mono">Ready</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-text-muted mb-1.5">Active Prompt</label>
                    <div className="p-3 bg-surface-dim border border-border-structural rounded-lg text-body-sm text-text-secondary font-mono leading-relaxed">
                      “Launch post for Apex Roofing architectural shingles — cinematic drone push-in, golden hour light, under 30 words, with natural ambient timber and tool audio.”
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs text-text-tertiary mb-2 font-mono">
                      <span className="">Output: 3 variants · 1.8s generation</span>
                      <span className="text-accent-amber-glow">9:16 Ultra HD</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-layer-2 border border-border-structural text-text-primary text-body-sm">
                      <p className="font-medium">
                        “Engineered for 130 mph coastal gusts, finished with razor-sharp shadow lines. 🔨 The Apex Series is now live in Northwest territory. Ready to upgrade your exterior?”
                      </p>
                      <div className="mt-2 text-xs font-mono text-accent-amber-glow">#ApexRoofing #ContractorCraft #ExteriorArchitecture</div>
                    </div>
                  </div>
                </div>
                {/* Playground Right: Dynamic Video Mockup */}
                <div className="lg:col-span-6 flex flex-col justify-center items-center">
                  <div className="w-full max-w-sm rounded-xl overflow-hidden border border-border-interactive bg-surface-dim shadow-xl relative group">
                    {/* 9:16 Aspect Video Simulator */}
                    <div className="aspect-[9/16] w-full relative overflow-hidden bg-canvas-base flex items-center justify-center">
                      <img className="w-full h-full object-cover" alt="A striking hyper-realistic 9:16 vertical video reel showing a modern black architectural roof installation in progress on a luxury mountain estate at golden hour. Drone camera smoothly tracks downward revealing clean precision shingle edges, sharp mechanical lines, rich deep obsidian textures, and subtle warm orange rim lighting reflections." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXr9tH7abe8M4etJ34DjDuoJZl72SyPpiQc9zvp2lAhhgWkPvOrqei8hEij8-qJZuCI8j9MShbaQlasSABpgDaECbu5EIOIIUZGgbN5gwTGWCKcszstaQnxFclJ3AvVYHvPJXYTPvSSfWGITzvO3me03h3n3-syNEvOCXIW_TtUAMaD5JiMeEHWC2kaDbeQ7HV7i5RlKkqewdW4BGhLnkOelRlS6va9sm1SuREDkylrfbaSSYl03T8" />
                      {/* Overlay Badges */}
                      <div className="absolute top-3 left-3 px-2 py-1 rounded bg-canvas-base/80 backdrop-blur-md text-[10px] font-mono text-text-primary border border-border-structural flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-status-operational animate-pulse"></span>
                        <span className="">Veo 3.1 Reel</span>
                      </div>
                      <div className="absolute top-3 right-3 px-2 py-1 rounded bg-canvas-base/80 backdrop-blur-md text-[10px] font-mono text-accent-amber-glow border border-border-structural">
                        8s · 9:16 Native
                      </div>
                      {/* Center Play Button Simulator */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-primary-container/90 text-text-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer">
                          <span className="material-symbols-outlined text-2xl" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        </div>
                      </div>
                      {/* Simulated scrubber */}
                      <div className="absolute bottom-3 inset-x-3 bg-canvas-base/80 backdrop-blur-md p-2 rounded-lg border border-border-structural">
                        <div className="w-full bg-surface-layer-3 h-1 rounded-full overflow-hidden">
                          <div className="bg-primary-container h-full w-2/3"></div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary mt-1">
                          <span className="">00:05</span>
                          <span className="">Native Audio Active</span>
                        </div>
                      </div>
                    </div>
                    {/* Footer CTA inside card */}
                    <div className="p-3 bg-surface-layer-1 flex items-center justify-between">
                      <span className="text-xs text-text-secondary font-medium">Ready for Instagram &amp; TikTok</span>
                      <button className="px-3 py-1.5 rounded bg-primary-container text-text-primary text-xs font-semibold hover:bg-accent-orange-deep transition-all" type="button">
                        Use This Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* 8. AI CAMPAIGN PLANNER & APPROVAL TIMELINE */}
        <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-accent-amber-glow font-label-sm text-label-sm uppercase tracking-wider font-semibold">Autonomous Planning</span>
            <h2 className="text-headline-xl font-headline-xl text-text-primary font-bold mt-1">
              Plan a whole week in one message. Approve it in one click.
            </h2>
            <p className="text-text-tertiary font-body-md text-body-md mt-2">
              Ask for a campaign, not a post. Vexora reads your catalog, reviews existing schedules, drafts every day across every platform, and waits for your yes before anything goes live.
            </p>
          </div>
          {/* Calendar Strip Mockup */}
          <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-6 shadow-xl mb-12">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-border-structural gap-4">
              <div>
                <div className="text-xs font-mono text-text-muted uppercase">Next Week's Campaign</div>
                <div className="text-headline-sm font-headline-sm font-bold text-text-primary mt-0.5">“Breeze Line Launch — heavier Tue &amp; Thu”</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded bg-surface-layer-2 border border-border-structural text-xs text-text-secondary font-mono">
                  9 posts · 6 platforms · 1 approval
                </span>
                <button className="px-4 py-2 rounded-lg bg-primary-container text-text-primary font-label-md text-label-md font-bold amber-glow-btn hover:bg-accent-orange-deep transition-all" type="button">
                  Approve the week
                </button>
              </div>
            </div>
            {/* 7-Day Gantt / Calendar Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 mt-6">
              {/* Mon */}
              <div className="bg-surface-dim border border-border-structural rounded-lg p-3">
                <div className="font-mono text-xs text-text-muted flex justify-between"><span className="">Mon</span><span className="text-text-primary">12</span></div>
                <div className="mt-3 space-y-2">
                  <div className="p-2 rounded bg-surface-layer-2 border-l-2 border-primary-container text-[11px] text-text-secondary">
                    <span className="text-[9px] font-mono text-text-muted block">10:00 · IG</span>
                    Teaser Clip
                  </div>
                  <div className="p-2 rounded bg-surface-layer-2 border-l-2 border-status-info text-[11px] text-text-secondary">
                    <span className="text-[9px] font-mono text-text-muted block">14:00 · X</span>
                    Announcement
                  </div>
                </div>
              </div>
              {/* Tue */}
              <div className="bg-surface-dim border border-primary-container/40 rounded-lg p-3 bg-primary-container/5">
                <div className="font-mono text-xs text-accent-amber-glow font-bold flex justify-between"><span className="">Tue</span><span className="text-text-primary">13</span></div>
                <div className="mt-3 space-y-2">
                  <div className="p-2 rounded bg-surface-layer-2 border-l-2 border-primary-container text-[11px] text-text-secondary">
                    <span className="text-[9px] font-mono text-text-muted block">10:00 · IG &amp; TT</span>
                    Hero Video
                  </div>
                  <div className="p-2 rounded bg-surface-layer-2 border-l-2 border-status-operational text-[11px] text-text-secondary">
                    <span className="text-[9px] font-mono text-text-muted block">19:00 · FB</span>
                    Product Post
                  </div>
                </div>
              </div>
              {/* Wed */}
              <div className="bg-surface-dim border border-border-structural rounded-lg p-3">
                <div className="font-mono text-xs text-text-muted flex justify-between"><span className="">Wed</span><span className="text-text-primary">14</span></div>
                <div className="mt-3 space-y-2">
                  <div className="p-2 rounded bg-surface-layer-2 border-l-2 border-text-tertiary text-[11px] text-text-muted">
                    Rest Day (No Clash)
                  </div>
                </div>
              </div>
              {/* Thu */}
              <div className="bg-surface-dim border border-primary-container/40 rounded-lg p-3 bg-primary-container/5">
                <div className="font-mono text-xs text-accent-amber-glow font-bold flex justify-between"><span className="">Thu</span><span className="text-text-primary">15</span></div>
                <div className="mt-3 space-y-2">
                  <div className="p-2 rounded bg-surface-layer-2 border-l-2 border-primary-container text-[11px] text-text-secondary">
                    <span className="text-[9px] font-mono text-text-muted block">18:30 · Reel</span>
                    Behind the Scenes
                  </div>
                  <div className="p-2 rounded bg-surface-layer-2 border-l-2 border-status-operational text-[11px] text-text-secondary">
                    <span className="text-[9px] font-mono text-text-muted block">19:00 · LinkedIn</span>
                    Case Study
                  </div>
                </div>
              </div>
              {/* Fri */}
              <div className="bg-surface-dim border border-border-structural rounded-lg p-3">
                <div className="font-mono text-xs text-text-muted flex justify-between"><span className="">Fri</span><span className="text-text-primary">16</span></div>
                <div className="mt-3 space-y-2">
                  <div className="p-2 rounded bg-surface-layer-2 border-l-2 border-status-info text-[11px] text-text-secondary">
                    <span className="text-[9px] font-mono text-text-muted block">12:00 · TT</span>
                    User Spotlight
                  </div>
                </div>
              </div>
              {/* Sat */}
              <div className="bg-surface-dim border border-border-structural rounded-lg p-3">
                <div className="font-mono text-xs text-text-muted flex justify-between"><span className="">Sat</span><span className="text-text-primary">17</span></div>
                <div className="mt-3 space-y-2">
                  <div className="p-2 rounded bg-surface-layer-2 border-l-2 border-text-tertiary text-[11px] text-text-muted">
                    Light Story
                  </div>
                </div>
              </div>
              {/* Sun */}
              <div className="bg-surface-dim border border-border-structural rounded-lg p-3">
                <div className="font-mono text-xs text-text-muted flex justify-between"><span className="">Sun</span><span className="text-text-primary">18</span></div>
                <div className="mt-3 space-y-2">
                  <div className="p-2 rounded bg-surface-layer-2 border-l-2 border-primary-container text-[11px] text-text-secondary">
                    <span className="text-[9px] font-mono text-text-muted block">17:00 · Pins</span>
                    Lookbook Drop
                  </div>
                </div>
              </div>
            </div>
            {/* Dual Column Strict Guardrails Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
              <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-6">
                <div className="flex items-center gap-2 text-status-operational text-sm font-semibold">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span className="">What it does without asking (No approval needed)</span>
                </div>
                <ul className="mt-4 space-y-2.5 text-body-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-text-muted text-sm mt-0.5">done</span>
                    <span className="">Reads your brand voice, audience profile notes, and past post metrics.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-text-muted text-sm mt-0.5">done</span>
                    <span className="">Searches your live Shopify or WooCommerce catalog — products, prices, stock.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-text-muted text-sm mt-0.5">done</span>
                    <span className="">Writes copy variants and renders 4K cinematic video &amp; images to match.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-text-muted text-sm mt-0.5">done</span>
                    <span className="">Checks pre-existing calendar entries so new posts never clash.</span>
                  </li>
                </ul>
              </div>
              <div className="bg-surface-layer-1 border border-primary-container/40 rounded-xl p-6 bg-primary-container/[0.02]">
                <div className="flex items-center gap-2 text-primary-container text-sm font-semibold">
                  <span className="material-symbols-outlined text-base">lock</span>
                  <span className="">Where it always stops (Always asks first)</span>
                </div>
                <ul className="mt-4 space-y-2.5 text-body-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-0.5">pan_tool</span>
                    <span className="font-medium text-text-primary">Putting anything on the calendar — single post or full week plan.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-0.5">pan_tool</span>
                    <span className="font-medium text-text-primary">Publishing live to any connected social media account.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-0.5">pan_tool</span>
                    <span className="">Modifying inventory, pricing, or product descriptions in your store.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary-container text-sm mt-0.5">pan_tool</span>
                    <span className="">Running unapproved automation steps outside established workflow boundaries.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 9. VISUAL AI WORKFLOWS & STEP BUILDER */}
        <section className="py-16 md:py-24 bg-surface-layer-1 border-y border-border-structural" id="workflows">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-accent-amber-glow font-label-sm text-label-sm uppercase tracking-wider font-semibold">Deterministic Pipelines</span>
              <h2 className="text-headline-xl font-headline-xl text-text-primary font-bold mt-1">
                From trigger to every platform. Fully automated.
              </h2>
              <p className="text-text-tertiary font-body-lg text-body-lg mt-3">
                Connect your store or configure an event. AI creates the content and dispatches across channels — build visually in Step Builder or just describe it in Chat Mode.
              </p>
            </div>
            {/* Node Graph Showcase Canvas */}
            <div className="bg-surface-dim border border-border-interactive rounded-xl p-6 sm:p-8 relative overflow-hidden">
              <div className="flex items-center justify-between pb-6 border-b border-border-structural flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-primary-container/20 border border-primary-container/40 text-accent-amber-glow text-xs font-mono font-bold">
                    STEP BUILDER · LIVE
                  </span>
                  <span className="text-xs text-text-muted">Drag · drop · connect nodes</span>
                </div>
                {/* Chat Mode Toggle */}
                <div className="flex items-center gap-2 text-xs font-mono bg-surface-layer-2 px-3 py-1.5 rounded-lg border border-border-structural">
                  <span className="text-text-muted">Chat Mode:</span>
                  <span className="text-status-operational font-bold">“Post new Shopify SKUs with 8 tags to IG, FB &amp; Pin”</span>
                </div>
              </div>
              {/* Interactive Visual Nodes Flow */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                {/* Node 1: Trigger */}
                <div className="bg-surface-layer-2 border border-border-interactive rounded-xl p-4 relative shadow-lg">
                  <div className="text-[10px] font-mono text-accent-amber-glow uppercase font-bold tracking-wider">Trigger</div>
                  <div className="font-bold text-text-primary text-sm mt-1">NEW ASSET / SKU</div>
                  <div className="text-[11px] text-text-muted font-mono mt-1">Shopify or Jobsite Upload</div>
                  <div className="mt-3 px-2 py-1 rounded bg-surface-dim text-[11px] text-text-secondary border border-border-structural flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-status-operational">bolt</span>
                    <span className="">Fires instantly</span>
                  </div>
                </div>
                {/* Node 2: Enhance */}
                <div className="bg-surface-layer-2 border border-border-interactive rounded-xl p-4 relative shadow-lg">
                  <div className="text-[10px] font-mono text-status-info uppercase font-bold tracking-wider">AI Step 01</div>
                  <div className="font-bold text-text-primary text-sm mt-1">PHOTO &amp; VIDEO</div>
                  <div className="text-[11px] text-text-muted font-mono mt-1">Nano Banana + Veo 3.1</div>
                  <div className="mt-3 px-2 py-1 rounded bg-surface-dim text-[11px] text-text-secondary border border-border-structural flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-status-info">auto_fix_high</span>
                    <span className="">4K Frame &amp; Clean</span>
                  </div>
                </div>
                {/* Node 3: Caption */}
                <div className="bg-surface-layer-2 border border-border-interactive rounded-xl p-4 relative shadow-lg">
                  <div className="text-[10px] font-mono text-status-operational uppercase font-bold tracking-wider">AI Step 02</div>
                  <div className="font-bold text-text-primary text-sm mt-1">SCRIPT &amp; HOOK</div>
                  <div className="text-[11px] text-text-muted font-mono mt-1">Claude Opus 4.8</div>
                  <div className="mt-3 px-2 py-1 rounded bg-surface-dim text-[11px] text-text-secondary border border-border-structural flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-status-operational">psychology</span>
                    <span className="">Brand voice tuned</span>
                  </div>
                </div>
                {/* Node 4: Tags */}
                <div className="bg-surface-layer-2 border border-border-interactive rounded-xl p-4 relative shadow-lg">
                  <div className="text-[10px] font-mono text-status-warning uppercase font-bold tracking-wider">AI Step 03</div>
                  <div className="font-bold text-text-primary text-sm mt-1">HASHTAG &amp; GEO</div>
                  <div className="text-[11px] text-text-muted font-mono mt-1">Local SEO Optimizer</div>
                  <div className="mt-3 px-2 py-1 rounded bg-surface-dim text-[11px] text-text-secondary border border-border-structural flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-status-warning">tag</span>
                    <span className="">8 high-intent tags</span>
                  </div>
                </div>
                {/* Node 5: Dispatch */}
                <div className="bg-surface-layer-2 border-2 border-primary-container rounded-xl p-4 relative shadow-lg bg-primary-container/10">
                  <div className="text-[10px] font-mono text-accent-amber-glow uppercase font-bold tracking-wider">Destination</div>
                  <div className="font-bold text-text-primary text-sm mt-1">AUTO-DISPATCH</div>
                  <div className="text-[11px] text-text-muted font-mono mt-1">10 Platforms at Once</div>
                  <div className="mt-3 px-2 py-1 rounded bg-primary-container text-text-primary text-[11px] font-semibold flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-xs">rocket_launch</span>
                    <span className="">Queued Live</span>
                  </div>
                </div>
              </div>
              {/* Bottom execution payload sample */}
              <div className="mt-8 pt-4 border-t border-border-structural text-xs font-mono text-text-muted flex flex-wrap items-center justify-between gap-3">
                <div className="">Data Flow: <span className="text-text-secondary">{'{{trigger.product.name}} ➔ {{ai_script.hook}} ➔ {{geo.city_tags}} ➔ 10_channels'}</span></div>
                <a className="text-primary-container hover:text-accent-amber-glow underline flex items-center gap-1" href="#pricing" onClick={sc('pricing')}>
                  Explore 40+ Pre-built Workflow Templates <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 10. INTEGRATIONS & DEVELOPER READY (REST API + MCP SERVER) */}
        <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="developer-mcp">
          <div className="max-w-3xl mb-12">
            <span className="text-accent-amber-glow font-label-sm text-label-sm uppercase tracking-wider font-semibold">Integrations &amp; Developers</span>
            <h2 className="text-headline-xl font-headline-xl text-text-primary font-bold mt-1">
              Connected to your stack. Ready for your AI assistants.
            </h2>
            <p className="text-text-tertiary font-body-lg text-body-lg mt-3">
              Manage through official OAuth connections, or control Vexora directly from your IDE and codebase with our REST API and native MCP server for Claude &amp; Cursor.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Official Integrations (6 cols) */}
            <div className="lg:col-span-6 bg-surface-layer-1 border border-border-structural rounded-xl p-6">
              <h3 className="text-headline-md font-headline-md font-bold text-text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">hub</span>
                <span className="">Official Store &amp; Tool Connectors</span>
              </h3>
              <p className="text-body-sm text-text-tertiary mb-6">
                Read-only scopes. Vexora reads your catalog, photos, and specs, but never modifies your prices or inventory.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-dim border border-border-structural flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-status-operational">shopping_cart</span>
                  <div>
                    <div className="text-text-primary font-bold">Shopify GraphQL</div>
                    <div className="text-text-muted text-[10px]">Auto SKU sync</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-surface-dim border border-border-structural flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-status-info">storefront</span>
                  <div>
                    <div className="text-text-primary font-bold">WooCommerce</div>
                    <div className="text-text-muted text-[10px]">REST API v3</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-surface-dim border border-border-structural flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-accent-amber-glow">construction</span>
                  <div>
                    <div className="text-text-primary font-bold">Procore &amp; Buildertrend</div>
                    <div className="text-text-muted text-[10px]">Jobsite media sync</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-surface-dim border border-border-structural flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary-container">calendar_today</span>
                  <div>
                    <div className="text-text-primary font-bold">Holiday Calendar</div>
                    <div className="text-text-muted text-[10px]">100+ retail dates</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Right: REST API & MCP Server (6 cols) */}
            <div className="lg:col-span-6 bg-surface-layer-1 border border-border-interactive rounded-xl p-6">
              <h3 className="text-headline-md font-headline-md font-bold text-text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-amber-glow">terminal</span>
                <span className="">REST API &amp; Model Context Protocol</span>
              </h3>
              <p className="text-body-sm text-text-tertiary mb-6">
                Included in Pro. Control scheduling, content rendering, and asset deployment from your own code, or let Claude Code and Cursor run social for you.
              </p>
              {/* Code Box */}
              <div className="bg-surface-dim border border-border-structural rounded-lg p-3.5 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-text-muted text-[11px] pb-2 border-b border-border-structural">
                  <span className="">MCP SERVER TOOL SPEC</span>
                  <span className="text-status-operational">ACTIVE</span>
                </div>
                <div className="text-text-tertiary">// Connect Vexora MCP to Cursor or Claude Desktop</div>
                <div className="text-text-secondary"><span className="text-primary-container">npx</span> -y @vexora/mcp-server --api-key=vex_live_9a87d...</div>
                <div className="text-text-muted pt-2 text-[11px]">
                  REST Endpoint: <span className="text-text-primary">https://api.vexora.ai/v1/campaigns/schedule</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs font-mono">
                <span className="text-accent-amber-glow">✓ 13 MCP Tools</span>
                <span className="text-text-secondary">✓ Per-platform endpoints</span>
                <span className="text-text-secondary">✓ OpenAPI 3.1 Spec</span>
              </div>
            </div>
          </div>
        </section>
        {/* 11. TRUST & SAFETY BLUEPRINT */}
        <section className="py-12 bg-surface-layer-1/60 border-y border-border-structural">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-1">
                <div className="text-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">verified_user</span>
                </div>
                <div className="text-text-primary font-bold text-sm">Approval before publish</div>
                <div className="text-text-muted text-xs">Nothing goes live until you say yes</div>
              </div>
              <div className="space-y-1">
                <div className="text-status-operational flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">api</span>
                </div>
                <div className="text-text-primary font-bold text-sm">Official platform APIs</div>
                <div className="text-text-muted text-xs">No scraping, no password sharing</div>
              </div>
              <div className="space-y-1">
                <div className="text-status-info flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">security</span>
                </div>
                <div className="text-text-primary font-bold text-sm">SOC-2 &amp; GDPR Compliant</div>
                <div className="text-text-muted text-xs">EU-grade encrypted credential vaults</div>
              </div>
              <div className="space-y-1">
                <div className="text-accent-amber-glow flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">history</span>
                </div>
                <div className="text-text-primary font-bold text-sm">Every run is auditable</div>
                <div className="text-text-muted text-xs">Exact model traces, token logs, steps</div>
              </div>
            </div>
          </div>
        </section>

        {/* 12. PRICING ARCHITECTURE */}
        <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="pricing">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-accent-amber-glow font-label-sm text-label-sm uppercase tracking-wider font-semibold">Predictable Pricing</span>
            <h2 className="text-headline-xl font-headline-xl text-text-primary font-bold mt-1">
              Plans for every stage. Starting at nothing.
            </h2>
            <p className="text-text-tertiary font-body-md text-body-md mt-2">
              Start free with no card. Billed monthly per workspace, never per seat or per channel — upgrade, downgrade, or cancel any time.
            </p>
            {/* Billing Toggle Simulator */}
            <div className="mt-6 inline-flex items-center p-1 rounded-full bg-surface-layer-1 border border-border-structural font-label-md text-label-md">
              <button className="px-4 py-1.5 rounded-full bg-surface-layer-2 text-text-primary font-semibold shadow-sm border border-border-interactive" type="button">Monthly Billed</button>
              <button className="px-4 py-1.5 rounded-full text-text-tertiary hover:text-text-primary flex items-center gap-1.5" type="button">
                <span className="">Annual Billed</span>
                <span className="px-1.5 py-0.2 rounded bg-primary-container/20 text-accent-amber-glow font-mono text-[10px]">20% OFF</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tier 1: Free */}
            <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-6 flex flex-col justify-between hover:border-border-interactive transition-all">
              <div>
                <div className="text-text-tertiary font-mono text-xs uppercase font-semibold">Free</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-text-primary font-headline-xl">$0</span>
                  <span className="text-text-muted text-xs">/month</span>
                </div>
                <p className="text-text-tertiary text-xs mt-2">A few credits to try the studio. No credit card required.</p>
                <div className="mt-6 space-y-3 text-xs text-text-secondary">
                  <div className="font-mono text-[11px] text-text-muted uppercase">Publishing</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>2 social accounts</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>30 scheduled posts/mo</div>
                  <div className="font-mono text-[11px] text-text-muted uppercase pt-2">AI Generation</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>25 AI credits to start</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>AI Agent (10 chats)</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Basic image models</div>
                </div>
              </div>
              <div className="mt-8">
                <a className="w-full py-2.5 rounded-lg bg-surface-layer-2 hover:bg-surface-layer-3 text-text-secondary hover:text-text-primary font-label-md text-label-md font-semibold border border-border-structural transition-all flex items-center justify-center" href="#register" onClick={auth(onRegister)}>
                  Start free
                </a>
              </div>
            </div>
            {/* Tier 2: Pro (Most Popular) */}
            <div className="bg-surface-layer-1 border-2 border-primary-container rounded-xl p-6 flex flex-col justify-between shadow-[0_0_24px_rgba(249,115,22,0.18)] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary-container text-text-primary font-mono text-[10px] font-bold uppercase tracking-wider shadow">
                Most Popular · 25% Off
              </div>
              <div>
                <div className="text-accent-amber-glow font-mono text-xs uppercase font-semibold">Pro</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-text-primary font-headline-xl">$29</span>
                  <span className="text-text-muted line-through text-xs font-mono">$39/mo</span>
                </div>
                <p className="text-text-tertiary text-xs mt-2">For solo creators, specialty trade operators, and growing brands.</p>
                <div className="mt-6 space-y-3 text-xs text-text-secondary">
                  <div className="font-mono text-[11px] text-accent-amber-glow uppercase">Publishing &amp; Workflows</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>10 social accounts</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Unlimited scheduling</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>5 Active AI Workflows</div>
                  <div className="font-mono text-[11px] text-accent-amber-glow uppercase pt-2">AI Generation</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>750 AI credits / month</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Up to 150 images &amp; 18 videos</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Full AI Studio + Agent access</div>
                  <div className="font-mono text-[11px] text-accent-amber-glow uppercase pt-2">Developer &amp; Sync</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>REST API + MCP Server</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>1 Shopify or WooCommerce store</div>
                </div>
              </div>
              <div className="mt-8">
                <a className="w-full py-2.5 rounded-lg bg-primary-container text-text-primary font-label-md text-label-md font-bold amber-glow-btn hover:bg-accent-orange-deep transition-all flex items-center justify-center" href="#register" onClick={auth(onRegister)}>
                  Get Pro Plan
                </a>
              </div>
            </div>
            {/* Tier 3: Team */}
            <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-6 flex flex-col justify-between hover:border-border-interactive transition-all">
              <div>
                <div className="text-text-tertiary font-mono text-xs uppercase font-semibold">Team</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-text-primary font-headline-xl">$79</span>
                  <span className="text-text-muted text-xs">/month</span>
                </div>
                <p className="text-text-tertiary text-xs mt-2">Shared credits, collaboration, and high-volume multi-account tools.</p>
                <div className="mt-6 space-y-3 text-xs text-text-secondary">
                  <div className="font-mono text-[11px] text-text-muted uppercase">Publishing &amp; Workflows</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>50 social accounts</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>20 Active AI Workflows</div>
                  <div className="font-mono text-[11px] text-text-muted uppercase pt-2">AI Generation</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>2,000 AI credits / month</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Up to 400 images &amp; 50 videos</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Kling 3.0 Pro &amp; Veo 3.1</div>
                  <div className="font-mono text-[11px] text-text-muted uppercase pt-2">Developer &amp; Team</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>100k API requests / 15 keys</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Unlimited stores &amp; MCP sources</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Up to 10 team seats</div>
                </div>
              </div>
              <div className="mt-8">
                <a className="w-full py-2.5 rounded-lg bg-surface-layer-2 hover:bg-surface-layer-3 text-text-secondary hover:text-text-primary font-label-md text-label-md font-semibold border border-border-structural transition-all flex items-center justify-center" href="#register" onClick={auth(onRegister)}>
                  Get Team Plan
                </a>
              </div>
            </div>
            {/* Tier 4: Enterprise */}
            <div className="bg-surface-layer-1 border border-border-structural rounded-xl p-6 flex flex-col justify-between hover:border-border-interactive transition-all">
              <div>
                <div className="text-text-tertiary font-mono text-xs uppercase font-semibold">Enterprise</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-text-primary font-headline-xl">$299</span>
                  <span className="text-text-muted text-xs">/month</span>
                </div>
                <p className="text-text-tertiary text-xs mt-2">Industrial scale for marketing agencies and multi-location firms.</p>
                <div className="mt-6 space-y-3 text-xs text-text-secondary">
                  <div className="font-mono text-[11px] text-text-muted uppercase">Publishing &amp; Workflows</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>100 social accounts</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>50 Active AI Workflows</div>
                  <div className="font-mono text-[11px] text-text-muted uppercase pt-2">AI Generation</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>8,000 AI credits / month</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Up to 1,600 images &amp; 200 videos</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Custom fine-tuned voice models</div>
                  <div className="font-mono text-[11px] text-text-muted uppercase pt-2">Developer &amp; Team</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Unlimited API requests &amp; keys</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Dedicated Slack &amp; priority SLAs</div>
                  <div className="flex items-center gap-2"><span className="material-symbols-outlined text-status-operational text-sm">check</span>Unlimited team members</div>
                </div>
              </div>
              <div className="mt-8">
                <a className="w-full py-2.5 rounded-lg bg-surface-layer-2 hover:bg-surface-layer-3 text-text-secondary hover:text-text-primary font-label-md text-label-md font-semibold border border-border-structural transition-all flex items-center justify-center" href="#register" onClick={auth(onRegister)}>
                  Get Enterprise
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 13. FREQUENTLY ASKED QUESTIONS (Accordion) */}
        <section className="py-16 md:py-24 bg-surface-dim border-t border-border-structural">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-accent-amber-glow font-label-sm text-label-sm uppercase tracking-wider font-semibold">Clear Answers</span>
              <h2 className="text-headline-xl font-headline-xl text-text-primary font-bold mt-1">Frequently Asked Questions</h2>
              <p className="text-text-tertiary font-body-md text-body-md mt-2">Everything you need to know about autonomous social automation, guardrails, and model compute.</p>
            </div>
            <div className="space-y-3" id="faq-accordion">
              {/* Q1 */}
              <details className="group bg-surface-layer-1 border border-border-structural rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden open:border-border-interactive">
                <summary className="flex items-center justify-between cursor-pointer font-headline-sm text-headline-sm font-semibold text-text-primary">
                  <span className="">What is Vexora?</span>
                  <span className="material-symbols-outlined text-text-tertiary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <p className="mt-3 text-body-sm text-text-tertiary leading-relaxed">
                  Vexora is an autonomous AI social media manager. It generates posts, images, video and audio using 80+ AI models — GPT-5.6, Claude Opus 4.8, Gemini 3.1 Pro, Nano Banana Pro, Veo 3.1 and more — then schedules and publishes them across ten platforms (Instagram, Facebook, TikTok, YouTube, LinkedIn, Pinterest, Reddit, X, Threads, and Bluesky) from one console. Crucially: nothing goes live until you approve it.
                </p>
              </details>
              {/* Q2 */}
              <details className="group bg-surface-layer-1 border border-border-structural rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden open:border-border-interactive">
                <summary className="flex items-center justify-between cursor-pointer font-headline-sm text-headline-sm font-semibold text-text-primary">
                  <span className="">Do I need a store, a brand kit or an existing following to use Vexora?</span>
                  <span className="material-symbols-outlined text-text-tertiary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <p className="mt-3 text-body-sm text-text-tertiary leading-relaxed">
                  No. Vexora operates flexibly as a standalone social media platform. You can connect a single account, type or AI-generate an update, select platforms, and schedule it. Brand voice modeling, Shopify and WooCommerce sync, the AI Manager, and automated AI workflows are modular layers you turn on whenever you want them.
                </p>
              </details>
              {/* Q3 */}
              <details className="group bg-surface-layer-1 border border-border-structural rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden open:border-border-interactive">
                <summary className="flex items-center justify-between cursor-pointer font-headline-sm text-headline-sm font-semibold text-text-primary">
                  <span className="">What AI models does Vexora use, and do I need my own API keys?</span>
                  <span className="material-symbols-outlined text-text-tertiary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <p className="mt-3 text-body-sm text-text-tertiary leading-relaxed">
                  You never need your own API keys. One Vexora subscription provides native access to 80+ models across four modalities. For text: GPT-5.6, Claude Opus 4.8, Sonnet 5, Gemini 3.1, Grok 4.3, and Kimi K3. For images: Nano Banana Pro, GPT Image 2, Seedream 5 Pro. For video: Veo 3.1, Kling 3.0 Pro, Runway Gen-4.5, and Seedance 2.0. For audio: ElevenLabs Dialogue v3 and ElevenLabs Music. You pick the model per step.
                </p>
              </details>
              {/* Q4 */}
              <details className="group bg-surface-layer-1 border border-border-structural rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden open:border-border-interactive">
                <summary className="flex items-center justify-between cursor-pointer font-headline-sm text-headline-sm font-semibold text-text-primary">
                  <span className="">Can an AI agent publish to Instagram, LinkedIn and TikTok automatically?</span>
                  <span className="material-symbols-outlined text-text-tertiary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <p className="mt-3 text-body-sm text-text-tertiary leading-relaxed">
                  Yes — with an intentional, safety-first boundary. The AI Manager drafts a full week across all 10 networks, adjusting formatting, media crops, and hashtags per channel, then builds the calendar. Live publishing always pauses for your review and approval. If you want truly unattended posting (e.g. newly published Shopify SKU triggers an immediate post), you can configure dedicated AI Workflows to run end-to-end without interruption.
                </p>
              </details>
              {/* Q5 */}
              <details className="group bg-surface-layer-1 border border-border-structural rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden open:border-border-interactive">
                <summary className="flex items-center justify-between cursor-pointer font-headline-sm text-headline-sm font-semibold text-text-primary">
                  <span className="">Does Vexora have a REST API or an MCP Server?</span>
                  <span className="material-symbols-outlined text-text-tertiary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <p className="mt-3 text-body-sm text-text-tertiary leading-relaxed">
                  Yes. The Vexora REST API (api.vexora.ai/v1) schedules and publishes posts to every connected channel via a single HTTP request and manages media assets. The Vexora MCP server provides 13 standardized tools that let AI coding assistants like Claude Desktop, Cursor, and VS Code schedule, query analytics, and inspect queues through natural language commands. Both are included in the Pro tier with no extra fee.
                </p>
              </details>
              {/* Q6 */}
              <details className="group bg-surface-layer-1 border border-border-structural rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden open:border-border-interactive">
                <summary className="flex items-center justify-between cursor-pointer font-headline-sm text-headline-sm font-semibold text-text-primary">
                  <span className="">Is Vexora a simpler alternative to n8n, Zapier or Make for social?</span>
                  <span className="material-symbols-outlined text-text-tertiary group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <p className="mt-3 text-body-sm text-text-tertiary leading-relaxed">
                  Yes. General automation tools like Zapier and n8n move data between arbitrary apps, but you must manually engineer prompts, hook up multiple paid model API accounts, and maintain brittle platform nodes as APIs evolve. Vexora ships pre-bundled with 80+ AI models, video renderers, brand safety guardrails, and verified social adapters so you don’t spend hours wiring nodes before your first post goes live.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* 14. PRE-FOOTER FINAL CTA BANNER */}
        <section className="py-16 md:py-20 relative overflow-hidden bg-gradient-to-b from-canvas-base via-surface-layer-1 to-surface-floor border-t border-border-structural">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.15),transparent_70%)] pointer-events-none"></div>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-headline-xl sm:text-display-lg font-headline-xl sm:font-display-lg font-extrabold text-text-primary tracking-tight">
              Automate your social media with AI
            </h2>
            <p className="mt-4 text-body-lg text-text-tertiary max-w-2xl mx-auto">
              AI-powered content creation, smart calendar scheduling, and seamless storefront or jobsite integration — all in one platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-primary-container text-text-primary font-label-lg text-label-lg font-bold amber-glow-btn hover:bg-accent-orange-deep transition-all flex items-center justify-center gap-2" href="#register" onClick={auth(onRegister)}>
                <span className="">Create account</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </a>
              <a className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-surface-layer-2 hover:bg-surface-layer-3 text-text-secondary hover:text-text-primary font-label-lg text-label-lg font-semibold border border-border-structural transition-all flex items-center justify-center gap-2" href="#pricing" onClick={sc('pricing')}>
                <span className="">Talk to engineering</span>
                <span className="material-symbols-outlined text-lg text-text-muted">forum</span>
              </a>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs font-mono text-text-muted">
              <span className="">✓ Free plan included</span>
              <span className="">✓ 80+ AI Models</span>
              <span className="">✓ Priority Onboarding</span>
            </div>
          </div>
        </section>
      </main>

      {/* 15. RICH MEGA FOOTER */}
      <footer className="bg-surface-floor border-t border-border-structural">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand column */}
            <div className="col-span-2 space-y-4">
              <div className="text-headline-md font-headline-md font-bold text-text-primary flex items-center gap-2">
                <img src="/vexora-logo.svg" alt="Vexora" className="w-11 h-11" />
                <span className="">Vexora</span>
              </div>
              <p className="text-body-sm font-body-sm text-text-tertiary max-w-sm">
                AI social media automation that writes, designs, and publishes across 10 platforms from one unified high-precision console.
              </p>
              <div className="flex items-center gap-3 pt-2 text-text-tertiary">
                <span className="w-2 h-2 rounded-full bg-status-operational"></span>
                <span className="font-mono text-xs text-text-muted">All systems operational · v3.2.4</span>
              </div>
            </div>
            {/* Product links */}
            <div className="space-y-3">
              <div className="text-headline-sm font-headline-sm font-semibold text-text-primary">Product</div>
              <ul className="space-y-2 text-label-sm font-label-sm">
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#ai-manager" onClick={sc('ai-manager')}>AI Manager</a></li>
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#ai-studio" onClick={sc('ai-studio')}>AI Studio</a></li>
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#workflows" onClick={sc('workflows')}>Workflows</a></li>
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#developer-mcp" onClick={sc('developer-mcp')}>Integrations</a></li>
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#pricing" onClick={sc('pricing')}>Pricing</a></li>
              </ul>
            </div>
            {/* Developers links */}
            <div className="space-y-3">
              <div className="text-headline-sm font-headline-sm font-semibold text-text-primary">Developers</div>
              <ul className="space-y-2 text-label-sm font-label-sm">
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#developer-mcp" onClick={sc('developer-mcp')}>REST API</a></li>
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#developer-mcp" onClick={sc('developer-mcp')}>MCP Server</a></li>
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#" onClick={sc('ai-manager')}>Documentation</a></li>
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#" onClick={sc('ai-manager')}>ROI Calculator</a></li>
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#" onClick={sc('ai-manager')}>Changelog</a></li>
              </ul>
            </div>
            {/* Trust & Compliance */}
            <div className="space-y-3">
              <div className="text-headline-sm font-headline-sm font-semibold text-text-primary">Compliance</div>
              <ul className="space-y-2 text-label-sm font-label-sm">
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#" onClick={sc('ai-manager')}>Privacy Policy</a></li>
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#" onClick={sc('ai-manager')}>Terms of Service</a></li>
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#" onClick={sc('ai-manager')}>Safety Checklist</a></li>
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#" onClick={sc('ai-manager')}>Security &amp; Compliance</a></li>
                <li className=""><a className="text-text-tertiary hover:text-accent-amber-glow hover:underline transition-colors duration-150" href="#" onClick={sc('ai-manager')}>Status</a></li>
              </ul>
            </div>
          </div>
          {/* Copyright Sub-bar */}
          <div className="pt-8 border-t border-border-structural flex flex-col sm:flex-row items-center justify-between text-body-sm font-body-sm text-text-muted gap-4">
            <div className="">
              © 2025 Vexora Inc. Built for trade contractors and autonomous marketing teams. All rights reserved.
            </div>
            <div className="flex items-center gap-6 font-mono text-xs">
              <span className="text-text-tertiary">SOC-2 Type II</span>
              <span className="text-text-tertiary">Official Meta Partner</span>
              <span className="text-text-tertiary">TikTok Marketing API</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

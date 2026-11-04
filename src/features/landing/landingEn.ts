import type { TranslationKey } from '../../i18n/translations'

/**
 * Явный английский словарь лендинга.
 *
 * Лендинг — публичная маркетинговая страница и всегда рендерится строго
 * на английском, НЕ зависит от выбранного языка интерфейса (en/ru/ro),
 * который живёт в дашборде. Поэтому здесь отдельный фиксированный словарь.
 *
 * Тексты сверены с дизайн-прототипом vexora_marketing_landing_page (Stitch).
 */
export const landingEn: Partial<Record<TranslationKey, string>> = {
  // ------------------------------ Navbar ------------------------------
  'Landing.nav.product': 'Product',
  'Landing.nav.contractors': 'Solutions for Contractors',
  'Landing.nav.aiModels': 'AI Models',
  'Landing.nav.pricing': 'Pricing',
  'Landing.nav.stories': 'Customer Stories',
  'Landing.nav.faq': 'Docs',
  'Landing.signIn': 'Sign In',
  'Landing.startFreeTrial': 'Create Account',

  // ------------------------------ Announcement ------------------------------
  'Landing.announcement': 'Introducing image-to-video reels inside Vexora AI',
  'Landing.learnMore': 'Learn more',

  // ------------------------------ Hero ------------------------------
  'Landing.cta.startTrial': 'Create Account',
  'Landing.cta.watchDemo': 'Watch 2-Min Interactive Demo',
  'Landing.hero.titlePart1': 'Autonomous Social Content Production for ',
  'Landing.hero.titlePart2': 'Local Service Businesses',
  'Landing.hero.subtitle':
    'Turn finished roofing, remodeling, and trade jobs into high-converting reels, before-and-after galleries, and localized social campaigns — automated with state-of-the-art AI media models.',
  'Landing.trusted': 'Built for home service contractors, roofers, landscapers, and trade agencies across North America',
  'Landing.trust.apex': 'Apex Roofing',
  'Landing.trust.timberline': 'Timberline Pro',
  'Landing.trust.cascade': 'Cascade Living',
  'Landing.trust.soundview': 'Soundview HVAC',
  'Landing.trust.bluepeak': 'BluePeak Homes',

  // ------------------------------ Preview ------------------------------
  'Landing.preview.jobLabel': 'Apex Roofing & Remodeling · Job #4829 Architectural Drone Reel',
  'Landing.preview.pipelineLabel': 'Live Pipeline: 3 Active Queues',
  'Landing.preview.previewOutput': 'Preview Output',
  'Landing.preview.targetsLabel': 'Auto-Dispatch Targets',
  'Landing.preview.instagram': 'Instagram Reels',
  'Landing.preview.tiktok': 'TikTok',
  'Landing.preview.facebook': 'Facebook Watch',
  'Landing.preview.googleBusiness': 'Google Business',
  'Landing.preview.promptLabel': 'AI Local Hook Prompt',
  'Landing.preview.zipLabel': 'Zip: 98052 (Redmond, WA)',
  'Landing.preview.hook': 'Heavy storms are coming to King County. Is your roof ready?',
  'Landing.preview.hookDetail':
    'Highlights GAF Timberline HDZ architectural shingles, storm-resistant warranty, and zero-down financing options.',
  'Landing.preview.groundingLabel': 'Grounding Engine Parameters',
  'Landing.preview.uniformsLabel': 'Brand Crew Uniforms',
  'Landing.preview.uniformsValue': 'Navy Apex Hi-Vis Vest',
  'Landing.preview.cameraLabel': 'Drone Camera Angle',
  'Landing.preview.cameraValue': '45° Orbit Sweep (60fps)',
  'Landing.preview.modelLabel': 'Model:',
  'Landing.preview.renderTime': '18.2s generation time',
  'Landing.preview.videoAlt':
    'Cinematic 4K aerial drone shot of craftsmen installing dark slate roof shingles on a luxury suburban home during golden hour.',
  'Landing.preview.engineLabel': 'Image-to-Video Engine',
  'Landing.preview.videoTitle': 'Before vs. After Roof Transformation Reel',
  'Landing.preview.videoMeta': 'Duration: 00:24 · Export: 9:16 Vertical · 16:9 Landscape',
  'Landing.preview.renderReady': 'Render Ready',
  'Landing.preview.scheduledLabel': 'Scheduled for tomorrow at 8:15 AM (Local Peak)',
  'Landing.preview.regenerateHook': 'Regenerate Hook',
  'Landing.preview.dispatchLabel': 'Dispatch to All Channels',

  // ------------------------------ Product ------------------------------
  'Landing.product.sectionLabel': 'Engineered For Trade Professionals',
  'Landing.product.title': 'Three Steps from Unfinished Jobsite to Multi-Channel Lead Engine',
  'Landing.product.subtitle':
    'No videographers, no awkward scripts, no hours spent editing on your phone after a 10-hour day on site.',
  'Landing.product.step01': 'STEP 01',
  'Landing.product.step01Title': 'Upload Real Jobsite Assets',
  'Landing.product.step01Desc':
    'Upload quick phone photos, blueprint sketches, or aerial drone snapshots. Vexora grounds on your true materials and crew for authentic, on-brand output.',
  'Landing.product.step01Badge': 'Material Realism Safeguard Active',
  'Landing.product.step02': 'STEP 02 · CORE ENGINE',
  'Landing.product.step02Title': 'One-Click Multimodal Generation',
  'Landing.product.step02Desc':
    'Craft localized hooks, cost breakdown captions, and neighborhood geo-tags. Simultaneously synthesize cinematic vertical videos with natural camera moves.',
  'Landing.product.step02Badge': 'Average Render: Under 20 Seconds',
  'Landing.product.step03': 'STEP 03',
  'Landing.product.step03Title': 'Review & Schedule',
  'Landing.product.step03Desc':
    'Every finished asset passes through your review step — approve it and it is queued to the calendar for the channels you connect. Control what goes out and when.',
  'Landing.product.step03Badge': 'Approval-First Workflow',

  // ------------------------------ AI models ------------------------------
  'Landing.ai.sectionLabel': 'Generative Powerhouse',
  'Landing.ai.title': 'Powered by Industry-Leading Generative Models',
  'Landing.ai.subtitle':
    "We orchestrate the world's most sophisticated multimodal models specifically tuned for trade aesthetics and tactile construction materials.",
  'Landing.ai.activeCluster': 'Active Cluster',
  'Landing.ai.nodesOperational': '5 Nodes Operational',
  'Landing.ai.model1.name': 'Seedance 2.5 — Image to Video',
  'Landing.ai.model1.badge': 'NEW FLAGSHIP',
  'Landing.ai.model1.desc':
    'Specialized in architectural camera moves, photorealistic daylight illumination, and cinematic 60fps drone flyovers of finished construction jobs.',
  'Landing.ai.model1.resLabel': 'Max Resolution',
  'Landing.ai.model1.resValue': '4K UHD Cinema (9:16 & 16:9)',
  'Landing.ai.model1.latLabel': 'Latency',
  'Landing.ai.model1.latValue': '~18.2 seconds',
  'Landing.ai.model2.name': 'Wan 3.0',
  'Landing.ai.model2.badge': 'RAPID STORIES',
  'Landing.ai.model2.desc':
    'Engineered for rapid everyday Instagram and Facebook stories. Generates fluid, lightweight motion graphics and tool demonstrations in sub-15s turnaround.',
  'Landing.ai.model2.turnLabel': 'Turnaround',
  'Landing.ai.model2.turnValue': 'Sub-15s Instant Story',
  'Landing.ai.model2.targetLabel': 'Primary Target',
  'Landing.ai.model2.targetValue': 'Stories & Reels Quick Snaps',
  'Landing.ai.model3.name': 'Kling 3.0',
  'Landing.ai.model3.badge': 'COMPLEX MOTION',
  'Landing.ai.model3.desc':
    'Excels in accurate physical tradesperson kinetics: nail gun operation, asphalt torch-down applications, and crane operations with anatomical accuracy.',
  'Landing.ai.model3.kinLabel': 'Kinematics',
  'Landing.ai.model3.kinValue': 'Natural Human Hand Dexterity',
  'Landing.ai.model3.safetyLabel': 'Safety Gear Anchor',
  'Landing.ai.model3.safetyValue': 'Full OSHA Compliance Logic',
  'Landing.ai.model4.name': 'Grok Imagine 2.0',
  'Landing.ai.model4.badge': 'MARKETING POSTERS',
  'Landing.ai.model4.desc':
    'Produces ultra-crisp promotional infographics, seasonal discount flyers, and neighborhood direct-mail cards with razor-sharp legible English typography.',
  'Landing.ai.model4.textLabel': 'Text Legibility',
  'Landing.ai.model4.textValue': 'Provider-dependent typography quality',
  'Landing.ai.model4.formatLabel': 'Formats',
  'Landing.ai.model4.formatValue': 'Carousels, Banners, Flyers',
  'Landing.ai.model5.name': 'Soul 2',
  'Landing.ai.model5.badge': 'CUSTOM GROUNDING',
  'Landing.ai.model5.exclusive': 'Exclusive to Vexora',
  'Landing.ai.model5.desc':
    'Preserves honest field grit: realistic jobsite dust, genuine timber wood grain, authentic brick weathering, and honest contractor crew expressions.',
  'Landing.ai.model5.texLabel': 'Texture Accuracy',
  'Landing.ai.model5.texValue': 'Reference-grounded surface detail',
  'Landing.ai.model5.faceLabel': 'Crew Face Match',
  'Landing.ai.model5.faceValue': 'Reference Grounding',
  'Landing.ai.model5.assetLabel': 'Brand Assets',
  'Landing.ai.model5.assetValue': 'Preserves True Truck Decals',

  // ------------------------------ ROI ------------------------------
  'Landing.roi.sectionLabel': 'Measurable Business Impact',
  'Landing.roi.title': 'Stop Burning Money on Ineffective Agencies',
  'Landing.roi.subtitle':
    'Transparent workflow and model-cost examples based on the current server catalog.',
  'Landing.roi.m1.value': '3 Steps',
  'Landing.roi.m1.label': 'Production Workflow',
  'Landing.roi.m1.desc': 'Upload, generate, then review and schedule',
  'Landing.roi.m2.value': '18.2s',
  'Landing.roi.m2.label': 'Generation Speed',
  'Landing.roi.m2.desc': 'Average multi-model reel synthesis from initial phone upload',
  'Landing.roi.m3.value': 'Review',
  'Landing.roi.m3.label': 'Approval First',
  'Landing.roi.m3.desc': 'Nothing is published before an explicit approval step',
  'Landing.roi.m4.value': '$0.20–$1.44',
  'Landing.roi.m4.label': 'Example 10s Model Cost',
  'Landing.roi.m4.desc': 'Varies by the selected video model and duration',

  // ------------------------------ Stories ------------------------------
  'Landing.stories.rating': 'Illustrative product workflow',
  'Landing.stories.title': 'A Practical Contractor Workflow',
  'Landing.stories.caseLabel': 'PRODUCT SCENARIO · ROOFING CONTRACTOR',
  'Landing.stories.quotePart1':
    '“Upload finished-job photos, generate localized copy and media, then ',
  'Landing.stories.quoteHighlight': 'review every asset before scheduling',
  'Landing.stories.quotePart2': ' it to connected channels.”',
  'Landing.stories.avatarAlt':
    'Portrait of a confident roofing contractor in a navy hi-vis job on a residential jobsite.',
  'Landing.stories.authorName': 'Example Workflow',
  'Landing.stories.authorRole': 'Illustrative scenario · not a customer testimonial',
  'Landing.stories.perfTitle': 'Workflow Stages',
  'Landing.stories.perf1.label': 'Source Material',
  'Landing.stories.perf1.value': 'Jobsite Assets',
  'Landing.stories.perf2.label': 'Content Control',
  'Landing.stories.perf2.value': 'Approval First',
  'Landing.stories.perf3.label': 'Publishing',
  'Landing.stories.perf3.value': 'Connected Accounts',
  'Landing.stories.perfNote': 'Actual results depend on content, market, and connected channels',

  // ------------------------------ Pricing ------------------------------
  'Landing.pricing.sectionLabel': 'Predictable Investment',
  'Landing.pricing.title': 'Simple Pricing for Independent Crews and Multi-Truck Fleets',
  'Landing.pricing.subtitle': 'All plans include full commercial usage rights for all generated media. Cancel anytime.',
  'Landing.pricing.monthly': 'Monthly',
  'Landing.pricing.annual': 'Annual',
  'Landing.pricing.tier1.name': 'Starter',
  'Landing.pricing.tier1.subtitle': 'Solo Contractor',
  'Landing.pricing.tier1.desc': 'Ideal for owner-operators building their first local presence.',
  'Landing.pricing.tier1.f1n': '1',
  'Landing.pricing.tier1.f1v': ' Connected Brand Profile',
  'Landing.pricing.tier1.f2n': '1,000',
  'Landing.pricing.tier1.f2v': ' AI Production Credits / mo',
  'Landing.pricing.tier1.f3': '4 Connected Social Channels',
  'Landing.pricing.tier1.f4': 'AI Localized Captions',
  'Landing.pricing.tier1.f5': 'Wan 3.0 Daily Video Engine',
  'Landing.pricing.tier1.cta': 'Start 14-Day Free Trial',
  'Landing.pricing.tier2.badge': 'MOST POPULAR FOR TRADE COMPANIES',
  'Landing.pricing.tier2.name': 'Agency Pro',
  'Landing.pricing.tier2.subtitle': 'Multi-Truck Fleet',
  'Landing.pricing.tier2.desc': 'Dominates local search with daily automated video reels.',
  'Landing.pricing.tier2.f1n': '5',
  'Landing.pricing.tier2.f1v': ' Connected Brand Profiles',
  'Landing.pricing.tier2.f2n': '3,500',
  'Landing.pricing.tier2.f2v': ' AI Production Credits / mo',
  'Landing.pricing.tier2.f3': 'Seedance 2.5 & Kling 3.0',
  'Landing.pricing.tier2.f4': 'Automated Scheduling & Approval',
  'Landing.pricing.tier2.f5': 'Google Business Profile Review Replier',
  'Landing.pricing.tier2.f6': 'Multi-Format Video Export (9:16 & 16:9)',
  'Landing.pricing.tier2.cta': 'Start 14-Day Free Trial',
  'Landing.pricing.tier3.name': 'Enterprise',
  'Landing.pricing.tier3.subtitle': 'Agencies & Franchises',
  'Landing.pricing.tier3.desc': 'Custom brand assets and references tuned on exact trucks, uniforms, and work styles.',
  'Landing.pricing.tier3.f1n': 'Unlimited',
  'Landing.pricing.tier3.f1v': ' Brand Profiles',
  'Landing.pricing.tier3.f2n': '12,000',
  'Landing.pricing.tier3.f2v': ' AI Production Credits / mo',
  'Landing.pricing.tier3.f3': 'Custom Brand & Vehicle Grounding',
  'Landing.pricing.tier3.f4': 'Client-Approval Workflow',
  'Landing.pricing.tier3.f5': 'Priority Support',
  'Landing.pricing.tier3.cta': 'Contact Enterprise Sales',

  // ------------------------------ FAQ ------------------------------
  'Landing.faq.sectionLabel': 'Frequently Asked Questions',
  'Landing.faq.title': 'Contractor Peace of Mind & Social Safety',
  'Landing.faq.expandIcon': 'expand_more',
  'Landing.faq.q1': 'Do I own the commercial rights to all generated videos and photos?',
  'Landing.faq.a1':
    'Yes, 100%. You retain full, irrevocable commercial ownership over every piece of media, caption, and marketing script produced through Vexora. Publish freely across social channels or use in paid ads.',
  'Landing.faq.q2': 'Will automated posting get my Instagram or Facebook page restricted or banned?',
  'Landing.faq.a2':
    'Publishing is designed to go through official platform connections and your review step — every asset is approved by you before it is queued to the calendar.',
  'Landing.faq.q3': 'How does Vexora ensure roofing or remodeling materials look authentic?',
  'Landing.faq.a3':
    'Our Grounding Engine uses image-to-video conditioned checkpoints that cross-reference manufacturer catalog textures like GAF, Owens Corning, Trex, and James Hardie.',
  'Landing.faq.q4': 'Can I preview and approve content before it automatically publishes?',
  'Landing.faq.a4':
    'Absolutely. Toggle between Full Autopilot or One-Tap Approval mode. Vexora generates the reel and texts you a 15-second preview — reply YES to approve immediate dispatch.',

  // ------------------------------ CTA banner ------------------------------
  'Landing.ctaBanner.claimCredits': 'EXPLORE TRANSPARENT MODEL-BASED PRICING',
  'Landing.ctaBanner.headline': 'Ready to Put Your Contractor Social Media on Autopilot?',
  'Landing.ctaBanner.subtitle':
    'Create an account, configure a company profile, and build your first approval-first content workflow.',
  'Landing.ctaBanner.placeholder': 'Enter your contractor email...',
  'Landing.ctaBanner.getStarted': 'Get Started Free',
  'Landing.ctaBanner.success': 'You’re on the list! Check your inbox.',
  'Landing.ctaBanner.thankYou': 'Thanks for joining. We’ll be in touch shortly.',
  'Landing.ctaBanner.noCard': 'No credit card required',
  'Landing.ctaBanner.trial': 'Server-backed workspace',
  'Landing.ctaBanner.cancel': 'Cancel anytime with 1-click',

  // ------------------------------ Footer ------------------------------
  'Landing.footer.about':
    'Autonomous multimodal generative social production platform engineered specifically for roofers, remodelers, and local trades across the United States and Canada.',
  'Landing.footer.product': 'Product',
  'Landing.footer.higgsfield': 'Image-to-Video Engine',
  'Landing.footer.droneReel': 'Drone Reel Maker',
  'Landing.footer.antiBan': 'Scheduling & Calendar',
  'Landing.footer.beforeAfter': 'Before/After Galleries',
  'Landing.footer.pricingGrid': 'Pricing Grid',
  'Landing.footer.trades': 'Trades',
  'Landing.footer.roofing': 'Roofing Contractors',
  'Landing.footer.kitchenBath': 'Kitchen & Bath Remodel',
  'Landing.footer.hvac': 'HVAC Technicians',
  'Landing.footer.customBuilders': 'Custom Home Builders',
  'Landing.footer.landscaping': 'Landscaping & Hardscape',
  'Landing.footer.legal': 'Legal & Trust',
  'Landing.footer.commercialRights': 'Commercial Media Rights',
  'Landing.footer.privacy': 'Privacy Policy',
  'Landing.footer.terms': 'Terms of Service',
  'Landing.footer.oauth': 'OAuth Security Disclosures',
  'Landing.footer.status': 'Status Dashboard',
  'Landing.footer.copyright': '© 2026 Vexora Inc. All rights reserved. Built for North American trade professionals.',
}

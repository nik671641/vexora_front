import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { BRAND_NAME, BrandLogo } from '../../shared/components/BrandLogo'
import type { SupportMessage } from '../support/supportDemo'
import './LandingPage.css'

type LandingPageProps = {
  onSignIn: () => void
  onRegister: () => void
  supportMessages: SupportMessage[]
  onSupportSend: (text: string) => void
}

const NAV_LINKS = [
  { href: '#features', label: 'Возможности' },
  { href: '#how-it-works', label: 'Как это работает' },
  { href: '#models', label: 'AI-модели' },
  { href: '#integrations', label: 'Интеграции' },
  { href: '#pricing', label: 'Тарифы' },
  { href: '#faq', label: 'FAQ' },
]

const AUDIENCES = [
  {
    image: '/media/craft-table.webp',
    alt: 'Рабочий стол мастерской со штампами и фотографиями',
    title: 'Локальный бизнес',
    text: 'Для владельца бизнеса, которому нужно регулярно вести соцсети, но невыгодно содержать отдельного копирайтера, дизайнера и видеомейкера.',
    result: 'Идеи, готовые посты, визуалы и календарь публикаций в одном месте.',
  },
  {
    image: '/media/plan.webp',
    alt: 'Слово PLAN, набранное штампами на розовой бумаге',
    title: 'Маркетинговые команды',
    text: 'Для команды, которой нужно выпускать больше материалов, сохранять единый стиль бренда и не терять правки в чатах и таблицах.',
    result: 'Память бренда, единый бриф, роли сотрудников и понятное согласование.',
  },
  {
    image: '/media/photographer.webp',
    alt: 'Фотограф с камерой над городом на закате',
    title: 'Контент-агентства',
    text: 'Для агентств, которые одновременно ведут нескольких клиентов и не могут допустить смешивания брендов, файлов и доступов.',
    result: 'Отдельное пространство, память, контент и история действий для каждого клиента.',
  },
  {
    image: '/media/city-roofs.jpg',
    alt: 'Старые городские дома и крыши на фоне неба',
    title: 'Мультибрендовые холдинги',
    text: 'Для компаний с несколькими брендами, отделами и уровнями ответственности, где важны контроль и прозрачность публикаций.',
    result: 'Раздельные права, журнал действий, общий календарь и масштабирование без хаоса.',
  },
]

const STEPS = [
  {
    icon: 'language',
    title: 'Добавьте компанию',
    text: 'Укажите сайт, ценности и описание продукта. AI автоматически извлечёт Tone of Voice, фактоиды и сформирует постоянную память бренда.',
    code: 'company.context = parsed',
  },
  {
    icon: 'magic_button',
    title: 'Создайте контент',
    text: 'Задайте тему или выберите инфоповод из календаря. Система подготовит текст и подберёт подключённую модель изображения или видео под нужный формат.',
    code: 'pipeline: text + visual asset',
  },
  {
    icon: 'verified_user',
    title: 'Проверьте результат',
    text: 'Режим Approval-First помогает поймать ошибки AI до публикации. Редактируйте текст, меняйте формулировки и утверждайте макет в один клик.',
    code: 'gate: manual approval required',
  },
  {
    icon: 'schedule_send',
    title: 'Запланируйте публикацию',
    text: 'Календарь распределит материалы по окнам активности аудитории. Подключения к Telegram, LinkedIn, VK и Instagram сейчас в разработке.',
    code: 'target: calendar scheduled',
  },
]

const LANDING_MODELS = [
  { name: 'Grok Imagine 2.0', media: 'Изображение', mode: 'Text to Image', limits: 'до 1080p', price: 'от $0.04 / изображение' },
  { name: 'Ideogram 4.0', media: 'Изображение', mode: 'Text to Image', limits: 'до 1080p', price: 'от $0.03 / изображение' },
  { name: 'Recraft 4.1', media: 'Изображение', mode: 'Text to Image', limits: 'до 1080p', price: 'от $0.035 / изображение' },
  { name: 'Seedance 2.5', media: 'Видео', mode: 'Text to Video', limits: 'до 1080p · 4–30 сек.', price: 'от $0.144 / сек.' },
  { name: 'Wan 3.0 Prime', media: 'Видео', mode: 'Text to Video', limits: 'до 1080p · 2–30 сек.', price: 'от $0.0408 / сек.' },
  { name: 'Kling 4.0', media: 'Видео', mode: 'Text to Video', limits: 'до 1080p · 3–30 сек.', price: 'от $0.1099 / сек.' },
  { name: 'MiniMax H3', media: 'Видео', mode: 'Text to Video', limits: 'до 2K · 5–15 сек.', price: 'от $0.065 / сек.' },
  { name: 'PixVerse 6', media: 'Видео', mode: 'Text to Video', limits: 'до 1080p · 1–15 сек.', price: 'от $0.0298 / сек.' },
]

const VIDEO_LENGTH = 30

const SCENES = [
  { start: 0, code: '00:00', title: 'Девушка складывает бумажный самолётик', thumb: '/media/scene-1.webp' },
  { start: 5.04, code: '00:05', title: 'Самолётик летит по ночной улице', thumb: '/media/scene-2.webp' },
  { start: 9.6, code: '00:10', title: 'Рынок специй: торговец запускает его дальше', thumb: '/media/scene-3.webp' },
  { start: 15.25, code: '00:15', title: 'Океан и пляж с серфингисткой', thumb: '/media/scene-4.webp' },
  { start: 20.88, code: '00:21', title: 'Крыша на закате: самолётик вернулся', thumb: '/media/scene-5.webp' },
  { start: 25.5, code: '00:26', title: 'Финальная панорама города', thumb: '/media/scene-6.webp' },
]

type CalendarPost = { channel: string; time: string; status: 'ready' | 'review' | 'draft'; image?: string; text?: string }

const STATUS_LABELS = { ready: 'Согласовано', review: 'На согласовании', draft: 'Черновик' }

const CALENDAR: { day: string; date: number; posts: CalendarPost[] }[] = [
  { day: 'Пн', date: 9, posts: [{ channel: 'Instagram', time: '10:00', status: 'ready', image: '/media/sunlight.webp' }] },
  { day: 'Вт', date: 10, posts: [{ channel: 'Telegram', time: '12:30', status: 'ready', text: 'Пять мест, где город виден с крыши' }] },
  { day: 'Ср', date: 11, posts: [{ channel: 'LinkedIn', time: '09:00', status: 'ready', image: '/media/photographer.webp' }, { channel: 'VK', time: '18:00', status: 'review', image: '/media/craft-table.webp' }] },
  { day: 'Чт', date: 12, posts: [{ channel: 'YouTube', time: '16:00', status: 'review', image: '/media/wall-plane.jpg' }] },
  { day: 'Пт', date: 13, posts: [{ channel: 'Instagram', time: '19:00', status: 'review', image: '/media/sunset-roof.webp' }] },
  { day: 'Сб', date: 14, posts: [{ channel: 'Telegram', time: '11:00', status: 'draft', text: 'Как мы собираем план на месяц' }] },
  { day: 'Вс', date: 15, posts: [{ channel: 'Instagram', time: '12:00', status: 'draft', image: '/media/ink-print.webp' }] },
]

const CHANNELS = [
  { name: 'Telegram', text: 'Каналы и группы. Поддержка MarkdownV2, inline-кнопок, медиагрупп и опросов.', api: 'Direct Bot API' },
  { name: 'LinkedIn', text: 'Компании и личные страницы фаундеров. Карусели документов (PDF) и статьи.', api: 'OAuth 2.0' },
  { name: 'VKontakte', text: 'Сообщества и паблики. Полноценная сетка отложенного постинга и лонгриды.', api: 'Community API' },
  { name: 'Instagram', text: 'Бизнес-аккаунты. Лента, карусели до 10 слайдов, автоматический первый комментарий.', api: 'Graph API' },
  { name: 'YouTube', text: 'Шортсы и клипы. Автоматическая загрузка обложек, тегов и описаний таймкодов.', api: 'Data API v3' },
]

const PLANS = [
  {
    name: 'Starter',
    tag: 'Для 1 бренда',
    price: '$49',
    text: 'Идеально для малого бизнеса и специалистов, ведущих один самостоятельный проект.',
    features: ['1,000 кредитов генерации', '1 активная компания в профиле', 'До 2 рабочих мест', 'Подключённые модели изображений и видео', 'Синхронизация с 4 каналами'],
    action: 'Выбрать Starter',
  },
  {
    name: 'Agency',
    tag: 'Мульти-клиент',
    price: '$149',
    text: 'Для маркетинговых команд и агентств, управляющих несколькими изолированными брендами.',
    features: ['5,000 кредитов генерации', 'До 10 изолированных компаний', 'Безлимитное число участников', 'Approval-First режим для клиентов', 'Приоритетная очередь в шлюзах AI'],
    action: 'Подключить Agency',
    featured: true,
  },
  {
    name: 'Enterprise',
    tag: 'Кастомные SLA',
    price: 'Индивидуально',
    text: 'Для корпораций и холдингов с жёсткими требованиями к инфобезопасности и кастомным моделям.',
    features: ['Кастомный пул кредитов и биллинг', 'SSO (SAML, Okta, Active Directory)', 'Fine-tuned кастомные AI-модели', 'Персональный менеджер и SLA 99.99%', 'Развёртывание on-premise по запросу'],
    action: 'Связаться с отделом продаж',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Что такое кредиты генерации и как они расходуются?',
    answer: 'Кредиты — внутренняя единица учёта AI-генераций. Расход зависит от выбранной модели, формата и длительности видео. Перед запуском проверьте оценку в студии; баланс компании доступен в рабочем пространстве.',
  },
  {
    question: `Публикует ли ${BRAND_NAME} посты автоматически без моего ведома?`,
    answer: 'Категорически нет. Наша базовая архитектура построена на принципе Approval-First: ни одна единица контента не может уйти в эфир, пока ответственный сотрудник компании или агентства не подтвердит статус готовности публикации.',
  },
  {
    question: 'Можно ли использовать собственные материалы?',
    answer: 'Да. Загружайте референсы и используйте их в процессе создания изображений и видео. Профиль компании задаёт контекст бренда, аудиторию и визуальные правила.',
  },
  {
    question: 'Можно ли управлять несколькими компаниями?',
    answer: 'Да. Для каждой компании сохраняются отдельные профиль бренда, референсы, контент и подключения. Переключение активной компании доступно в верхней панели рабочего пространства.',
  },
]

function Icon({ name }: { name: string }) {
  return <span aria-hidden="true" className="material-symbols-outlined">{name}</span>
}

function SectionHead({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return <header className="lp-head">
    <p className="lp-kicker">{kicker}</p>
    <h2>{title}</h2>
    {children && <p className="lp-head-text">{children}</p>}
  </header>
}

/** Plays a muted video only on screen. Reduced motion keeps it still until the viewer asks. */
function useInViewPlayback(videoRef: RefObject<HTMLVideoElement | null>) {
  const pausedByUser = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !pausedByUser.current) void video.play().catch(() => undefined)
      else video.pause()
    }, { threshold: .3 })
    observer.observe(video)
    return () => observer.disconnect()
  }, [videoRef])
  function play() {
    pausedByUser.current = false
    void videoRef.current?.play().catch(() => undefined)
  }
  function toggle() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) { play(); return }
    pausedByUser.current = true
    video.pause()
  }
  return { playing, setPlaying, play, toggle }
}

function VideoToggle({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return <button aria-label={playing ? 'Поставить видео на паузу' : 'Запустить видео'} className="lp-video-toggle" onClick={onToggle} type="button"><Icon name={playing ? 'pause' : 'play_arrow'} /></button>
}

function AutoVideo({ src, poster, label, loop = true }: { src: string; poster: string; label: string; loop?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { playing, setPlaying, toggle } = useInViewPlayback(videoRef)
  return <>
    <video aria-label={label} loop={loop} muted onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} playsInline poster={poster} preload="none" ref={videoRef} src={src} />
    <VideoToggle onToggle={toggle} playing={playing} />
  </>
}

/** The script and the film side by side: the active scene follows the video, a click jumps to it. */
function StudioPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { playing, setPlaying, play, toggle } = useInViewPlayback(videoRef)
  const [time, setTime] = useState(0)
  const active = SCENES.reduce((current, scene, index) => (time >= scene.start ? index : current), 0)
  const sceneEnd = SCENES[active + 1]?.start ?? VIDEO_LENGTH
  const progress = Math.min(1, Math.max(0, (time - SCENES[active].start) / (sceneEnd - SCENES[active].start)))
  function jump(start: number) {
    const video = videoRef.current
    if (!video) return
    video.currentTime = start
    setTime(start)
    play()
  }
  return <div className="lp-studio-body">
    <div className="lp-studio-script">
      <div className="lp-brief">
        <p className="lp-studio-label">Бриф</p>
        <p>Бумажный самолётик облетает мир и возвращается к автору.</p>
      </div>
      <p className="lp-studio-label">Сценарий</p>
      <ol aria-label="Сцены ролика" className="lp-scenes">
        {SCENES.map((scene, index) => <li key={scene.code}>
          <button aria-current={index === active ? 'step' : undefined} className={index === active ? 'is-active' : ''} onClick={() => jump(scene.start)} type="button">
            <img alt="" loading="lazy" src={scene.thumb} />
            <span><time>{scene.code}</time>{scene.title}</span>
            {index === active && <i aria-hidden="true" style={{ '--scene-progress': progress } as CSSProperties} />}
          </button>
        </li>)}
      </ol>
    </div>
    <figure className="lp-player">
      <div className="lp-player-screen">
        <video aria-label="Пример рекламного видео, созданного моделью Seedance 2.5: бумажный самолётик облетает мир" loop muted onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)} playsInline poster="/media/showcase-poster.jpg" preload="metadata" ref={videoRef} src="/media/showcase.mp4" />
        <VideoToggle onToggle={toggle} playing={playing} />
      </div>
      <figcaption>
        <span>Seedance 2.5</span><span>1920×1080</span><span>30 сек.</span>
        <a href="#approval">Дальше: проверка перед публикацией <Icon name="arrow_downward" /></a>
      </figcaption>
    </figure>
  </div>
}

function ApprovalStamp() {
  return <svg aria-hidden="true" className="lp-stamp" viewBox="0 0 140 140">
    <defs><path d="M70 70m-51 0a51 51 0 1 1 102 0a51 51 0 1 1-102 0" id="lp-stamp-ring" /></defs>
    <circle cx="70" cy="70" r="66" fill="none" stroke="currentColor" strokeWidth="3" />
    <circle cx="70" cy="70" r="40" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <text className="lp-stamp-ring"><textPath href="#lp-stamp-ring">СОГЛАСОВАНО · {BRAND_NAME.toUpperCase()} · APPROVAL-FIRST ·</textPath></text>
    <path d="M52 71l12 12 24-27" fill="none" stroke="currentColor" strokeLinecap="square" strokeWidth="6" />
  </svg>
}

function ApprovalJournal() {
  const [approved, setApproved] = useState(false)
  return <div className="lp-journal">
    <div className="lp-journal-head"><strong>Журнал ревизий и согласований</strong><span>Audit Trail #4102</span></div>
    <ol>
      <li><Icon name="edit_note" /><div><p><strong>AI создал черновик публикации</strong><time>14:20</time></p><span>Сгенерировано 3 варианта лид-абзаца.</span></div></li>
      <li><Icon name="rule" /><div><p><strong>Редактор внёс корректировку</strong><time>14:35</time></p><span>Заменён тезис о стоимости на формулировку из Brand Book.</span></div></li>
      {approved
        ? <li className="is-approved"><Icon name="verified" /><div><p><strong>Утверждено главным редактором</strong><time>15:02</time></p><span>Пост переведён в статус «В очереди планировщика».</span></div></li>
        : <li className="is-waiting"><Icon name="hourglass_empty" /><div><p><strong>Ждёт вашего подтверждения</strong></p><span>Пока вы не нажмёте кнопку, пост никуда не уйдёт.</span></div></li>}
    </ol>
    {approved && <ApprovalStamp />}
    <div aria-live="polite" className="lp-journal-foot">
      <span>{approved ? 'Публикация в очереди' : 'Пример истории согласования'}</span>
      <button className={`lp-button ${approved ? 'lp-button--quiet' : 'lp-button--primary'} lp-button--small`} onClick={() => setApproved((value) => !value)} type="button">{approved ? 'Отменить' : 'Утвердить публикацию'}</button>
    </div>
  </div>
}

export function LandingPage({ onSignIn, onRegister }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  useEffect(() => {
    const previousLanguage = document.documentElement.lang
    document.documentElement.lang = 'ru'
    return () => { document.documentElement.lang = previousLanguage }
  }, [])
  useEffect(() => {
    if (!menuOpen) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [menuOpen])
  function handleLink(event: MouseEvent<HTMLDivElement>) {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]')
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    const href = link.getAttribute('href') ?? ''
    if (!href.startsWith('#')) return
    event.preventDefault()
    setMenuOpen(false)
    if (href === '#/signin') { onSignIn(); return }
    if (href === '#/register') { onRegister(); return }
    const target = document.getElementById(href.slice(1))
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }
  return <div className="lp" onClick={handleLink}>
    <header className="lp-header">
      <div className="lp-header-inner">
        <a aria-label={`${BRAND_NAME}, в начало страницы`} className="lp-brand" href="#top"><BrandLogo /></a>
        <nav aria-label="Основная навигация" className={`lp-nav${menuOpen ? ' is-open' : ''}`} id="lp-nav">
          {NAV_LINKS.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
        </nav>
        <div className="lp-header-actions">
          <a className="lp-signin" href="#/signin">Войти</a>
          <a className="lp-button lp-button--primary lp-button--small" href="#/register">Начать бесплатно</a>
          <button aria-controls="lp-nav" aria-expanded={menuOpen} aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'} className="lp-menu-toggle" onClick={() => setMenuOpen((value) => !value)} type="button"><Icon name={menuOpen ? 'close' : 'menu'} /></button>
        </div>
      </div>
    </header>

    <main id="top">
      <section className="lp-hero">
        <div className="lp-hero-copy">
          <p className="lp-kicker">AI-платформа управления контентом</p>
          <h1>Создавайте и планируйте контент для бизнеса в одном рабочем пространстве</h1>
          <p className="lp-lede">{BRAND_NAME} помогает подготовить идею, текст, изображение или видео, согласовать результат и запланировать публикацию без хаоса и потери качества.</p>
          <div className="lp-actions">
            <a className="lp-button lp-button--primary" href="#/register">Начать бесплатно <Icon name="arrow_forward" /></a>
            <a className="lp-button lp-button--quiet" href="#how-it-works">Посмотреть, как работает</a>
          </div>
          <ul className="lp-hero-checks">
            <li><Icon name="check_circle" />Без банковской карты</li>
            <li><Icon name="check_circle" />Approval-First рабочий процесс</li>
            <li><Icon name="check_circle" />Централизация бренда</li>
          </ul>
        </div>

        <div aria-label="Примеры публикаций, созданных в рабочем пространстве" className="lp-wall" role="group">
          <figure className="lp-tile lp-tile--reel">
            <AutoVideo label="Вертикальное видео: крыло самолёта над облаками и городом" poster="/media/wall-plane.jpg" src="/media/wall-plane.mp4" />
            <figcaption className="lp-chip">Reels · 0:12</figcaption>
          </figure>
          <figure className="lp-tile lp-tile--portrait">
            <img alt="Девушка на крыше на закате" src="/media/rooftop-portrait.webp" />
            <figcaption className="lp-chip">Instagram · 18:00</figcaption>
          </figure>
          <div className="lp-tile lp-tile--ready"><Icon name="verified" /><strong>Готово к публикации</strong></div>
          <figure className="lp-tile lp-tile--plan"><img alt="Слово PLAN, набранное штампами" src="/media/plan.webp" /></figure>
          <figure className="lp-tile lp-tile--sunset">
            <img alt="Девушка на крыше смотрит на закат над городом" src="/media/sunset-roof.webp" />
            <figcaption className="lp-chip">LinkedIn · завтра</figcaption>
          </figure>
          <div className="lp-tile lp-tile--post">
            <span>Telegram</span>
            <p>Пять мест, где город виден с крыши</p>
            <b>На согласовании</b>
          </div>
          <span aria-hidden="true" className="lp-bit lp-bit--a" />
          <span aria-hidden="true" className="lp-bit lp-bit--b" />
          <span aria-hidden="true" className="lp-bit lp-bit--c" />
        </div>
      </section>

      <section className="lp-section">
        <SectionHead kicker={`Кому подходит ${BRAND_NAME}`} title="Один сервис для разных контент-задач">Выберите свой сценарий и сразу увидите, какую ежедневную работу {BRAND_NAME} забирает на себя.</SectionHead>
        <div className="lp-audience">
          {AUDIENCES.map((item) => <article key={item.title}>
            <img alt={item.alt} loading="lazy" src={item.image} />
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <p className="lp-audience-result"><strong>Что получите</strong>{item.result}</p>
          </article>)}
        </div>
      </section>

      <section className="lp-tinted" id="how-it-works">
        <div className="lp-section lp-section--flush">
          <SectionHead kicker="Рабочий цикл" title="Четыре шага от идеи до публикации">{BRAND_NAME} заменяет хаотичный стек из разрозненных чат-ботов, таблиц, таск-менеджеров и сервисов автопостинга на один прозрачный конвейер.</SectionHead>
          <ol className="lp-steps">
            {STEPS.map((step, index) => <li key={step.title}>
              <div className="lp-step-top"><span>Шаг 0{index + 1}</span><Icon name={step.icon} /></div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <code>{step.code}</code>
            </li>)}
          </ol>
        </div>
      </section>

      <section className="lp-studio" id="showcase">
        <div className="lp-studio-inner">
          <header className="lp-studio-head">
            <div>
              <p className="lp-kicker">Результат генерации</p>
              <h2>AI-студия в действии</h2>
            </div>
            <p>От брифа и сценария до готового ролика — результат остаётся внутри одного рабочего процесса и проходит проверку перед публикацией.</p>
          </header>
          <StudioPlayer />
        </div>
      </section>

      <section className="lp-section lp-split" id="features">
        <div>
          <SectionHead kicker="Память бренда" title="AI помнит факты, цифры и стиль компании при каждой генерации">Главная проблема базовых нейросетей — контекстная амнезия. В {BRAND_NAME} каждая генерация опирается на строгий профиль бизнеса: реальные достижения, доказательства (Proof Points), запрещённые стоп-слова и портреты целевой аудитории.</SectionHead>
          <ul className="lp-ticks">
            <li><Icon name="check" />Никаких выдуманных фактов или абстрактных формулировок.</li>
            <li><Icon name="check" />Автоматическое соблюдение гайдлайнов и стоп-листов отрасли.</li>
            <li><Icon name="check" />Сохранение стилистики разных авторов под одним брендом.</li>
          </ul>
        </div>
        <div className="lp-photo-panel" style={{ backgroundImage: 'url(/media/notebook.webp)' }}>
          <div className="lp-profile">
            <div className="lp-profile-head"><strong><Icon name="business" />Профиль компании: пример</strong><span>Контекст активен</span></div>
            <div className="lp-profile-body">
              <p className="lp-label">Ключевые факты и цифры (Proof Points)</p>
              <div className="lp-profile-facts">
                <div><strong>99.8% соблюдение SLA доставки</strong><span>Данные внутреннего отчёта за 2024 год</span></div>
                <div><strong>14 собственных хабов</strong><span>Таможенное оформление до 3 часов</span></div>
              </div>
              <div className="lp-profile-pair">
                <div><p className="lp-label">Целевая аудитория</p><span>B2B C-Level: директора по логистике, COO, финансовые контролёры ритейла.</span></div>
                <div><p className="lp-label">Tone of Voice</p><span>Сдержанный, прагматичный, фактологический, без кликбейта.</span></div>
              </div>
              <p className="lp-label">Стоп-лист и запрещённые тезисы</p>
              <div className="lp-stop-list"><span>«быстро и дёшево»</span><span>«лидер рынка без аналогов»</span><span>«гарантия 100%»</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="models">
        <SectionHead kicker="Инфраструктура моделей" title="Подключённые AI-модели" />
        <div className="lp-table-wrap">
          <table className="lp-table">
            <thead><tr><th scope="col">Модель</th><th scope="col">Тип</th><th scope="col">Режим</th><th scope="col">Разрешение и длительность</th><th scope="col">Цена провайдера</th><th scope="col">Статус</th></tr></thead>
            <tbody>
              {LANDING_MODELS.map((model) => <tr key={model.name}>
                <th scope="row">{model.name}</th>
                <td data-label="Тип">{model.media}</td>
                <td data-label="Режим">{model.mode}</td>
                <td data-label="Формат">{model.limits}</td>
                <td data-label="Цена">{model.price}</td>
                <td data-label="Статус"><span className="lp-pill lp-pill--ready">Подключена</span></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="lp-tinted lp-tinted--spaced" id="approval">
        <div className="lp-section lp-section--flush lp-split lp-split--flip">
          <div className="lp-photo-panel" style={{ backgroundImage: 'url(/media/stamps.webp)' }}><ApprovalJournal /></div>
          <div>
            <SectionHead kicker="Принцип контроля" title="Approval-First: никаких случайных публикаций">Мы намеренно проектировали {BRAND_NAME} так, чтобы исключить риск публикации непроверенного AI-контента. Пока ответственный оператор или клиент не нажмёт кнопку подтверждения, ни один байт не попадёт в социальные сети.</SectionHead>
            <div className="lp-facts">
              <div><strong>Двухэтапная проверка</strong><p>Разделение прав между копирайтером, дизайнером и согласующим лицом клиента.</p></div>
              <div><strong>История согласования</strong><p>Полная фиксация, кто, когда и какие изменения внёс перед отправкой в эфир.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="integrations">
        <SectionHead kicker="Синхронизация" title="Календарь и единое управление каналами">Весь контент-план компании на одном экране. Интеграции с популярными платформами сейчас в разработке.</SectionHead>
        <div className="lp-calendar-wrap">
          <div aria-label="Пример контент-плана на неделю" className="lp-calendar" role="group">
            {CALENDAR.map((column) => <div className="lp-calendar-day" key={column.day}>
              <p><span>{column.day}</span> {column.date}</p>
              {column.posts.map((post) => <article className="lp-calendar-post" key={`${post.channel}-${post.time}`}>
                {post.image ? <img alt="" loading="lazy" src={post.image} /> : <p className="lp-calendar-text">{post.text}</p>}
                <div><strong>{post.channel}</strong><span>{post.time}</span></div>
                <span className={`lp-pill lp-pill--${post.status}`}>{STATUS_LABELS[post.status]}</span>
              </article>)}
            </div>)}
          </div>
        </div>
        <ul className="lp-channels">
          {CHANNELS.map((channel) => <li key={channel.name}>
            <strong>{channel.name}</strong>
            <p>{channel.text}</p>
            <div><span>Статус: в разработке</span><span>{channel.api}</span></div>
          </li>)}
        </ul>
      </section>

      <section className="lp-tinted lp-tinted--spaced" id="pricing">
        <div className="lp-section lp-section--flush">
          <div className="lp-centered">
            <SectionHead kicker="Прозрачная стоимость" title="Тарифные планы без скрытых платежей">Предварительная тарифная сетка из дизайн-концепции. Покупка подписок пока недоступна; кнопки открывают регистрацию.</SectionHead>
          </div>
          <div className="lp-plans">
            {PLANS.map((plan) => <article className={`lp-plan${plan.featured ? ' is-featured' : ''}`} key={plan.name}>
              {plan.featured && <p className="lp-plan-flag">Рекомендуем агентствам</p>}
              <div className="lp-plan-top"><h3>{plan.name}</h3><span>{plan.tag}</span></div>
              <p className="lp-plan-price"><strong>{plan.price}</strong>{plan.price.startsWith('$') && <span>/ месяц</span>}</p>
              <p className="lp-plan-text">{plan.text}</p>
              <ul className="lp-ticks lp-ticks--small">{plan.features.map((feature) => <li key={feature}><Icon name="check" />{feature}</li>)}</ul>
              <a className={`lp-button ${plan.featured ? 'lp-button--primary' : 'lp-button--quiet'}`} href="#/register">{plan.action}</a>
            </article>)}
          </div>
        </div>
      </section>

      <section className="lp-section lp-faq" id="faq">
        <div className="lp-centered"><SectionHead kicker="Ответы на вопросы" title="Часто задаваемые вопросы" /></div>
        <div className="lp-faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index
            const answerId = `lp-faq-answer-${index}`
            return <div className={`lp-faq-item${isOpen ? ' is-open' : ''}`} key={item.question}>
              <h3><button aria-controls={answerId} aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? null : index)} type="button"><span>{item.question}</span><Icon name="expand_more" /></button></h3>
              <div hidden={!isOpen} id={answerId}><p>{item.answer}</p></div>
            </div>
          })}
        </div>
      </section>

      <section className="lp-final">
        <AutoVideo label="Камера поднимается от старых городских крыш к чистому небу" loop={false} poster="/media/roofs-sky.jpg" src="/media/roofs.mp4" />
        <div className="lp-final-card">
          <p className="lp-kicker">Быстрый старт</p>
          <h2>Создайте первую публикацию с {BRAND_NAME}</h2>
          <p>Подключите тестовую компанию, сформируйте контент-план на неделю и убедитесь в надёжности режима согласования.</p>
          <div className="lp-actions">
            <a className="lp-button lp-button--primary" href="#/register">Начать бесплатно <Icon name="arrow_forward" /></a>
            <a className="lp-button lp-button--quiet" href="#how-it-works">Посмотреть рабочий процесс</a>
          </div>
        </div>
      </section>
    </main>

    <footer className="lp-footer">
      <div className="lp-footer-main">
        <div>
          <a className="lp-brand" href="#top"><BrandLogo /></a>
          <p>Профессиональная B2B-система для создания, согласования и дистрибуции контента с памятью контекста бренда.</p>
        </div>
        <nav aria-label="Навигация в подвале">{NAV_LINKS.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}</nav>
      </div>
      <div className="lp-footer-end"><span>© 2026 {BRAND_NAME}. Все права защищены.</span><span>Создание · Проверка · Планирование</span></div>
    </footer>
  </div>
}

import { useEffect, useState, type MouseEvent } from 'react'
import { BrandMark } from '../../shared/components/BrandLogo'
import type { SupportMessage } from '../support/supportDemo'
import './LandingPage.css'

type LandingPageProps = {
  onSignIn: () => void
  onRegister: () => void
  supportMessages: SupportMessage[]
  onSupportSend: (text: string) => void
}

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

const FAQ_ITEMS = [
  {
    question: 'Что такое кредиты генерации и как они расходуются?',
    answer: 'Кредиты — внутренняя единица учёта AI-генераций. Расход зависит от выбранной модели, формата и длительности видео. Перед запуском проверьте оценку в студии; баланс компании доступен в рабочем пространстве.',
  },
  {
    question: 'Публикует ли Vexora посты автоматически без моего ведома?',
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

/** Adapted from the supplied Stitch vexora_7 design. */
export function LandingPage({ onSignIn, onRegister }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  useEffect(() => {
    const previousLanguage = document.documentElement.lang
    document.documentElement.lang = 'ru'
    document.documentElement.classList.add('vexora-landing-active')
    return () => {
      document.documentElement.lang = previousLanguage
      document.documentElement.classList.remove('vexora-landing-active')
    }
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
  return <div className="stitch-landing" onClick={handleLink}>


<header className="st:fixed st:top-0 st:left-0 st:right-0 st:z-50 st:bg-surface-container-lowest st:border-b st:border-surface-container-highest st:transition-colors">
<div className="st:max-w-[1400px] st:mx-auto st:px-4 st:sm:px-6 st:h-14 st:flex st:items-center st:justify-between">

<a className="st:flex st:items-center st:gap-2.5 st:group" href="#top">
<BrandMark className="landing-brand-symbol landing-brand-symbol--header" />
<div className="st:flex st:flex-col">
<span className="st:font-headline-sm st:text-headline-sm st:font-semibold st:tracking-tight st:text-primary">Vexora</span>
</div>
</a>

<nav aria-label="Основная навигация" className={`stitch-navigation${menuOpen ? " is-open" : ""}`} id="stitch-navigation">
<a className="st:font-label-md st:text-label-md st:text-secondary st:hover:text-primary st:transition-colors" href="#features">Возможности</a>
<a className="st:font-label-md st:text-label-md st:text-secondary st:hover:text-primary st:transition-colors" href="#how-it-works">Как это работает</a>
<a className="st:font-label-md st:text-label-md st:text-secondary st:hover:text-primary st:transition-colors" href="#models">AI-модели</a>
<a className="st:font-label-md st:text-label-md st:text-secondary st:hover:text-primary st:transition-colors" href="#integrations">Интеграции</a>
<a className="st:font-label-md st:text-label-md st:text-secondary st:hover:text-primary st:transition-colors" href="#pricing">Тарифы</a>
<a className="st:font-label-md st:text-label-md st:text-secondary st:hover:text-primary st:transition-colors" href="#faq">FAQ</a>
</nav><button type="button" className="stitch-menu-toggle" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-controls="stitch-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}><span className="material-symbols-outlined" aria-hidden="true">{menuOpen ? "close" : "menu"}</span></button>

<div className="st:flex st:items-center st:gap-3">
<a className="st:font-label-md st:text-label-md st:text-secondary st:hover:text-primary st:px-3 st:py-1.5 st:transition-colors st:hidden st:sm:inline-flex st:items-center" href="#/signin">
          Войти
        </a>
<a className="landing-primary-cta st:inline-flex st:items-center st:justify-center st:font-label-md st:text-label-md st:text-surface-container-lowest st:px-4 st:py-2 st:rounded st:transition-colors st:tracking-tight st:shadow-sm" href="#/register">
          Начать бесплатно
        </a>
</div>
</div>
</header>
<main id="top" className="st:pt-14">

<section className="landing-hero st:border-b st:border-surface-container-highest st:bg-surface-container-lowest st:relative st:overflow-hidden">
<div className="st:max-w-[1400px] st:mx-auto st:grid st:grid-cols-1 st:lg:grid-cols-12 st:min-h-[640px]">

<div className="st:lg:col-span-6 st:p-6 st:sm:p-10 st:lg:p-14 st:flex st:flex-col st:justify-center st:border-b st:lg:border-b-0 st:lg:border-r st:border-surface-container-highest">
<div className="landing-hero-badge st:inline-flex st:items-center st:gap-2 st:px-2.5 st:py-1 st:rounded st:w-fit st:mb-6">
<span className="landing-hero-badge-dot st:w-1.5 st:h-1.5 st:rounded-full"></span>
<span className="st:font-code-inline st:text-code-inline st:text-secondary st:font-medium st:tracking-wide">AI-платформа управления контентом</span>
</div>
<h1 className="st:font-headline-xl st:text-headline-xl st:sm:text-[2.25rem] st:sm:leading-[2.75rem] st:font-semibold st:text-primary st:tracking-tight st:mb-5">
            Создавайте и планируйте контент для бизнеса в одном рабочем пространстве
          </h1>
<p className="st:font-body-lg st:text-body-lg st:text-secondary st:mb-8 st:max-w-xl">
            Vexora помогает подготовить идею, текст, изображение или видео, согласовать результат и запланировать публикацию без хаоса и потери качества.
          </p>
<div className="st:flex st:flex-col st:sm:flex-row st:items-stretch st:sm:items-center st:gap-3 st:mb-8">
<a className="landing-primary-cta st:h-10 st:px-5 st:text-surface-container-lowest st:font-label-md st:text-label-md st:rounded st:inline-flex st:items-center st:justify-center st:transition-colors" href="#/register">
              Начать бесплатно
              <span className="material-symbols-outlined st:ml-1.5 st:text-[16px]">arrow_forward</span>
</a>
<a className="st:h-10 st:px-5 st:bg-surface-container-low st:border st:border-surface-container-highest st:hover:bg-surface-container st:text-primary st:font-label-md st:text-label-md st:rounded st:inline-flex st:items-center st:justify-center st:transition-colors" href="#how-it-works">
              Посмотреть, как работает
            </a>
</div>
<div className="st:pt-6 st:border-t st:border-surface-container-highest st:flex st:flex-col st:sm:flex-row st:gap-3 st:text-secondary st:font-body-sm st:text-body-sm">
<span className="st:flex st:items-center st:gap-1.5">
<span className="material-symbols-outlined st:text-[15px] st:text-[#198754]">check_circle</span> Без банковской карты
            </span>
<span className="st:hidden st:sm:inline st:text-outline-variant">•</span>
<span className="st:flex st:items-center st:gap-1.5">
<span className="material-symbols-outlined st:text-[15px] st:text-[#198754]">check_circle</span> Approval-First рабочий процесс
            </span>
<span className="st:hidden st:sm:inline st:text-outline-variant">•</span>
<span className="st:flex st:items-center st:gap-1.5">
<span className="material-symbols-outlined st:text-[15px] st:text-[#198754]">check_circle</span> Централизация бренда
            </span>
</div>
</div>

<div className="landing-hero-preview-panel st:lg:col-span-6 st:bg-surface-container-low st:p-4 st:sm:p-8 st:flex st:items-center st:justify-center">
<div className="landing-hero-preview st:w-full st:max-w-xl st:bg-surface-container-lowest st:border st:border-surface-container-highest st:rounded st:overflow-hidden st:shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)]">

<div className="st:h-9 st:px-3.5 st:bg-surface-container-high st:border-b st:border-surface-container-highest st:flex st:items-center st:justify-between">
<div className="st:flex st:items-center st:gap-2">
<span className="st:w-2.5 st:h-2.5 st:rounded-full st:bg-outline-variant"></span>
<span className="st:w-2.5 st:h-2.5 st:rounded-full st:bg-outline-variant"></span>
<span className="st:w-2.5 st:h-2.5 st:rounded-full st:bg-outline-variant"></span>
<span className="st:ml-2 st:font-code-inline st:text-[11px] st:text-secondary">workspace / campaign-q3-fintech</span>
</div>
<div className="st:flex st:items-center st:gap-2">
<span className="st:inline-flex st:items-center st:px-1.5 st:py-0.5 st:rounded st:text-[10px] st:font-code-inline st:bg-surface-container-lowest st:border st:border-surface-container-highest st:text-secondary">
                  Пример интерфейса
                </span>
</div>
</div>

<div className="st:p-4 st:border-b st:border-surface-container-highest st:bg-surface-container-lowest">
<div className="st:grid st:grid-cols-4 st:gap-2 st:text-center st:text-xs">
<div className="st:p-2 st:rounded st:bg-surface-container-low st:border st:border-surface-container-highest">
<div className="st:font-code-inline st:text-[10px] st:text-secondary st:mb-0.5">01. Бриф</div>
<div className="st:font-label-sm st:text-label-sm st:font-semibold st:text-primary st:truncate">B2B Кейс</div>
</div>
<div className="st:p-2 st:rounded st:bg-surface-container-low st:border st:border-surface-container-highest">
<div className="st:font-code-inline st:text-[10px] st:text-secondary st:mb-0.5">02. Синтез</div>
<div className="st:font-label-sm st:text-label-sm st:font-semibold st:text-primary st:truncate">Claude 3.5</div>
</div>
<div className="st:p-2 st:rounded st:bg-surface-container-low st:border st:border-surface-container-highest">
<div className="st:font-code-inline st:text-[10px] st:text-secondary st:mb-0.5">03. Ассет</div>
<div className="st:font-label-sm st:text-label-sm st:font-semibold st:text-primary st:truncate">SeeDance 2.5</div>
</div>
<div className="st:p-2 st:rounded st:bg-surface-container-high st:border st:border-primary st:text-primary">
<div className="st:font-code-inline st:text-[10px] st:text-secondary st:mb-0.5">04. Статус</div>
<div className="st:font-label-sm st:text-label-sm st:font-semibold st:text-[#198754] st:truncate">Готово</div>
</div>
</div>
</div>

<div className="st:p-5 st:space-y-4">
<div className="st:flex st:items-start st:justify-between">
<div>
<span className="st:font-code-inline st:text-code-inline st:text-secondary st:uppercase">ID: POST-8492</span>
<h4 className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary st:mt-0.5">Отчёт: автоматизация бизнес-процессов</h4>
</div>
<span className="st:inline-flex st:items-center st:gap-1.5 st:px-2 st:py-0.5 st:rounded st:text-xs st:font-code-inline st:bg-[#198754]/10 st:text-[#198754] st:border st:border-[#198754]/20">
<span className="st:w-1.5 st:h-1.5 st:rounded-full st:bg-[#198754]"></span>
                  Готово к публикации
                </span>
</div>

<div className="landing-hero-output-summary st:border st:border-surface-container-highest st:rounded st:p-3 st:bg-surface-container-low">
<div className="landing-hero-output-icon">
<span className="material-symbols-outlined">movie</span>
</div>
<div className="st:min-w-0">
<div className="st:font-label-sm st:text-label-sm st:font-semibold st:text-primary">Видео сгенерировано</div>
<div className="st:font-code-inline st:text-[11px] st:text-secondary st:mt-0.5">SeeDance 2.5 · 1920×1080 · 30 сек.</div>
</div>
<span className="landing-hero-output-status">READY</span>
</div>

<div className="st:grid st:grid-cols-3 st:gap-2 st:pt-2 st:border-t st:border-surface-container-highest st:font-code-inline st:text-xs st:text-secondary">
<div>
<div className="st:text-[10px] st:text-outline">Канал</div>
<div className="st:text-primary st:font-medium st:flex st:items-center st:gap-1 st:mt-0.5">
<span className="material-symbols-outlined st:text-[14px]">send</span> Telegram + LI
                  </div>
</div>
<div>
<div className="st:text-[10px] st:text-outline">Дата релиза</div>
<div className="st:text-primary st:font-medium st:mt-0.5">Сегодня, 18:00</div>
</div>
<div>
<div className="st:text-[10px] st:text-outline">Аудит</div>
<div className="st:text-[#198754] st:font-medium st:mt-0.5">✓ Подписан CCO</div>
</div>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="landing-tonal-section landing-audience st:border-b st:border-surface-container-highest st:bg-surface-container-lowest">
<div className="st:max-w-[1400px] st:mx-auto">
<div className="landing-audience-intro st:px-6 st:pt-12 st:pb-8 st:border-b st:border-surface-container-highest st:bg-surface-container-low">
<div>
<span className="landing-section-kicker st:font-code-inline st:text-code-inline st:text-secondary st:uppercase st:tracking-wider">Кому подходит Vexora</span>
<h2 className="st:font-headline-xl st:text-headline-xl st:font-semibold st:text-primary st:tracking-tight st:mt-2">Один сервис для разных контент-задач</h2>
<p className="st:font-body-md st:text-body-md st:text-secondary">
              Выберите свой сценарий и сразу увидите, какую ежедневную работу Vexora забирает на себя.
            </p>
</div>
</div>
<div className="st:grid st:grid-cols-1 st:md:grid-cols-2 st:lg:grid-cols-4 st:divide-y st:md:divide-y-0 st:md:divide-x st:divide-surface-container-highest">

<div className="st:p-6 st:lg:p-8 st:flex st:flex-col st:justify-between">
<div>
<div className="st:w-8 st:h-8 st:rounded st:bg-surface-container-low st:border st:border-surface-container-highest st:flex st:items-center st:justify-center st:text-primary st:mb-4">
<span className="material-symbols-outlined st:text-[18px]">storefront</span>
</div>
<h3 className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary st:mb-2">Локальный бизнес</h3>
<p className="st:font-body-sm st:text-body-sm st:text-secondary">
                Для владельца бизнеса, которому нужно регулярно вести соцсети, но невыгодно содержать отдельного копирайтера, дизайнера и видеомейкера.
              </p>
</div>
<div className="landing-audience-result st:mt-6 st:pt-4 st:border-t st:border-surface-container-highest">
<strong>Что получите</strong><span>Идеи, готовые посты, визуалы и календарь публикаций в одном месте.</span>
</div>
</div>

<div className="st:p-6 st:lg:p-8 st:flex st:flex-col st:justify-between">
<div>
<div className="st:w-8 st:h-8 st:rounded st:bg-surface-container-low st:border st:border-surface-container-highest st:flex st:items-center st:justify-center st:text-primary st:mb-4">
<span className="material-symbols-outlined st:text-[18px]">groups</span>
</div>
<h3 className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary st:mb-2">Маркетинговые команды</h3>
<p className="st:font-body-sm st:text-body-sm st:text-secondary">
                Для команды, которой нужно выпускать больше материалов, сохранять единый стиль бренда и не терять правки в чатах и таблицах.
              </p>
</div>
<div className="landing-audience-result st:mt-6 st:pt-4 st:border-t st:border-surface-container-highest">
<strong>Что получите</strong><span>Память бренда, единый бриф, роли сотрудников и понятное согласование.</span>
</div>
</div>

<div className="st:p-6 st:lg:p-8 st:flex st:flex-col st:justify-between">
<div>
<div className="st:w-8 st:h-8 st:rounded st:bg-surface-container-low st:border st:border-surface-container-highest st:flex st:items-center st:justify-center st:text-primary st:mb-4">
<span className="material-symbols-outlined st:text-[18px]">hub</span>
</div>
<h3 className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary st:mb-2">Контент-агентства</h3>
<p className="st:font-body-sm st:text-body-sm st:text-secondary">
                Для агентств, которые одновременно ведут нескольких клиентов и не могут допустить смешивания брендов, файлов и доступов.
              </p>
</div>
<div className="landing-audience-result st:mt-6 st:pt-4 st:border-t st:border-surface-container-highest">
<strong>Что получите</strong><span>Отдельное пространство, память, контент и история действий для каждого клиента.</span>
</div>
</div>

<div className="st:p-6 st:lg:p-8 st:flex st:flex-col st:justify-between">
<div>
<div className="st:w-8 st:h-8 st:rounded st:bg-surface-container-low st:border st:border-surface-container-highest st:flex st:items-center st:justify-center st:text-primary st:mb-4">
<span className="material-symbols-outlined st:text-[18px]">corporate_fare</span>
</div>
<h3 className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary st:mb-2">Мультибрендовые холдинги</h3>
<p className="st:font-body-sm st:text-body-sm st:text-secondary">
                Для компаний с несколькими брендами, отделами и уровнями ответственности, где важны контроль и прозрачность публикаций.
              </p>
</div>
<div className="landing-audience-result st:mt-6 st:pt-4 st:border-t st:border-surface-container-highest">
<strong>Что получите</strong><span>Раздельные права, журнал действий, общий календарь и масштабирование без хаоса.</span>
</div>
</div>
</div>
</div>
</section>

<div className="landing-mosaic-flow">
<section className="landing-tonal-section landing-workflow st:border-b st:border-surface-container-highest st:bg-surface-container-low st:py-16" id="how-it-works">
<div className="st:max-w-[1400px] st:mx-auto st:px-4 st:sm:px-6">
<div className="st:max-w-2xl st:mb-12">
<span className="landing-section-kicker st:font-code-inline st:text-code-inline st:text-secondary st:uppercase st:tracking-wider">Рабочий цикл</span>
<h2 className="st:font-headline-xl st:text-headline-xl st:font-semibold st:text-primary st:tracking-tight st:mt-1 st:mb-3">
            Четыре шага от идеи до публикации
          </h2>
<p className="st:font-body-md st:text-body-md st:text-secondary">
            Vexora заменяет хаотичный стек из разрозненных чат-ботов, таблиц, таск-менеджеров и сервисов автопостинга на один прозрачный конвейер.
          </p>
</div>
<div className="st:grid st:grid-cols-1 st:md:grid-cols-2 st:lg:grid-cols-4 st:gap-4">

<div className="st:bg-surface-container-lowest st:border st:border-surface-container-highest st:rounded st:p-6 st:flex st:flex-col st:justify-between">
<div>
<div className="st:font-code-inline st:text-xs st:text-secondary st:mb-3 st:flex st:items-center st:justify-between">
<span>ШАГ 01</span>
<span className="material-symbols-outlined st:text-[18px]">language</span>
</div>
<h3 className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary st:mb-2">Добавьте компанию</h3>
<p className="st:font-body-sm st:text-body-sm st:text-secondary st:mb-4">
                Укажите сайт, ценности и описание продукта. AI автоматически извлечет Tone of Voice, фактоиды и сформирует постоянную память бренда.
              </p>
</div>
<div className="st:bg-surface-container-low st:p-2.5 st:rounded st:border st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-secondary">
<code>company.context = parsed</code>
</div>
</div>

<div className="st:bg-surface-container-lowest st:border st:border-surface-container-highest st:rounded st:p-6 st:flex st:flex-col st:justify-between">
<div>
<div className="st:font-code-inline st:text-xs st:text-secondary st:mb-3 st:flex st:items-center st:justify-between">
<span>ШАГ 02</span>
<span className="material-symbols-outlined st:text-[18px]">magic_button</span>
</div>
<h3 className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary st:mb-2">Создайте контент</h3>
<p className="st:font-body-sm st:text-body-sm st:text-secondary st:mb-4">
                Задайте тему или выберите инфоповод из календаря. Система подготовит текст и подберёт подключённую модель изображения или видео под нужный формат.
              </p>
</div>
<div className="st:bg-surface-container-low st:p-2.5 st:rounded st:border st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-secondary">
<code>pipeline: text + visual asset</code>
</div>
</div>

<div className="st:bg-surface-container-lowest st:border st:border-surface-container-highest st:rounded st:p-6 st:flex st:flex-col st:justify-between">
<div>
<div className="st:font-code-inline st:text-xs st:text-secondary st:mb-3 st:flex st:items-center st:justify-between">
<span>ШАГ 03</span>
<span className="material-symbols-outlined st:text-[18px]">verified_user</span>
</div>
<h3 className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary st:mb-2">Проверьте результат</h3>
<p className="st:font-body-sm st:text-body-sm st:text-secondary st:mb-4">
                Режим Approval-First исключает галлюцинации. Редактируйте текст, меняйте формулировки и утверждайте макет в один клик.
              </p>
</div>
<div className="st:bg-surface-container-low st:p-2.5 st:rounded st:border st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-secondary">
<code>gate: manual approval required</code>
</div>
</div>

<div className="st:bg-surface-container-lowest st:border st:border-surface-container-highest st:rounded st:p-6 st:flex st:flex-col st:justify-between">
<div>
<div className="st:font-code-inline st:text-xs st:text-secondary st:mb-3 st:flex st:items-center st:justify-between">
<span>ШАГ 04</span>
<span className="material-symbols-outlined st:text-[18px]">schedule_send</span>
</div>
<h3 className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary st:mb-2">Запланируйте публикацию</h3>
<p className="st:font-body-sm st:text-body-sm st:text-secondary st:mb-4">
                Прямая доставка в Telegram, LinkedIn, VK и Instagram. Таймер распределит материалы по оптимальным окнам вовлечения аудитории.
              </p>
</div>
<div className="st:bg-surface-container-low st:p-2.5 st:rounded st:border st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-secondary">
<code>target: 4 channels scheduled</code>
</div>
</div>
</div>
</div>
</section>

<section className="landing-video-showcase st:border-b st:border-surface-container-highest" id="showcase">
<div className="st:max-w-[1400px] st:mx-auto st:px-4 st:sm:px-6 st:py-16">
<div className="landing-video-showcase-head">
<div>
<span className="landing-section-kicker st:font-code-inline st:text-code-inline st:uppercase st:tracking-wider">Результат генерации</span>
<h2 className="st:font-headline-xl st:text-headline-xl st:font-semibold st:text-primary st:tracking-tight st:mt-2">
              AI-студия в действии
            </h2>
<p className="st:font-body-md st:text-body-md st:text-secondary st:mt-3 st:max-w-2xl">
              От брифа и сценария до готового ролика — результат остаётся внутри одного рабочего процесса и проходит проверку перед публикацией.
            </p>
</div>
<div className="landing-video-showcase-tags" aria-label="Параметры примера видео">
<span><span className="material-symbols-outlined">tune</span> SeeDance 2.5</span>
<span>1920×1080</span>
<span>30 сек.</span>
</div>
</div>

<div className="landing-studio-frame">
<div className="landing-studio-topbar">
<div className="landing-studio-file">
<span className="landing-studio-dots" aria-hidden="true"><i></i><i></i><i></i></span>
<span>workspace/service-master/reel-01.vx</span>
</div>
<div className="landing-studio-render"><span>RENDER: 30 FPS</span><span>READY</span></div>
</div>
<div className="landing-studio-stage">
<video
  aria-label="Пример рекламного видео, созданного моделью SeeDance 2.5"
  className="landing-studio-video"
  loop
  muted
  autoPlay
  playsInline
  preload="metadata"
  src="/media/seedance-2-5-example.mp4"
/>
<div className="landing-studio-badge landing-studio-badge--left">
<span className="material-symbols-outlined">verified_user</span>
<span><strong>Approval Gate</strong><small>Проверка перед публикацией</small></span>
</div>
<div className="landing-studio-badge landing-studio-badge--right">
<span className="material-symbols-outlined">hub</span>
<span><strong>Multi-channel Sync</strong><small>Instagram · Facebook</small></span>
</div>
<div className="landing-studio-caption">Сгенерировано в Vexora · SeeDance 2.5</div>
</div>
<div className="landing-studio-timeline">
<span className="is-complete"><b>01</b> Сценарий</span>
<span className="is-active"><b>02</b> Синтез видео</span>
<span><b>03</b> Проверка</span>
<span><b>04</b> Публикация</span>
<span className="landing-studio-duration">00:30</span>
</div>
</div>
</div>
</section>

<section className="landing-tonal-section landing-features st:border-b st:border-surface-container-highest st:bg-surface-container-lowest st:py-16" id="features">
<div className="st:max-w-[1400px] st:mx-auto st:px-4 st:sm:px-6">
<div className="st:grid st:grid-cols-1 st:lg:grid-cols-12 st:gap-8 st:items-center">

<div className="st:lg:col-span-5">
<span className="landing-section-kicker st:font-code-inline st:text-code-inline st:text-secondary st:uppercase st:tracking-wider">Память бренда</span>
<h2 className="st:font-headline-xl st:text-headline-xl st:font-semibold st:text-primary st:tracking-tight st:mt-1 st:mb-4">
              AI помнит факты, цифры и стиль компании при каждой генерации
            </h2>
<p className="st:font-body-md st:text-body-md st:text-secondary st:mb-6 st:leading-relaxed">
              Главная проблема базовых нейросетей — контекстная амнезия. В Vexora каждая генерация опирается на строгий профиль бизнеса: реальные достижения, доказательства (Proof Points), запрещенные стоп-слова и портреты целевой аудитории.
            </p>
<ul className="st:space-y-3 st:font-body-sm st:text-body-sm st:text-secondary">
<li className="st:flex st:items-start st:gap-2.5">
<span className="material-symbols-outlined st:text-primary st:text-[18px] st:mt-0.5">check</span>
<span>Никаких выдуманных фактов или абстрактных формулировок.</span>
</li>
<li className="st:flex st:items-start st:gap-2.5">
<span className="material-symbols-outlined st:text-primary st:text-[18px] st:mt-0.5">check</span>
<span>Автоматическое соблюдение гайдлайнов и стоп-листов отрасли.</span>
</li>
<li className="st:flex st:items-start st:gap-2.5">
<span className="material-symbols-outlined st:text-primary st:text-[18px] st:mt-0.5">check</span>
<span>Сохранение стилистики разных авторов под одним брендом.</span>
</li>
</ul>
</div>

<div className="st:lg:col-span-7 st:bg-surface-container-low st:border st:border-surface-container-highest st:rounded st:p-4 st:sm:p-6">
<div className="st:bg-surface-container-lowest st:border st:border-surface-container-highest st:rounded">

<div className="st:h-10 st:px-4 st:border-b st:border-surface-container-highest st:flex st:items-center st:justify-between st:bg-surface-container-low">
<span className="st:font-label-sm st:text-label-sm st:font-semibold st:text-primary st:flex st:items-center st:gap-1.5">
<span className="material-symbols-outlined st:text-[16px]">business</span> Профиль компании: Apex Logistics Global
                </span>
<span className="st:font-code-inline st:text-[11px] st:text-[#198754]">Контекст активен (100%)</span>
</div>

<div className="st:p-5 st:space-y-4">

<div>
<div className="st:font-code-inline st:text-code-inline st:text-secondary st:mb-1.5 st:flex st:items-center st:justify-between">
<span>КЛЮЧЕВЫЕ ФАКТЫ И ЦИФРЫ (PROOF POINTS)</span>
<span className="st:text-outline">ReadOnly</span>
</div>
<div className="st:grid st:grid-cols-1 st:sm:grid-cols-2 st:gap-2">
<div className="st:p-2.5 st:bg-surface-container-low st:border st:border-surface-container-highest st:rounded st:text-xs st:font-body-sm">
<div className="st:text-primary st:font-medium">99.8% соблюдение SLA доставки</div>
<div className="st:text-secondary st:text-[11px] st:mt-0.5">Подтверждено аудитом PwC 2024</div>
</div>
<div className="st:p-2.5 st:bg-surface-container-low st:border st:border-surface-container-highest st:rounded st:text-xs st:font-body-sm">
<div className="st:text-primary st:font-medium">14 собственных хабов в СНГ</div>
<div className="st:text-secondary st:text-[11px] st:mt-0.5">Таможенное оформление до 3 часов</div>
</div>
</div>
</div>

<div className="st:grid st:grid-cols-1 st:sm:grid-cols-2 st:gap-3 st:pt-2 st:border-t st:border-surface-container-highest">
<div>
<div className="st:font-code-inline st:text-code-inline st:text-secondary st:mb-1">ЦЕЛЕВАЯ АУДИТОРИЯ</div>
<div className="st:p-2 st:bg-surface-container-low st:border st:border-surface-container-highest st:rounded st:font-body-sm st:text-xs st:text-primary">
                      B2B C-Level: Директора по логистике, COO, финансовые контролеры ритейла.
                    </div>
</div>
<div>
<div className="st:font-code-inline st:text-code-inline st:text-secondary st:mb-1">TONE OF VOICE</div>
<div className="st:p-2 st:bg-surface-container-low st:border st:border-surface-container-highest st:rounded st:font-body-sm st:text-xs st:text-primary">
                      Сдержанный, прагматичный, фактологический, без инфоцыганства и кликбейта.
                    </div>
</div>
</div>

<div className="st:pt-2 st:border-t st:border-surface-container-highest">
<div className="st:font-code-inline st:text-code-inline st:text-secondary st:mb-1.5">СТОП-ЛИСТ И ЗАПРЕЩЕННЫЕ ТЕЗИСЫ</div>
<div className="st:flex st:flex-wrap st:gap-1.5">
<span className="st:px-2 st:py-0.5 st:rounded st:bg-surface-container-low st:border st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-error">
                      ✕ "быстро и дешево"
                    </span>
<span className="st:px-2 st:py-0.5 st:rounded st:bg-surface-container-low st:border st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-error">
                      ✕ "лидер рынка без аналогов"
                    </span>
<span className="st:px-2 st:py-0.5 st:rounded st:bg-surface-container-low st:border st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-error">
                      ✕ "гарантия 100%"
                    </span>
<span className="st:px-2 st:py-0.5 st:rounded st:bg-surface-container-low st:border st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-secondary">
                      + еще 14 ограничений
                    </span>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
</div>

<section className="landing-tonal-section landing-models st:border-b st:border-surface-container-highest st:bg-surface-container-lowest st:py-16" id="models">
<div className="st:max-w-[1400px] st:mx-auto st:px-4 st:sm:px-6">
<div className="st:flex st:flex-col st:md:flex-row st:md:items-end st:justify-between st:mb-8">
<div>
<span className="landing-section-kicker st:font-code-inline st:text-code-inline st:text-secondary st:uppercase st:tracking-wider">Инфраструктура моделей</span>
<h2 className="st:font-headline-xl st:text-headline-xl st:font-semibold st:text-primary st:tracking-tight st:mt-1">
              Подключённые AI-модели
            </h2>
</div>
</div>

<div className="st:border st:border-surface-container-highest st:rounded st:overflow-hidden">
<div className="st:overflow-x-auto">
<table className="st:w-full st:text-left st:border-collapse">
<thead>
<tr className="st:bg-surface-container-low st:border-b st:border-surface-container-highest st:h-10 st:font-label-sm st:text-label-sm st:text-secondary">
<th className="st:px-4 st:py-2 st:font-medium">Модель</th>
<th className="st:px-4 st:py-2 st:font-medium">Тип</th>
<th className="st:px-4 st:py-2 st:font-medium">Режим</th>
<th className="st:px-4 st:py-2 st:font-medium">Разрешение и длительность</th>
<th className="st:px-4 st:py-2 st:font-medium">Цена провайдера</th>
<th className="st:px-4 st:py-2 st:font-medium">Статус</th>
</tr>
</thead>
<tbody className="st:divide-y st:divide-surface-container-highest st:font-body-sm st:text-body-sm">
{LANDING_MODELS.map((model) => <tr className="st:hover:bg-surface-container-low st:transition-colors st:h-11" key={model.name}>
<td className="st:px-4 st:py-2 st:font-medium st:text-primary">
<span className="landing-model-name"><span className="st:w-2 st:h-2 st:rounded-full st:bg-[#198754]"></span>{model.name}</span>
</td>
<td className="st:px-4 st:py-2 st:text-secondary">{model.media}</td>
<td className="st:px-4 st:py-2 st:text-secondary">{model.mode}</td>
<td className="st:px-4 st:py-2 st:font-code-inline st:text-[11px] st:text-secondary">{model.limits}</td>
<td className="st:px-4 st:py-2 st:font-tabular-num st:text-tabular-num st:font-medium st:text-primary st:whitespace-nowrap">{model.price}</td>
<td className="st:px-4 st:py-2"><span className="landing-model-ready">Подключена</span></td>
</tr>)}
</tbody>
</table>
</div>
</div>
</div>
</section>

<section id="approval" className="landing-tonal-section landing-approval st:border-b st:border-surface-container-highest st:bg-surface-container-low st:py-16"><div className="st:max-w-[1400px] st:mx-auto st:px-4 st:sm:px-6"><div className="st:grid st:grid-cols-1 st:lg:grid-cols-12 st:gap-8 st:items-center">
<div className="st:lg:col-span-6 st:bg-surface-container-lowest st:border st:border-surface-container-highest st:rounded st:p-6 st:shadow-sm">
<div className="st:flex st:items-center st:justify-between st:pb-4 st:border-b st:border-surface-container-highest st:mb-4">
<span className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary">Журнал ревизий и согласований</span>
<span className="st:font-code-inline st:text-code-inline st:text-secondary">Audit Trail #4102</span>
</div>
<div className="st:space-y-3 st:font-body-sm st:text-body-sm">
<div className="st:flex st:items-start st:gap-3 st:p-3 st:bg-surface-container-low st:rounded st:border st:border-surface-container-highest">
<span className="material-symbols-outlined st:text-[18px] st:text-secondary st:mt-0.5">edit_note</span>
<div className="st:flex-1">
<div className="st:flex st:items-center st:justify-between">
<span className="st:font-medium st:text-primary">AI создал черновик публикации</span>
<span className="st:font-code-inline st:text-[10px] st:text-secondary">14:20</span>
</div>
<p className="st:text-secondary st:text-xs st:mt-0.5">Claude 3.5 Sonnet сгенерировал 3 варианта лид-абзаца.</p>
</div>
</div>
<div className="st:flex st:items-start st:gap-3 st:p-3 st:bg-surface-container-low st:rounded st:border st:border-surface-container-highest">
<span className="material-symbols-outlined st:text-[18px] st:text-[#B7791F] st:mt-0.5">rule</span>
<div className="st:flex-1">
<div className="st:flex st:items-center st:justify-between">
<span className="st:font-medium st:text-primary">Редактор внес корректировку</span>
<span className="st:font-code-inline st:text-[10px] st:text-secondary">14:35</span>
</div>
<p className="st:text-secondary st:text-xs st:mt-0.5">Заменен тезис о стоимости на формулировку из Brand Book.</p>
</div>
</div>
<div className="st:flex st:items-start st:gap-3 st:p-3 st:bg-surface-container-low st:rounded st:border st:border-surface-container-highest st:border-l-2 st:border-l-[#198754]">
<span className="material-symbols-outlined st:text-[18px] st:text-[#198754] st:mt-0.5">verified</span>
<div className="st:flex-1">
<div className="st:flex st:items-center st:justify-between">
<span className="st:font-medium st:text-primary">Утверждено главным редактором</span>
<span className="st:font-code-inline st:text-[10px] st:text-secondary">15:02</span>
</div>
<p className="st:text-secondary st:text-xs st:mt-0.5">Пост переведен в статус «В очереди планировщика».</p>
</div>
</div>
</div>
<div className="st:mt-4 st:pt-4 st:border-t st:border-surface-container-highest st:flex st:items-center st:justify-between st:text-xs st:font-code-inline st:text-secondary">
<span>Пример истории согласования</span>
<span className="st:text-[#198754]">История действий</span>
</div>
</div>
<div className="st:lg:col-span-6">
<span className="landing-section-kicker st:font-code-inline st:text-code-inline st:text-secondary st:uppercase st:tracking-wider">Принцип контроля</span>
<h2 className="st:font-headline-xl st:text-headline-xl st:font-semibold st:text-primary st:tracking-tight st:mt-1 st:mb-4">
              Approval-First: Никаких случайных публикаций
            </h2>
<p className="st:font-body-md st:text-body-md st:text-secondary st:mb-6 st:leading-relaxed">
              Мы намеренно проектировали Vexora так, чтобы исключить риск публикации непроверенного AI-контента. Пока ответственный оператор или клиент не нажмет кнопку подтверждения, ни один байт не попадет в социальные сети.
            </p>
<div className="st:grid st:grid-cols-1 st:sm:grid-cols-2 st:gap-4">
<div className="st:border st:border-surface-container-highest st:bg-surface-container-lowest st:p-4 st:rounded">
<div className="st:font-label-sm st:text-label-sm st:font-semibold st:text-primary st:mb-1">Двухэтапная проверка</div>
<p className="st:font-body-sm st:text-body-sm st:text-secondary">
                  Разделение прав между копирайтером, дизайнером и согласующим лицом клиента.
                </p>
</div>
<div className="st:border st:border-surface-container-highest st:bg-surface-container-lowest st:p-4 st:rounded">
<div className="st:font-label-sm st:text-label-sm st:font-semibold st:text-primary st:mb-1">История согласования</div>
<p className="st:font-body-sm st:text-body-sm st:text-secondary">
                  Полная фиксация кто, когда и какие изменения внес перед отправкой в эфир.
                </p>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="landing-tonal-section landing-integrations st:border-b st:border-surface-container-highest st:bg-surface-container-lowest st:py-16" id="integrations">
<div className="st:max-w-[1400px] st:mx-auto st:px-4 st:sm:px-6">
<div className="st:max-w-2xl st:mb-12">
<span className="landing-section-kicker st:font-code-inline st:text-code-inline st:text-secondary st:uppercase st:tracking-wider">Синхронизация</span>
<h2 className="st:font-headline-xl st:text-headline-xl st:font-semibold st:text-primary st:tracking-tight st:mt-1 st:mb-3">
            Календарь и единое управление каналами
          </h2>
<p className="st:font-body-md st:text-body-md st:text-secondary">
            Официальные шлюзы с популярными платформами. Vexora публикует текст со сложным форматированием, карусели изображений, теги и кнопки ссылок.
          </p>
</div>
<div className="st:grid st:grid-cols-1 st:sm:grid-cols-2 st:lg:grid-cols-5 st:gap-4">

<div className="st:border st:border-surface-container-highest st:bg-surface-container-lowest st:rounded st:p-5 st:flex st:flex-col st:justify-between">
<div>
<div className="st:flex st:items-center st:justify-between st:mb-3">
<span className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary">Telegram</span>
<span className="st:w-2 st:h-2 st:rounded-full st:bg-[#198754]"></span>
</div>
<p className="st:font-body-sm st:text-body-sm st:text-secondary st:mb-4">
                Каналы и группы. Поддержка MarkdownV2, inline-кнопок, медиагрупп и опросов.
              </p>
</div>
<div className="st:pt-3 st:border-t st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-secondary st:flex st:items-center st:justify-between">
<span>Статус: в разработке</span>
<span className="st:text-primary st:font-medium">Direct Bot API</span>
</div>
</div>

<div className="st:border st:border-surface-container-highest st:bg-surface-container-lowest st:rounded st:p-5 st:flex st:flex-col st:justify-between">
<div>
<div className="st:flex st:items-center st:justify-between st:mb-3">
<span className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary">LinkedIn</span>
<span className="st:w-2 st:h-2 st:rounded-full st:bg-[#198754]"></span>
</div>
<p className="st:font-body-sm st:text-body-sm st:text-secondary st:mb-4">
                Компании и личные страницы фаундеров. Карусели документов (PDF) и статьи.
              </p>
</div>
<div className="st:pt-3 st:border-t st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-secondary st:flex st:items-center st:justify-between">
<span>Статус: в разработке</span>
<span className="st:text-primary st:font-medium">OAuth 2.0</span>
</div>
</div>

<div className="st:border st:border-surface-container-highest st:bg-surface-container-lowest st:rounded st:p-5 st:flex st:flex-col st:justify-between">
<div>
<div className="st:flex st:items-center st:justify-between st:mb-3">
<span className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary">VKontakte</span>
<span className="st:w-2 st:h-2 st:rounded-full st:bg-[#198754]"></span>
</div>
<p className="st:font-body-sm st:text-body-sm st:text-secondary st:mb-4">
                Сообщества и паблики. Полноценная сетка отложенного постинга и лонгриды.
              </p>
</div>
<div className="st:pt-3 st:border-t st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-secondary st:flex st:items-center st:justify-between">
<span>Статус: в разработке</span>
<span className="st:text-primary st:font-medium">Community API</span>
</div>
</div>

<div className="st:border st:border-surface-container-highest st:bg-surface-container-lowest st:rounded st:p-5 st:flex st:flex-col st:justify-between">
<div>
<div className="st:flex st:items-center st:justify-between st:mb-3">
<span className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary">Instagram</span>
<span className="st:w-2 st:h-2 st:rounded-full st:bg-[#198754]"></span>
</div>
<p className="st:font-body-sm st:text-body-sm st:text-secondary st:mb-4">
                Бизнес-аккаунты. Лента, карусели до 10 слайдов, автоматический первый комментарий.
              </p>
</div>
<div className="st:pt-3 st:border-t st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-secondary st:flex st:items-center st:justify-between">
<span>Статус: в разработке</span>
<span className="st:text-primary st:font-medium">Graph API</span>
</div>
</div>

<div className="st:border st:border-surface-container-highest st:bg-surface-container-lowest st:rounded st:p-5 st:flex st:flex-col st:justify-between">
<div>
<div className="st:flex st:items-center st:justify-between st:mb-3">
<span className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary">YouTube</span>
<span className="st:w-2 st:h-2 st:rounded-full st:bg-[#B7791F]"></span>
</div>
<p className="st:font-body-sm st:text-body-sm st:text-secondary st:mb-4">
                Шортсы и клипы. Автоматическая загрузка обложек, тегов и описаний таймкодов.
              </p>
</div>
<div className="st:pt-3 st:border-t st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-secondary st:flex st:items-center st:justify-between">
<span>Статус: в разработке</span>
<span className="st:text-primary st:font-medium">Data API v3</span>
</div>
</div>
</div>
</div>
</section>

<section className="landing-tonal-section landing-pricing st:border-b st:border-surface-container-highest st:bg-surface-container-low st:py-16" id="pricing">
<div className="st:max-w-[1400px] st:mx-auto st:px-4 st:sm:px-6">
<div className="st:text-center st:max-w-xl st:mx-auto st:mb-12">
<span className="landing-section-kicker st:font-code-inline st:text-code-inline st:text-secondary st:uppercase st:tracking-wider">Прозрачная стоимость</span>
<h2 className="st:font-headline-xl st:text-headline-xl st:font-semibold st:text-primary st:tracking-tight st:mt-1 st:mb-3">
            Тарифные планы без скрытых платежей
          </h2>
<p className="st:font-body-md st:text-body-md st:text-secondary">
            Предварительная тарифная сетка из дизайн-концепции. Покупка подписок пока недоступна; кнопки открывают регистрацию.
          </p>
</div>
<div className="st:grid st:grid-cols-1 st:lg:grid-cols-3 st:gap-6 st:items-stretch">

<div className="st:bg-surface-container-lowest st:border st:border-surface-container-highest st:rounded st:p-6 st:sm:p-8 st:flex st:flex-col st:justify-between">
<div>
<div className="st:flex st:items-center st:justify-between st:mb-4">
<span className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary">Starter</span>
<span className="st:font-code-inline st:text-[11px] st:text-secondary st:px-2 st:py-0.5 st:bg-surface-container-low st:rounded st:border st:border-surface-container-highest">Для 1 бренда</span>
</div>
<div className="st:flex st:items-baseline st:gap-1 st:mb-2">
<span className="st:font-headline-xl st:text-headline-xl st:font-bold st:text-primary">$49</span>
<span className="st:font-body-sm st:text-body-sm st:text-secondary">/ месяц</span>
</div>
<p className="st:font-body-sm st:text-body-sm st:text-secondary st:mb-6">
                Идеально для малого бизнеса и специалистов, ведущих один самостоятельный проект.
              </p>
<div className="st:space-y-3 st:pt-6 st:border-t st:border-surface-container-highest st:font-body-sm st:text-body-sm st:text-secondary">
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span className="st:text-primary st:font-medium">1,000 кредитов генерации</span>
</div>
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span>1 активная компания в профиле</span>
</div>
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span>До 2 рабочих мест</span>
</div>
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span>Подключённые модели изображений и видео</span>
</div>
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span>Синхронизация с 4 каналами</span>
</div>
</div>
</div>
<div className="st:pt-8">
<a className="st:w-full st:h-10 st:bg-surface-container-low st:border st:border-surface-container-highest st:hover:bg-surface-container st:text-primary st:font-label-md st:text-label-md st:rounded st:inline-flex st:items-center st:justify-center st:transition-colors" href="#/register">
                Выбрать Starter
              </a>
</div>
</div>

<div className="landing-featured-plan st:bg-surface-container-lowest st:border-2 st:rounded st:p-6 st:sm:p-8 st:flex st:flex-col st:justify-between st:relative">
<div className="landing-featured-plan-label st:absolute st:-top-3 st:right-6 st:text-surface-container-lowest st:text-[11px] st:font-code-inline st:px-2.5 st:py-0.5 st:rounded st:tracking-wide st:uppercase">
              Рекомендуем агентствам
            </div>
<div>
<div className="st:flex st:items-center st:justify-between st:mb-4">
<span className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary">Agency</span>
<span className="st:font-code-inline st:text-[11px] st:text-[#198754] st:px-2 st:py-0.5 st:bg-[#198754]/10 st:rounded st:border st:border-[#198754]/20">Мульти-клиент</span>
</div>
<div className="st:flex st:items-baseline st:gap-1 st:mb-2">
<span className="st:font-headline-xl st:text-headline-xl st:font-bold st:text-primary">$149</span>
<span className="st:font-body-sm st:text-body-sm st:text-secondary">/ месяц</span>
</div>
<p className="st:font-body-sm st:text-body-sm st:text-secondary st:mb-6">
                Для маркетинговых команд и агентств, управляющих несколькими изолированными брендами.
              </p>
<div className="st:space-y-3 st:pt-6 st:border-t st:border-surface-container-highest st:font-body-sm st:text-body-sm st:text-secondary">
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span className="st:text-primary st:font-medium">5,000 кредитов генерации</span>
</div>
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span className="st:text-primary st:font-medium">До 10 изолированных компаний</span>
</div>
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span>Безлимитное число участников</span>
</div>
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span>Approval-First режим для клиентов</span>
</div>
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span>Приоритетная очередь в шлюзах AI</span>
</div>
</div>
</div>
<div className="st:pt-8">
<a className="landing-primary-cta st:w-full st:h-10 st:text-surface-container-lowest st:font-label-md st:text-label-md st:rounded st:inline-flex st:items-center st:justify-center st:transition-colors" href="#/register">
                Подключить Agency
              </a>
</div>
</div>

<div className="st:bg-surface-container-lowest st:border st:border-surface-container-highest st:rounded st:p-6 st:sm:p-8 st:flex st:flex-col st:justify-between">
<div>
<div className="st:flex st:items-center st:justify-between st:mb-4">
<span className="st:font-headline-sm st:text-headline-sm st:font-semibold st:text-primary">Enterprise</span>
<span className="st:font-code-inline st:text-[11px] st:text-secondary st:px-2 st:py-0.5 st:bg-surface-container-low st:rounded st:border st:border-surface-container-highest">Кастомные SLA</span>
</div>
<div className="st:flex st:items-baseline st:gap-1 st:mb-2">
<span className="st:font-headline-xl st:text-headline-xl st:font-bold st:text-primary">Индивидуально</span>
</div>
<p className="st:font-body-sm st:text-body-sm st:text-secondary st:mb-6">
                Для корпораций и холдингов с жесткими требованиями к инфобезопасности и кастомным моделям.
              </p>
<div className="st:space-y-3 st:pt-6 st:border-t st:border-surface-container-highest st:font-body-sm st:text-body-sm st:text-secondary">
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span className="st:text-primary st:font-medium">Кастомный пул кредитов и биллинг</span>
</div>
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span>SSO (SAML, Okta, Active Directory)</span>
</div>
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span>Fine-tuned кастомные AI-модели</span>
</div>
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span>Персональный менеджер и SLA 99.99%</span>
</div>
<div className="st:flex st:items-center st:gap-2">
<span className="material-symbols-outlined st:text-primary st:text-[18px]">check</span>
<span>Развертывание on-premise по запросу</span>
</div>
</div>
</div>
<div className="st:pt-8">
<a className="st:w-full st:h-10 st:bg-surface-container-low st:border st:border-surface-container-highest st:hover:bg-surface-container st:text-primary st:font-label-md st:text-label-md st:rounded st:inline-flex st:items-center st:justify-center st:transition-colors" href="#/register">
                Связаться с отделом продаж
              </a>
</div>
</div>
</div>
</div>
</section>

<section className="landing-tonal-section landing-faq st:border-b st:border-surface-container-highest st:bg-surface-container-lowest st:py-16" id="faq">
<div className="st:max-w-[900px] st:mx-auto st:px-4 st:sm:px-6">
<div className="st:mb-10 st:text-center">
<span className="landing-section-kicker st:font-code-inline st:text-code-inline st:text-secondary st:uppercase st:tracking-wider">Ответы на вопросы</span>
<h2 className="st:font-headline-xl st:text-headline-xl st:font-semibold st:text-primary st:tracking-tight st:mt-1">
            Часто задаваемые вопросы
          </h2>
</div>
<div className="landing-faq-list st:border st:border-surface-container-highest st:rounded">
{FAQ_ITEMS.map((item, index) => {
  const isOpen = openFaq === index
  const answerId = `landing-faq-answer-${index}`
  return <div className={`landing-faq-item${isOpen ? ' is-open' : ''}`} key={item.question}>
    <button aria-controls={answerId} aria-expanded={isOpen} className="landing-faq-question" onClick={() => setOpenFaq(isOpen ? null : index)} type="button">
      <span>{item.question}</span>
      <span aria-hidden="true" className="material-symbols-outlined">expand_more</span>
    </button>
    <div aria-hidden={!isOpen} className="landing-faq-answer" id={answerId} role="region">
      <div><p className="st:font-body-md st:text-body-md st:text-secondary st:leading-relaxed">{item.answer}</p></div>
    </div>
  </div>
})}
</div>
</div>
</section>

<section className="landing-final-cta st:border-b st:border-surface-container-highest st:py-20">
<div className="st:max-w-[1000px] st:mx-auto st:px-4 st:sm:px-6 st:text-center">
<span className="landing-section-kicker st:font-code-inline st:text-code-inline st:text-secondary st:uppercase st:tracking-wider">Быстрый старт</span>
<h2 className="st:font-headline-xl st:text-headline-xl st:sm:text-[2.5rem] st:sm:leading-[3rem] st:font-semibold st:text-primary st:tracking-tight st:mt-2 st:mb-4">
          Создайте первую публикацию с Vexora
        </h2>
<p className="st:font-body-lg st:text-body-lg st:text-secondary st:max-w-xl st:mx-auto st:mb-8">
          Подключите тестовую компанию, сформируйте контент-план на неделю и убедитесь в надежности режима согласования.
        </p>
<div className="st:flex st:flex-col st:sm:flex-row st:items-center st:justify-center st:gap-3">
<a className="landing-primary-cta st:h-11 st:px-6 st:text-surface-container-lowest st:font-label-md st:text-label-md st:rounded st:inline-flex st:items-center st:justify-center st:transition-colors" href="#/register">
            Начать бесплатно
            <span className="material-symbols-outlined st:ml-1.5 st:text-[16px]">arrow_forward</span>
</a>
<a className="st:h-11 st:px-6 st:bg-surface-container-lowest st:border st:border-surface-container-highest st:hover:bg-surface-container-high st:text-primary st:font-label-md st:text-label-md st:rounded st:inline-flex st:items-center st:justify-center st:transition-colors" href="#how-it-works">
            Посмотреть рабочий процесс
          </a>
</div>
</div>
</section>
</main>

<footer className="st:bg-surface-container-lowest st:text-secondary st:border-t st:border-surface-container-highest">
<div className="st:max-w-[1400px] st:mx-auto st:px-4 st:sm:px-6 st:py-12">
<div className="st:grid st:grid-cols-2 st:md:grid-cols-5 st:gap-8 st:mb-12">

<div className="st:col-span-2">
<div className="st:flex st:items-center st:gap-2 st:mb-3">
<BrandMark className="landing-brand-symbol landing-brand-symbol--footer" />
<span className="st:font-headline-sm st:text-headline-sm st:font-semibold st:tracking-tight st:text-primary">Vexora</span>
</div>
<p className="st:font-body-sm st:text-body-sm st:text-secondary st:max-w-sm st:mb-4">
            Профессиональная B2B-система для создания, согласования и дистрибуции контента с памятью контекста бренда.
          </p>
<div className="st:inline-flex st:items-center st:gap-2 st:px-2.5 st:py-1 st:rounded st:bg-surface-container-low st:border st:border-surface-container-highest st:font-code-inline st:text-[11px] st:text-primary">
<span className="st:w-2 st:h-2 st:rounded-full st:bg-[#198754]"></span>
            Контроль на каждом этапе создания
          </div>
</div>

<div>
<h4 className="st:font-label-sm st:text-label-sm st:font-semibold st:text-primary st:uppercase st:tracking-wider st:mb-3">Продукт</h4>
<ul className="st:space-y-2 st:font-body-sm st:text-body-sm">
<li><a className="st:hover:text-primary st:transition-colors" href="#features">Возможности</a></li>
<li><a className="st:hover:text-primary st:transition-colors" href="#how-it-works">Как это работает</a></li>
<li><a className="st:hover:text-primary st:transition-colors" href="#models">AI-модели</a></li>
<li><a className="st:hover:text-primary st:transition-colors" href="#integrations">Интеграции</a></li>
<li><a className="st:hover:text-primary st:transition-colors" href="#pricing">Тарифные планы</a></li>
</ul>
</div>

<div>
<h4 className="st:font-label-sm st:text-label-sm st:font-semibold st:text-primary st:uppercase st:tracking-wider st:mb-3">Документация</h4>
<ul className="st:space-y-2 st:font-body-sm st:text-body-sm">
<li><a className="st:hover:text-primary st:transition-colors" href="#integrations">API Reference</a></li>
<li><a className="st:hover:text-primary st:transition-colors" href="#approval">Гайд по Approval-First</a></li>
<li><a className="st:hover:text-primary st:transition-colors" href="#features">Brand Context Schema</a></li>
<li><a className="st:hover:text-primary st:transition-colors" href="#faq">Changelog v2.4</a></li>
</ul>
</div>

<div>
<h4 className="st:font-label-sm st:text-label-sm st:font-semibold st:text-primary st:uppercase st:tracking-wider st:mb-3">Безопасность</h4>
<ul className="st:space-y-2 st:font-body-sm st:text-body-sm">
<li><a className="st:hover:text-primary st:transition-colors" href="#faq">Политика конфиденциальности</a></li>
<li><a className="st:hover:text-primary st:transition-colors" href="#faq">Условия обслуживания</a></li>
<li><a className="st:hover:text-primary st:transition-colors" href="#faq">Zero Data Retention</a></li>
<li><a className="st:hover:text-primary st:transition-colors" href="#faq">Security Whitepaper</a></li>
</ul>
</div>
</div>
<div className="st:pt-6 st:border-t st:border-surface-container-highest st:flex st:flex-col st:sm:flex-row st:items-center st:justify-between st:font-code-inline st:text-xs st:text-secondary st:gap-3">
<div>
          © 2026 Vexora. Все права защищены.
        </div>
<div className="st:flex st:items-center st:gap-4">
<span className="st:text-primary st:font-medium">Enterprise CMS</span>
<span>•</span>
<span>Создание · Проверка · Планирование</span>
</div>
</div>
</div>
</footer>

  </div>
}

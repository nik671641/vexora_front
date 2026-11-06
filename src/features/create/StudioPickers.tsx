import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { AiModel } from '../../shared/types/product'

function Glyph({ children }: { children: string }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{children}</span>
}

function PickerDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog className="cs-picker-dialog" ref={ref} aria-labelledby={titleId} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <header><div><span className="cs-picker-eyebrow">НАСТРОЙКИ ГЕНЕРАЦИИ</span><h2 id={titleId}>{title}</h2></div><button type="button" aria-label="Закрыть окно" onClick={onClose}><Glyph>close</Glyph></button></header>
    {children}
  </dialog>
}

const familyOf = (model: AiModel) => model.family || model.name
const versionOf = (model: AiModel) => model.version || 'Основная'

export function ModelPicker({ models, value, disabled, onChange }: { models: AiModel[]; value: string; disabled: boolean; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [family, setFamily] = useState('')
  const [version, setVersion] = useState('')
  const selected = models.find((item) => item.name === value)
  const familyOrder = ['Seedance', 'Kling', 'Wan', 'Genjutsu', 'MiniMax Hailuo', 'Happy Horse']
  const priority = (name: string) => {
    const index = familyOrder.indexOf(name)
    return index < 0 ? (name === 'Internal' ? 100 : 50) : index
  }
  const families = [...new Set(models.map(familyOf))].sort((a, b) => priority(a) - priority(b))
  const familyRows = models.filter((item) => familyOf(item) === family)
  const versions = [...new Set(familyRows.map(versionOf))].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  const modes = familyRows.filter((item) => versionOf(item) === version)
  return <>
    <button type="button" className="cs-picker-trigger" aria-label="Выбрать модель" aria-haspopup="dialog" aria-expanded={open} disabled={disabled || !models.length} onClick={() => { setFamily(''); setVersion(''); setOpen(true) }}><span className="cs-picker-trigger-icon"><Glyph>neurology</Glyph></span><span className="cs-picker-trigger-copy"><small>Модель генерации</small><strong>{selected?.name || 'Выберите модель'}</strong></span><span className="cs-picker-trigger-action">Выбрать<Glyph>arrow_forward</Glyph></span></button>
    {open && <PickerDialog title="Выберите модель" onClose={() => setOpen(false)}>
      <nav className="cs-picker-path" aria-label="Уровни каталога"><button type="button" onClick={() => { setFamily(''); setVersion('') }} aria-current={!family ? 'step' : undefined}>Семейство</button><Glyph>chevron_right</Glyph><button type="button" disabled={!family} onClick={() => setVersion('')} aria-current={family && !version ? 'step' : undefined}>{family || 'Версия'}</button><Glyph>chevron_right</Glyph><span aria-current={version ? 'step' : undefined}>{version || 'Режим'}</span></nav>
      <div className="cs-picker-content">
        <p className="cs-picker-description">{!family ? 'Сначала выберите семейство модели.' : !version ? 'Выберите версию ' + family + '.' : 'Выберите способ генерации.'}</p>
        <div className={'cs-picker-tiles ' + (version ? 'cs-picker-tiles--two' : '')}>
          {!family ? families.map((name) => {
            const rows = models.filter((item) => familyOf(item) === name)
            const ready = rows.some((item) => item.ready)
            return <button type="button" key={name} className="cs-picker-tile" onClick={() => setFamily(name)}><span className="cs-tile-icon">{name.slice(0, 2).toUpperCase()}</span><strong>{name}</strong><small>{new Set(rows.map(versionOf)).size} верс. · {ready ? 'Доступно' : 'Скоро'}</small><Glyph>arrow_forward</Glyph></button>
          }) : !version ? versions.map((name) => <button type="button" key={name} className="cs-picker-tile" onClick={() => setVersion(name)}><span className="cs-tile-icon"><Glyph>layers</Glyph></span><strong>{name}</strong><small>{familyRows.filter((item) => versionOf(item) === name).length} режимов</small><Glyph>arrow_forward</Glyph></button>)
            : modes.map((item) => <button type="button" key={item.name} className="cs-picker-tile" disabled={!item.ready} aria-pressed={value === item.name} onClick={() => { onChange(item.name); setOpen(false) }}><span className="cs-tile-icon"><Glyph>{item.workflow?.includes('image_to') ? 'photo_library' : item.workflow?.includes('edit') ? 'edit' : 'movie'}</Glyph></span><strong>{item.mode || item.name}</strong><small>{item.ready ? item.price : 'Режим пока недоступен'}</small>{item.ready && <small>{item.resolution || ''}</small>}</button>)}
        </div>
        {!models.length && <p>Каталог моделей загружается…</p>}
      </div>
      <footer><span>{selected ? 'Выбрано: ' + selected.name : 'Модель ещё не выбрана'}</span>{family && <button type="button" onClick={() => { if (version) setVersion(''); else setFamily('') }}><Glyph>arrow_back</Glyph>Назад</button>}</footer>
    </PickerDialog>}
  </>
}

export type TileOption = { value: string; label: string; hint?: string; ratio?: string }
export function TilePicker({ title, options, value, disabled, onChange }: { title: string; options: TileOption[]; value: string; disabled: boolean; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const selected = options.find((item) => item.value === value)
  const icon = title.includes('Компания') ? 'domain' : title.includes('Стратегическая') ? 'ads_click' : title.includes('Язык') ? 'translate' : title.includes('Тип контента') ? 'widgets' : title.includes('Формат') ? 'aspect_ratio' : title.includes('Длительность') ? 'timer' : title.includes('Качество') ? 'high_quality' : 'tune'
  return <>
    <button className="cs-picker-trigger" type="button" aria-label={title} aria-haspopup="dialog" aria-expanded={open} disabled={disabled || !options.length} onClick={() => setOpen(true)}><span className="cs-picker-trigger-icon"><Glyph>{icon}</Glyph></span><span className="cs-picker-trigger-copy"><small>{title}</small><strong>{selected?.label || 'Выберите значение'}</strong></span><span className="cs-picker-trigger-action">Изменить<Glyph>arrow_forward</Glyph></span></button>
    {open && <PickerDialog title={title} onClose={() => setOpen(false)}><div className="cs-picker-content"><p className="cs-picker-description">Выберите подходящий вариант для публикации.</p><div className="cs-picker-tiles">
      {options.map((item) => <button className="cs-picker-tile" type="button" key={item.value} aria-pressed={item.value === value} onClick={() => { onChange(item.value); setOpen(false) }}>
        {item.ratio && <span className="cs-ratio-shape" style={{ aspectRatio: item.ratio.replace(':', ' / ') }} />}
        <strong>{item.label}</strong>{item.hint && <small>{item.hint}</small>}{item.value === value && <Glyph>check_circle</Glyph>}
      </button>)}
    </div></div></PickerDialog>}
  </>
}

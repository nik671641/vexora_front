import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import './Select.css'

export type SelectOption = { value: string; label: string }

type SelectProps = {
  id?: string
  ariaLabel: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  hideChevron?: boolean
}

export function Select({ id, ariaLabel, value, options, onChange, className = '', disabled = false, hideChevron = false }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [opensUp, setOpensUp] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selectedOption = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', closeOnOutsideClick)
    return () => window.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    listRef.current?.focus({ preventScroll: true })
  }, [open])

  useEffect(() => {
    if (!open) return
    const menu = listRef.current
    const option = menu?.children[activeIndex] as HTMLElement | undefined
    if (!menu || !option) return
    const menuRect = menu.getBoundingClientRect()
    const optionRect = option.getBoundingClientRect()
    if (optionRect.bottom > menuRect.bottom) menu.scrollTop += optionRect.bottom - menuRect.bottom
    else if (optionRect.top < menuRect.top) menu.scrollTop -= menuRect.top - optionRect.top
  }, [open, activeIndex])

  function showList(index = selectedIndex) {
    if (disabled || options.length === 0) return
    const rect = rootRef.current?.getBoundingClientRect()
    if (rect) {
      const menuHeight = Math.min(options.length * 44 + 12, 280)
      setOpensUp(window.innerHeight - rect.bottom < menuHeight && rect.top > window.innerHeight - rect.bottom)
    }
    setActiveIndex(Math.max(0, Math.min(index, options.length - 1)))
    setOpen(true)
  }

  function choose(index: number) {
    onChange(options[index].value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      showList(selectedIndex < 0 ? 0 : selectedIndex)
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(activeIndex)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className={`gf-select ${open ? 'is-open' : ''} ${opensUp ? 'opens-up' : ''} ${hideChevron ? 'gf-select--no-chevron' : ''} ${className}`} ref={rootRef}>
      <button
        aria-controls={open ? listId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="gf-select-trigger"
        disabled={disabled}
        id={id}
        onClick={() => open ? setOpen(false) : showList()}
        onKeyDown={onTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span className="gf-select-value">{selectedOption?.label ?? value}</span>
        {!hideChevron && (
          <svg aria-hidden="true" className="gf-select-chevron" viewBox="0 0 20 20" fill="none">
            <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {open && (
        <div
          aria-activedescendant={`${listId}-option-${activeIndex}`}
          aria-label={ariaLabel}
          className="gf-select-menu"
          id={listId}
          onKeyDown={onListKeyDown}
          ref={listRef}
          role="listbox"
          tabIndex={-1}
        >
          {options.map((option, index) => (
            <div
              aria-selected={option.value === value}
              className={`gf-select-option ${activeIndex === index ? 'is-active' : ''}`}
              id={`${listId}-option-${index}`}
              key={option.value}
              onClick={(event) => { event.preventDefault(); choose(index) }}
              onPointerEnter={() => setActiveIndex(index)}
              role="option"
            >
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

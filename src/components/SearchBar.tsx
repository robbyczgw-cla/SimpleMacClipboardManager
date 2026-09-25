import { useRef, useEffect } from 'react'
import { ClipboardItem } from '../types'
import type { Translations } from '../i18n/translations'
import { Icon, IconName } from './icons'

type FilterType = 'all' | ClipboardItem['type']

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  filterType: FilterType
  onFilterChange: (type: FilterType) => void
  isVertical?: boolean
  t: Translations
}

const FILTERS: { type: FilterType; icon: IconName; labelKey: keyof Translations }[] = [
  { type: 'all', icon: 'all', labelKey: 'all' },
  { type: 'text', icon: 'text', labelKey: 'text' },
  { type: 'link', icon: 'link', labelKey: 'links' },
  { type: 'image', icon: 'image', labelKey: 'images' },
  { type: 'color', icon: 'color', labelKey: 'colors' },
  { type: 'file', icon: 'file', labelKey: 'files' }
]

export default function SearchBar({ value, onChange, filterType, onFilterChange, isVertical = false, t }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus as soon as the panel is shown. requestAnimationFrame instead of a
  // fixed 50 ms timeout: the field is ready on the first painted frame.
  useEffect(() => {
    return window.electronAPI.onPanelShown(() => {
      requestAnimationFrame(() => inputRef.current?.focus())
    })
  }, [])

  return (
    <div className={`flex ${isVertical ? 'flex-col items-stretch' : 'items-center'} gap-2`}>
      <div className="relative min-w-0 flex-1">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={t.search}
          aria-label={t.search}
          spellCheck={false}
          className="field h-9 w-full pl-9 pr-8 text-[15px]"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--chip-bg-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label={t.close}
          >
            <Icon name="close" className="h-2.5 w-2.5" strokeWidth={2.4} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Type filter — one grouped control instead of six loose buttons */}
        <div className="segmented" role="radiogroup" aria-label={t.all}>
          {FILTERS.map(({ type, icon, labelKey }) => {
            const active = filterType === type
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onFilterChange(type)}
                className={`segment segment-icon ${active ? 'segment-active' : ''}`}
                title={t[labelKey]}
                aria-label={t[labelKey]}
              >
                <Icon name={icon} className="h-[15px] w-[15px]" />
              </button>
            )
          })}
        </div>

        {/* Settings — always reachable from the panel, independent of the menu-bar icon */}
        <button
          type="button"
          onClick={() => window.electronAPI.openSettings()}
          aria-label={t.settings}
          title={t.settings}
          className="chip h-8 w-8 shrink-0 justify-center"
        >
          <Icon name="settings" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

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

  // Auto-focus when panel opens
  useEffect(() => {
    const handlePanelShown = () => {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    return window.electronAPI.onPanelShown(handlePanelShown)
  }, [])

  return (
    <div className={`flex ${isVertical ? 'flex-col' : 'items-center'} gap-2`}>
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
          <Icon name="search" className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.search}
          aria-label={t.search}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--search-bg)]
                     border border-[var(--border-color)] rounded-xl
                     text-[var(--text-primary)] placeholder-[var(--text-tertiary)]
                     focus:outline-none focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/20
                     focus:shadow-[0_0_20px_var(--accent-glow)]
                     transition-[border-color,box-shadow] duration-200 text-base"
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)' }}
        />
      </div>

      {/* Filter buttons — monochrome SVG segmented control */}
      <div className={`flex gap-1.5 ${isVertical ? 'flex-wrap justify-center' : ''}`}>
        {FILTERS.map(({ type, icon, labelKey }) => {
          const active = filterType === type
          return (
            <button
              key={type}
              onClick={() => onFilterChange(type)}
              aria-pressed={active}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150
                ${active
                  ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40'
                  : 'bg-white/5 text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-white/10 hover:text-[var(--text-primary)]'
                }`}
              title={t[labelKey]}
            >
              <Icon name={icon} className="w-4 h-4" />
            </button>
          )
        })}
      </div>

      {/* Settings — always reachable from the panel, independent of the menu-bar icon */}
      <button
        onClick={() => window.electronAPI.openSettings()}
        aria-label={t.settings}
        title={t.settings}
        className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0
                   bg-white/5 text-[var(--text-secondary)] border border-[var(--border-color)]
                   hover:bg-white/10 hover:text-[var(--text-primary)] transition-colors"
      >
        <Icon name="settings" className="w-4 h-4" />
      </button>
    </div>
  )
}

import { useRef, useEffect } from 'react'
import { ClipboardItem } from '../types'

type FilterType = 'all' | ClipboardItem['type']

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  itemCount: number
  filterType: FilterType
  onFilterChange: (type: FilterType) => void
  isVertical?: boolean
}

const FILTER_OPTIONS: { type: FilterType; icon: string; label: string }[] = [
  { type: 'all', icon: '📋', label: 'All' },
  { type: 'text', icon: '📝', label: 'Text' },
  { type: 'link', icon: '🔗', label: 'Links' },
  { type: 'color', icon: '🎨', label: 'Colors' },
  { type: 'file', icon: '📁', label: 'Files' },
]

export default function SearchBar({ value, onChange, itemCount, filterType, onFilterChange, isVertical = false }: SearchBarProps) {
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
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search..."
          className={`w-full pl-10 py-2.5 bg-[var(--search-bg)] backdrop-blur-xl
                     border border-[var(--border-color)] rounded-xl
                     text-[var(--text-primary)] placeholder-[var(--text-tertiary)]
                     focus:outline-none focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/20
                     focus:shadow-[0_0_20px_var(--accent-glow)]
                     transition-all duration-200 text-base ${isVertical ? 'pr-4' : 'pr-20'}`}
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)' }}
        />
        {!isVertical && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xs">
            {itemCount} items
          </div>
        )}
      </div>

      {/* Filter buttons - Liquid Glass */}
      <div className={`flex gap-1.5 ${isVertical ? 'flex-wrap justify-center' : ''}`}>
        {FILTER_OPTIONS.map(({ type, icon, label }) => (
          <button
            key={type}
            onClick={() => onFilterChange(type)}
            className={`px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 backdrop-blur-sm
              ${filterType === type
                ? 'bg-blue-500/25 text-blue-300 border border-blue-400/40 shadow-[0_0_16px_rgba(59,130,246,0.3)]'
                : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  )
}

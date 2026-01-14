import { useRef, useEffect } from 'react'
import { ClipboardItem } from '../types'

type FilterType = 'all' | ClipboardItem['type']

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  itemCount: number
  filterType: FilterType
  onFilterChange: (type: FilterType) => void
}

const FILTER_OPTIONS: { type: FilterType; icon: string; label: string }[] = [
  { type: 'all', icon: '📋', label: 'All' },
  { type: 'text', icon: '📝', label: 'Text' },
  { type: 'link', icon: '🔗', label: 'Links' },
  { type: 'color', icon: '🎨', label: 'Colors' },
  { type: 'file', icon: '📁', label: 'Files' },
]

export default function SearchBar({ value, onChange, itemCount, filterType, onFilterChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus when panel opens
  useEffect(() => {
    const handlePanelShown = () => {
      setTimeout(() => inputRef.current?.focus(), 50)
    }

    return window.electronAPI.onPanelShown(handlePanelShown)
  }, [])

  return (
    <div className="flex items-center gap-3">
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
          placeholder="Search clipboard history..."
          className="w-full pl-10 pr-20 py-2.5 bg-white/5 border border-[var(--border-color)] rounded-lg
                     text-[var(--text-primary)] placeholder-[var(--text-secondary)]
                     focus:outline-none focus:border-blue-500/50 focus:bg-white/10
                     transition-all text-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xs">
          {itemCount} items
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-1">
        {FILTER_OPTIONS.map(({ type, icon, label }) => (
          <button
            key={type}
            onClick={() => onFilterChange(type)}
            className={`px-2 py-1.5 rounded-md text-xs transition-all
              ${filterType === type
                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                : 'bg-white/5 text-[var(--text-secondary)] border border-transparent hover:bg-white/10'
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

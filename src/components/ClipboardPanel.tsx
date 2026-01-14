import { useRef, useEffect } from 'react'
import { ClipboardItem } from '../types'
import ClipboardCard from './ClipboardCard'
import SearchBar from './SearchBar'

type FilterType = 'all' | ClipboardItem['type']

interface ClipboardPanelProps {
  items: ClipboardItem[]
  selectedIndex: number
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelect: (index: number) => void
  onPaste: (item: ClipboardItem) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
  filterType: FilterType
  onFilterChange: (type: FilterType) => void
}

export default function ClipboardPanel({
  items,
  selectedIndex,
  searchQuery,
  onSearchChange,
  onSelect,
  onPaste,
  onDelete,
  onTogglePin,
  filterType,
  onFilterChange
}: ClipboardPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedCardRef = useRef<HTMLDivElement>(null)

  // Scroll selected card into view
  useEffect(() => {
    if (selectedCardRef.current && scrollRef.current) {
      const container = scrollRef.current
      const card = selectedCardRef.current
      const containerRect = container.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()

      if (cardRect.left < containerRect.left) {
        container.scrollLeft -= containerRect.left - cardRect.left + 20
      } else if (cardRect.right > containerRect.right) {
        container.scrollLeft += cardRect.right - containerRect.right + 20
      }
    }
  }, [selectedIndex])

  // Handle horizontal scroll with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      e.preventDefault()
      scrollRef.current.scrollLeft += e.deltaY
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col justify-end animate-slide-up">
      {/* Main panel */}
      <div className="glass h-full flex flex-col">
        {/* Search bar */}
        <div className="px-5 pt-4 pb-3">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            itemCount={items.length}
            filterType={filterType}
            onFilterChange={onFilterChange}
          />
        </div>

        {/* Clipboard items */}
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          className="scroll-container flex-1 flex gap-3 px-5 pb-3 overflow-x-auto overflow-y-hidden items-start"
          style={{ scrollBehavior: 'smooth' }}
        >
          {items.length === 0 ? (
            <div className="flex items-center justify-center w-full h-full text-[var(--text-secondary)]">
              {searchQuery ? 'No matching items' : 'Clipboard history is empty'}
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                ref={index === selectedIndex ? selectedCardRef : null}
              >
                <ClipboardCard
                  item={item}
                  isSelected={index === selectedIndex}
                  onClick={() => onSelect(index)}
                  onDoubleClick={() => onPaste(item)}
                  onDelete={() => onDelete(item.id)}
                  onCopy={() => onPaste(item)}
                  onTogglePin={() => onTogglePin(item.id)}
                />
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2.5 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
          <div className="flex gap-5">
            <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[10px]">→</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[10px]">↵</kbd> Paste</span>
            <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[10px]">⌘1-9</kbd> Quick</span>
            <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[10px]">esc</kbd> Close</span>
          </div>
          <span className="opacity-70">⌥Space</span>
        </div>
      </div>
    </div>
  )
}

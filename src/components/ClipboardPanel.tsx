import { useRef, useEffect } from 'react'
import { ClipboardItem } from '../types'
import ClipboardCard from './ClipboardCard'
import SearchBar from './SearchBar'

interface ClipboardPanelProps {
  items: ClipboardItem[]
  selectedIndex: number
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelect: (index: number) => void
  onPaste: (item: ClipboardItem) => void
  onDelete: (id: string) => void
}

export default function ClipboardPanel({
  items,
  selectedIndex,
  searchQuery,
  onSearchChange,
  onSelect,
  onPaste,
  onDelete
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
      <div className="glass bg-[var(--panel-bg)] border-t border-[var(--border-color)]">
        {/* Search bar */}
        <div className="px-6 pt-4 pb-3">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            itemCount={items.length}
          />
        </div>

        {/* Clipboard items */}
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          className="scroll-container flex gap-3 px-6 pb-4 overflow-x-auto overflow-y-hidden"
          style={{ scrollBehavior: 'smooth' }}
        >
          {items.length === 0 ? (
            <div className="flex items-center justify-center w-full h-40 text-[var(--text-secondary)]">
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
                />
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <div className="flex gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">→</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">↵</kbd> Paste</span>
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">esc</kbd> Close</span>
          </div>
          <span>⌘⇧V to toggle</span>
        </div>
      </div>
    </div>
  )
}

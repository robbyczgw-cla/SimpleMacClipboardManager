import { useRef, useEffect } from 'react'
import { ClipboardItem, PanelPosition } from '../types'
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
  panelPosition: PanelPosition
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
  onFilterChange,
  panelPosition
}: ClipboardPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedCardRef = useRef<HTMLDivElement>(null)
  const isVertical = panelPosition === 'left' || panelPosition === 'right'

  // Scroll selected card into view
  useEffect(() => {
    if (selectedCardRef.current && scrollRef.current) {
      const container = scrollRef.current
      const card = selectedCardRef.current
      const containerRect = container.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()

      if (isVertical) {
        if (cardRect.top < containerRect.top) {
          container.scrollTop -= containerRect.top - cardRect.top + 20
        } else if (cardRect.bottom > containerRect.bottom) {
          container.scrollTop += cardRect.bottom - containerRect.bottom + 20
        }
      } else {
        if (cardRect.left < containerRect.left) {
          container.scrollLeft -= containerRect.left - cardRect.left + 20
        } else if (cardRect.right > containerRect.right) {
          container.scrollLeft += cardRect.right - containerRect.right + 20
        }
      }
    }
  }, [selectedIndex, isVertical])

  // Handle scroll with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      e.preventDefault()
      if (isVertical) {
        scrollRef.current.scrollTop += e.deltaY
      } else {
        scrollRef.current.scrollLeft += e.deltaY
      }
    }
  }

  // Position-based classes
  const positionClasses = {
    bottom: 'flex-col justify-end',
    top: 'flex-col justify-start',
    left: 'flex-row justify-start',
    right: 'flex-row justify-end'
  }

  const animationClasses = {
    bottom: 'animate-slide-up',
    top: 'animate-slide-down',
    left: 'animate-slide-right',
    right: 'animate-slide-left'
  }

  return (
    <div className={`fixed inset-0 flex ${positionClasses[panelPosition]} ${animationClasses[panelPosition]}`}>
      {/* Main panel */}
      <div className={`glass h-full flex ${isVertical ? 'flex-col' : 'flex-col'}`}>
        {/* Search bar */}
        <div className={isVertical ? 'px-3 pt-4 pb-3' : 'px-5 pt-4 pb-3'}>
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            itemCount={items.length}
            filterType={filterType}
            onFilterChange={onFilterChange}
            isVertical={isVertical}
          />
        </div>

        {/* Clipboard items */}
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          className={`scroll-container flex-1 flex gap-3 ${
            isVertical
              ? 'flex-col px-3 pb-3 overflow-y-auto overflow-x-hidden items-stretch'
              : 'px-5 pb-3 overflow-x-auto overflow-y-hidden items-end'
          }`}
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
                className={isVertical ? 'flex-shrink-0' : ''}
              >
                <ClipboardCard
                  item={item}
                  isSelected={index === selectedIndex}
                  onClick={() => onSelect(index)}
                  onDoubleClick={() => onPaste(item)}
                  onDelete={() => onDelete(item.id)}
                  onCopy={() => onPaste(item)}
                  onTogglePin={() => onTogglePin(item.id)}
                  isVertical={isVertical}
                />
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className={`border-t border-[var(--border-color)] text-[11px] text-[var(--text-tertiary)] ${
          isVertical ? 'px-3 py-2' : 'px-5 py-2.5 flex items-center justify-between'
        }`}>
          {isVertical ? (
            <div className="flex flex-col gap-1 text-center">
              <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[10px]">↵</kbd> Paste</span>
              <span className="opacity-70">⌥Space toggle</span>
            </div>
          ) : (
            <>
              <div className="flex gap-4">
                <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[10px]">↵</kbd> Paste</span>
                <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[10px]">⇧↵</kbd> Plain</span>
                <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[10px]">Space</kbd> Preview</span>
                <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[10px]">⌘1-9</kbd> Quick</span>
              </div>
              <span className="opacity-70">⌥Space to toggle</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

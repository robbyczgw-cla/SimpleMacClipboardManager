import { useRef, useEffect, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
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

// Card dimensions
const CARD_WIDTH = 208 + 12 // 52*4 = 208px width + 12px gap
const VERTICAL_CARD_HEIGHT = 112 + 12 // Vertical mode card height + gap

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
  const listRef = useRef<List>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isVertical = panelPosition === 'left' || panelPosition === 'right'

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && items.length > 0) {
      listRef.current.scrollToItem(selectedIndex, 'smart')
    }
  }, [selectedIndex, items.length])

  // Get container dimensions
  const getContainerSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }
    return { width: 800, height: 200 }
  }, [])

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

  // Render item for virtualized list
  const renderItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index]
    if (!item) return null

    // Add top padding to prevent clipping when cards scale up
    const adjustedStyle = {
      ...style,
      top: typeof style.top === 'number' ? style.top + 6 : style.top,
      left: typeof style.left === 'number' ? style.left + 6 : style.left,
    }

    return (
      <div style={adjustedStyle} className={isVertical ? 'px-3' : ''}>
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
    )
  }, [items, selectedIndex, onSelect, onPaste, onDelete, onTogglePin, isVertical])

  const containerSize = getContainerSize()

  return (
    <div className={`fixed inset-0 flex ${positionClasses[panelPosition]} ${animationClasses[panelPosition]}`}>
      {/* Main panel */}
      <div className={`glass flex flex-col ${isVertical ? 'h-full' : ''}`}>
        {/* Search bar */}
        <div className={isVertical ? 'px-3 pt-8 pb-3' : 'px-5 pt-8 pb-3'}>
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            itemCount={items.length}
            filterType={filterType}
            onFilterChange={onFilterChange}
            isVertical={isVertical}
          />
        </div>

        {/* Clipboard items - Virtualized */}
        <div
          ref={containerRef}
          className={`flex-1 ${isVertical ? 'overflow-hidden' : 'px-5 pb-3 pt-2'}`}
          style={{ minHeight: isVertical ? 0 : 190 }}
        >
          {items.length === 0 ? (
            <div className="flex items-center justify-center w-full h-full text-[var(--text-secondary)]">
              {searchQuery ? 'No matching items' : 'Clipboard history is empty'}
            </div>
          ) : isVertical ? (
            <List
              ref={listRef}
              height={containerSize.height - 140} // Account for search bar and footer
              itemCount={items.length}
              itemSize={VERTICAL_CARD_HEIGHT}
              width="100%"
              className="scroll-container pt-2"
            >
              {renderItem}
            </List>
          ) : (
            <List
              ref={listRef}
              height={190}
              itemCount={items.length}
              itemSize={CARD_WIDTH}
              width={containerSize.width - 40} // Account for padding
              layout="horizontal"
              className="scroll-container"
            >
              {renderItem}
            </List>
          )}
        </div>

        {/* Footer hint */}
        <div className={`border-t border-[var(--border-color)] text-xs text-[var(--text-tertiary)] ${
          isVertical ? 'px-3 py-2' : 'px-5 py-3 flex items-center justify-between'
        }`}>
          {isVertical ? (
            <div className="flex flex-col gap-1 text-center">
              <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[11px]">↵</kbd> Paste</span>
              <span className="opacity-70">⌥Space toggle</span>
            </div>
          ) : (
            <>
              <div className="flex gap-4">
                <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[11px]">↵</kbd> Paste</span>
                <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[11px]">⌘C</kbd> Copy</span>
                <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[11px]">⇧↵</kbd> Plain</span>
                <span><kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[11px]">Space</kbd> Preview</span>
              </div>
              <span className="opacity-70">⌥Space to toggle</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

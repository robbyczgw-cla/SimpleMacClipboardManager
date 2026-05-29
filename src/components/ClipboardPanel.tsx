import { useRef, useEffect, useMemo, useState, memo } from 'react'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import { ClipboardItem, PanelPosition, CardSize } from '../types'
import type { Translations } from '../i18n/translations'
import { CARD_DIMENSIONS, CARD_GAP } from '../cardSizes'
import ClipboardCard from './ClipboardCard'
import SearchBar from './SearchBar'
import { Icon } from './icons'

type FilterType = 'all' | ClipboardItem['type']

interface ClipboardPanelProps {
  items: ClipboardItem[]
  selectedIndex: number
  selectedIds: Set<string>
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelect: (index: number) => void
  onToggleSelect: (id: string, shiftKey: boolean) => void
  onPaste: (item: ClipboardItem) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
  onPreview: (item: ClipboardItem) => void
  filterType: FilterType
  onFilterChange: (type: FilterType) => void
  panelPosition: PanelPosition
  cardSize: CardSize
  t: Translations
}

interface RowData {
  items: ClipboardItem[]
  selectedIndex: number
  selectedIds: Set<string>
  cardSize: CardSize
  isVertical: boolean
  t: Translations
  onSelect: (index: number) => void
  onToggleSelect: (id: string, shiftKey: boolean) => void
  onPaste: (item: ClipboardItem) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
  onPreview: (item: ClipboardItem) => void
}

// Memoized row reading from `itemData`, so changing the toast / unrelated App
// state doesn't re-render visible cards. Only the ~2 cards whose selected state
// actually changed re-render on arrow navigation.
const Row = memo(function Row({ index, style, data }: ListChildComponentProps<RowData>) {
  const item = data.items[index]
  if (!item) return null
  // Small offset gives the card's drop-shadow / hover lift room inside the row box.
  const adjustedStyle: React.CSSProperties = {
    ...style,
    top: typeof style.top === 'number' ? style.top + 6 : style.top,
    left: typeof style.left === 'number' ? style.left + 6 : style.left
  }
  return (
    <div style={adjustedStyle} className={data.isVertical ? 'px-3' : ''}>
      <ClipboardCard
        item={item}
        isSelected={index === data.selectedIndex}
        isMultiSelected={data.selectedIds.has(item.id)}
        onClick={(e) => {
          if (e.shiftKey) data.onToggleSelect(item.id, true)
          else data.onSelect(index)
        }}
        onDoubleClick={() => data.onPaste(item)}
        onDelete={() => data.onDelete(item.id)}
        onCopy={() => data.onPaste(item)}
        onTogglePin={() => data.onTogglePin(item.id)}
        onPreview={() => data.onPreview(item)}
        isVertical={data.isVertical}
        cardSize={data.cardSize}
        t={data.t}
      />
    </div>
  )
})

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded text-[11px]">{children}</kbd>
}

export default function ClipboardPanel({
  items,
  selectedIndex,
  selectedIds,
  searchQuery,
  onSearchChange,
  onSelect,
  onToggleSelect,
  onPaste,
  onDelete,
  onTogglePin,
  onPreview,
  filterType,
  onFilterChange,
  panelPosition,
  cardSize,
  t
}: ClipboardPanelProps) {
  const listRef = useRef<List>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isVertical = panelPosition === 'left' || panelPosition === 'right'
  const dims = CARD_DIMENSIONS[cardSize]

  // Measure the scroll container with a ResizeObserver so the virtualized list is
  // sized from real dimensions (handles multi-monitor width changes) instead of a
  // hardcoded guess, and without forcing layout during render.
  const [size, setSize] = useState({ width: 800, height: 200 })
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const cr = entries[0]?.contentRect
      if (cr) setSize({ width: cr.width, height: cr.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Keep the selected card in view. Depends only on selectedIndex — not on
  // items.length — so a background history push can't retrigger a scroll.
  useEffect(() => {
    if (listRef.current && items.length > 0 && selectedIndex < items.length) {
      listRef.current.scrollToItem(selectedIndex, 'smart')
    }
  }, [selectedIndex])

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

  const itemData = useMemo<RowData>(() => ({
    items,
    selectedIndex,
    selectedIds,
    cardSize,
    isVertical,
    t,
    onSelect,
    onToggleSelect,
    onPaste,
    onDelete,
    onTogglePin,
    onPreview
  }), [items, selectedIndex, selectedIds, cardSize, isVertical, t, onSelect, onToggleSelect, onPaste, onDelete, onTogglePin, onPreview])

  const selectedItem = items[selectedIndex]

  // Contextual footer hints — only show what applies to the current selection.
  const hints: { combo: React.ReactNode; label: string }[] = [
    { combo: <Kbd>↵</Kbd>, label: t.paste },
    { combo: <Kbd>Space</Kbd>, label: t.preview }
  ]
  if (selectedItem?.type === 'text') hints.push({ combo: <Kbd>⇧↵</Kbd>, label: t.plain })
  if (selectedItem?.type === 'link') hints.push({ combo: <Kbd>O</Kbd>, label: t.openUrl })

  return (
    <div className={`fixed inset-0 flex ${positionClasses[panelPosition]} ${animationClasses[panelPosition]}`}>
      <div className={`glass flex flex-col ${isVertical ? 'h-full' : ''}`}>
        {/* Search bar */}
        <div className={isVertical ? 'px-3 pt-5 pb-2' : 'px-5 pt-5 pb-2'}>
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            filterType={filterType}
            onFilterChange={onFilterChange}
            isVertical={isVertical}
            t={t}
          />
        </div>

        {/* Clipboard items - Virtualized */}
        <div
          ref={containerRef}
          className={`flex-1 ${isVertical ? 'overflow-hidden' : 'px-5 pb-3 pt-2'}`}
          style={{ minHeight: isVertical ? 0 : 190 }}
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full h-full gap-3 text-center px-6">
              <Icon
                name={searchQuery ? 'search' : 'clipboard'}
                className="w-9 h-9 text-[var(--text-tertiary)]"
              />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {searchQuery ? t.noMatchingItems : t.clipboardEmpty}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {searchQuery ? t.noMatchHint : t.emptyHint}
                </p>
              </div>
            </div>
          ) : isVertical ? (
            <List
              ref={listRef}
              height={Math.max(0, size.height)}
              itemCount={items.length}
              itemSize={dims.height + CARD_GAP}
              width="100%"
              overscanCount={2}
              itemData={itemData}
              className="scroll-container pt-2"
            >
              {Row}
            </List>
          ) : (
            <List
              ref={listRef}
              height={dims.height + 16}
              itemCount={items.length}
              itemSize={dims.width + CARD_GAP}
              width={size.width}
              layout="horizontal"
              overscanCount={2}
              itemData={itemData}
              className="scroll-container"
            >
              {Row}
            </List>
          )}
        </div>

        {/* Footer hint bar */}
        <div className={`border-t border-[var(--border-color)] text-xs text-[var(--text-tertiary)] ${
          isVertical ? 'px-3 py-2' : 'px-5 py-3 flex items-center justify-between'
        }`}>
          {isVertical ? (
            <div className="flex flex-col gap-1 text-center">
              <span className="flex items-center justify-center gap-1.5"><Kbd>↵</Kbd> {t.paste}</span>
              <span className="opacity-80">⌥Space {t.toggle}</span>
            </div>
          ) : (
            <>
              <div className="flex gap-3 items-center">
                {hints.map((h, i) => (
                  <span key={i} className="flex items-center gap-1.5">{h.combo} {h.label}</span>
                ))}
                {selectedIds.size > 0 && (
                  <span className="flex items-center gap-1.5 text-[var(--multi-select)]">
                    <kbd className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'color-mix(in srgb, var(--multi-select) 22%, transparent)' }}>⌘M</kbd>
                    {t.merge} {selectedIds.size}
                  </span>
                )}
              </div>
              <span className="opacity-80">
                {selectedIds.size > 0 ? t.multiSelectHint : `${items.length} ${t.items}`}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

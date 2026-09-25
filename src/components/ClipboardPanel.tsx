import { useRef, useEffect, useMemo, useState, memo } from 'react'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import { CaptureStatus, ClipboardItem, Collection, PanelPosition, CardSize, PauseCaptureDuration } from '../types'
import type { Translations } from '../i18n/translations'
import { CARD_DIMENSIONS, CARD_GAP, VERTICAL_CARD_TRIM } from '../cardSizes'
import ClipboardCard from './ClipboardCard'
import SearchBar from './SearchBar'
import ShelfBar, { type ShelfView } from './ShelfBar'
import { Icon } from './icons'

type FilterType = 'all' | ClipboardItem['type']

interface ClipboardPanelProps {
  items: ClipboardItem[]
  selectedIndex: number
  selectedIds: Set<string>
  searchQuery: string
  /** Deferred copy of the query, used for card highlighting. */
  highlightQuery: string
  onSearchChange: (query: string) => void
  onSelect: (index: number) => void
  onToggleSelect: (id: string) => void
  onPaste: (item: ClipboardItem) => void
  onDelete: (id: string) => void
  onToggleSaved: (id: string) => void
  onPreview: (item: ClipboardItem) => void
  shelfView: ShelfView
  collections: Collection[]
  selectedCollectionId: string | null
  onShowRecent: () => void
  onShowSaved: () => void
  onShowCollection: (id: string) => void
  onCreateCollection: (name: string) => Promise<boolean>
  onRenameCollection: (id: string, name: string) => Promise<boolean>
  onDeleteCollection: (id: string) => void
  onAssignToCollection: () => void
  captureStatus: CaptureStatus
  onPauseCapture: (duration: PauseCaptureDuration) => void
  onResumeCapture: () => void
  filterType: FilterType
  onFilterChange: (type: FilterType) => void
  panelPosition: PanelPosition
  cardSize: CardSize
  pasteDirectly: boolean
  showQuickKeys: boolean
  now: number
  t: Translations
}

interface RowData {
  items: ClipboardItem[]
  selectedIndex: number
  selectedIds: Set<string>
  highlightQuery: string
  showQuickKeys: boolean
  cardSize: CardSize
  isVertical: boolean
  now: number
  t: Translations
  onSelect: (index: number) => void
  onToggleSelect: (id: string) => void
  onPaste: (item: ClipboardItem) => void
  onDelete: (id: string) => void
  onToggleSaved: (id: string) => void
  onPreview: (item: ClipboardItem) => void
}

// Offset inside each virtual row so the selection ring / glow isn't clipped.
const ROW_INSET = 8

const Row = memo(function Row({ index, style, data }: ListChildComponentProps<RowData>) {
  const item = data.items[index]
  if (!item) return null
  const adjustedStyle: React.CSSProperties = data.isVertical
    ? { ...style, top: typeof style.top === 'number' ? style.top + ROW_INSET : style.top }
    // Horizontal rows get height 'auto': react-window's 100% plus the inset
    // would overflow and paint a spurious vertical scrollbar.
    : { ...style, top: ROW_INSET, height: 'auto', left: typeof style.left === 'number' ? style.left + ROW_INSET : style.left }
  return (
    <div style={adjustedStyle} className={data.isVertical ? 'px-3' : ''}>
      <ClipboardCard
        item={item}
        index={index}
        isSelected={index === data.selectedIndex}
        isMultiSelected={data.selectedIds.has(item.id)}
        showQuickKeys={data.showQuickKeys}
        searchQuery={data.highlightQuery}
        onSelect={data.onSelect}
        onToggleSelect={data.onToggleSelect}
        onPaste={data.onPaste}
        onDelete={data.onDelete}
        onToggleSaved={data.onToggleSaved}
        onPreview={data.onPreview}
        isVertical={data.isVertical}
        cardSize={data.cardSize}
        now={data.now}
        t={data.t}
      />
    </div>
  )
})

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="kbd">{children}</kbd>
}

export default function ClipboardPanel(props: ClipboardPanelProps) {
  const {
    items, selectedIndex, selectedIds, searchQuery, highlightQuery, onSearchChange,
    onSelect, onToggleSelect, onPaste, onDelete, onToggleSaved, onPreview,
    filterType, onFilterChange, panelPosition, cardSize, pasteDirectly, showQuickKeys, now, t
  } = props
  const listRef = useRef<List>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const glassRef = useRef<HTMLDivElement>(null)
  const isVertical = panelPosition === 'left' || panelPosition === 'right'
  const dims = CARD_DIMENSIONS[cardSize]

  // Measure the scroll container so the virtualized list is sized from real
  // dimensions (handles multi-monitor width changes) without forced layout.
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

  // Replay the entrance animation on every open. The window is hidden, not
  // destroyed, so a mount-time CSS animation would only ever run once.
  useEffect(() => {
    return window.electronAPI.onPanelShown(() => {
      const el = glassRef.current
      if (!el) return
      el.classList.remove('panel-enter')
      void el.offsetWidth // restart the animation
      el.classList.add('panel-enter')
      listRef.current?.scrollTo(0)
    })
  }, [])

  // Keep the selected card in view. Depends only on selectedIndex — not on
  // items.length — so a background history push can't retrigger a scroll.
  useEffect(() => {
    if (listRef.current && items.length > 0 && selectedIndex < items.length) {
      listRef.current.scrollToItem(selectedIndex, 'smart')
    }
  }, [selectedIndex])

  const itemData = useMemo<RowData>(() => ({
    items, selectedIndex, selectedIds, highlightQuery, showQuickKeys, cardSize, isVertical, now, t,
    onSelect, onToggleSelect, onPaste, onDelete, onToggleSaved, onPreview
  }), [items, selectedIndex, selectedIds, highlightQuery, showQuickKeys, cardSize, isVertical, now, t, onSelect, onToggleSelect, onPaste, onDelete, onToggleSaved, onPreview])

  const selectedItem = items[selectedIndex]

  // Contextual footer hints — only what applies to the current selection.
  const hints: { combo: React.ReactNode; label: string }[] = [
    { combo: <Kbd>↵</Kbd>, label: pasteDirectly ? t.paste : t.copy },
    { combo: <Kbd>Space</Kbd>, label: t.preview }
  ]
  if (selectedItem?.type === 'text') hints.push({ combo: <Kbd>⇧↵</Kbd>, label: t.plain })
  if (selectedItem?.type === 'link') hints.push({ combo: <Kbd>O</Kbd>, label: t.openUrl })
  if (selectedItem) hints.push({ combo: <Kbd>⌘S</Kbd>, label: selectedItem.savedAt !== undefined || selectedItem.pinned ? t.unsave : t.save })
  hints.push({ combo: <Kbd>⇥</Kbd>, label: t.switchView })

  const edgeClass = {
    bottom: 'panel-edge-bottom',
    top: 'panel-edge-top',
    left: 'panel-edge-left',
    right: 'panel-edge-right'
  }[panelPosition]

  const cardExtent = isVertical ? dims.height - VERTICAL_CARD_TRIM : dims.width

  return (
    <div className={`fixed inset-0 flex ${isVertical ? 'flex-row' : 'flex-col'} ${panelPosition === 'bottom' || panelPosition === 'right' ? 'justify-end' : 'justify-start'}`}>
      <div ref={glassRef} className={`glass panel-enter ${edgeClass} flex h-full min-h-0 w-full flex-col`}>
        <div className={isVertical ? 'px-3 pt-3.5' : 'px-5 pt-3.5'}>
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            filterType={filterType}
            onFilterChange={onFilterChange}
            isVertical={isVertical}
            t={t}
          />
        </div>

        <div className={isVertical ? 'px-3 pt-2' : 'px-5 pt-2'}>
          <ShelfBar
            shelfView={props.shelfView}
            collections={props.collections}
            selectedCollectionId={props.selectedCollectionId}
            onShowRecent={props.onShowRecent}
            onShowSaved={props.onShowSaved}
            onShowCollection={props.onShowCollection}
            onCreateCollection={props.onCreateCollection}
            onRenameCollection={props.onRenameCollection}
            onDeleteCollection={props.onDeleteCollection}
            onAssignToCollection={props.onAssignToCollection}
            captureStatus={props.captureStatus}
            onPauseCapture={props.onPauseCapture}
            onResumeCapture={props.onResumeCapture}
            isVertical={isVertical}
            t={t}
          />
        </div>

        {/* Clipboard items — virtualized */}
        <div
          ref={containerRef}
          role="listbox"
          aria-label={t.items}
          className={`min-h-0 flex-1 ${isVertical ? 'overflow-hidden pt-1' : 'px-3 pt-1'}`}
        >
          {items.length === 0 ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 px-6 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--chip-bg)]">
                <Icon name={searchQuery ? 'search' : props.shelfView === 'saved' ? 'star' : props.shelfView === 'collection' ? 'stack' : 'clipboard'} className="h-5 w-5 text-[var(--text-tertiary)]" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                  {searchQuery ? t.noMatchingItems : props.shelfView === 'saved' ? t.emptySaved : props.shelfView === 'collection' ? t.emptyCollection : t.clipboardEmpty}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                  {searchQuery ? t.noMatchHint : props.shelfView === 'saved' ? t.emptySavedHint : props.shelfView === 'collection' ? t.emptyCollectionHint : t.emptyHint}
                </p>
              </div>
            </div>
          ) : isVertical ? (
            <List
              ref={listRef}
              height={Math.max(0, size.height)}
              itemCount={items.length}
              itemSize={cardExtent + 10}
              width="100%"
              overscanCount={3}
              itemData={itemData}
              className="scroll-container"
            >
              {Row}
            </List>
          ) : (
            <List
              ref={listRef}
              height={Math.max(0, size.height)}
              itemCount={items.length}
              itemSize={cardExtent + CARD_GAP}
              width={size.width}
              layout="horizontal"
              overscanCount={3}
              itemData={itemData}
              className="scroll-container"
            >
              {Row}
            </List>
          )}
        </div>

        {/* Footer hint bar */}
        <div className={`flex h-8 shrink-0 items-center border-t border-[var(--border-color)] text-[11px] text-[var(--text-tertiary)] ${isVertical ? 'justify-center px-3' : 'justify-between px-5'}`}>
          {isVertical ? (
            <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> {pasteDirectly ? t.paste : t.copy}<span className="mx-1 opacity-40">·</span><Kbd>⇥</Kbd> {t.switchView}</span>
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-3 overflow-hidden whitespace-nowrap">
                {hints.map((h, i) => (
                  <span key={i} className="flex items-center gap-1.5">{h.combo} {h.label}</span>
                ))}
              </div>
              <span className="shrink-0 pl-3">
                {selectedIds.size > 0 ? (
                  <span className="flex items-center gap-1.5 text-[var(--multi-select)]">
                    <kbd className="kbd kbd-multi">⌘M</kbd>
                    {t.merge} {selectedIds.size}
                  </span>
                ) : (
                  `${items.length} ${items.length === 1 ? t.itemSingular : t.items}`
                )}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

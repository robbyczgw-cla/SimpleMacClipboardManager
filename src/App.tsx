import { useState, useEffect, useCallback, useMemo, useDeferredValue, useRef } from 'react'
import { CaptureStatus, ClipboardItem, Collection, PanelPosition, CardSize, PauseCaptureDuration } from './types'
import { isItemSaved } from '../common/history'
import { DEFAULT_SAVED_COLLECTION_ID } from '../common/migrations'
import { getTranslations, Language } from './i18n/translations'
import { fuzzyScore } from './utils/fuzzy'
import { Icon } from './components/icons'
import ClipboardPanel from './components/ClipboardPanel'
import SettingsPage from './components/SettingsPage'
import OnboardingPage from './components/OnboardingPage'
import PreviewModal from './components/PreviewModal'
import type { ShelfView } from './components/ShelfBar'

type FilterType = 'all' | ClipboardItem['type']

const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Tab'])
// Holding ⌘ this long reveals the ⌘1–⌘9 badges; quick ⌘ shortcuts don't flash them.
const QUICK_KEY_REVEAL_MS = 350

function App() {
  const [history, setHistory] = useState<ClipboardItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()) // Multi-select
  const [isVisible, setIsVisible] = useState(false)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [previewItem, setPreviewItem] = useState<ClipboardItem | null>(null)
  const [panelPosition, setPanelPosition] = useState<PanelPosition>('bottom')
  const [pasteDirectly, setPasteDirectly] = useState(false)
  const [cardSize, setCardSize] = useState<CardSize>('medium')
  const [language, setLanguage] = useState<Language>('en')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [shelfView, setShelfView] = useState<ShelfView>('recent')
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>({ paused: false, pausedUntil: null })
  const [showQuickKeys, setShowQuickKeys] = useState(false)
  const quickKeyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Clock for relative timestamps ("3m"). Refreshed on open and every 30 s while
  // visible, so memoized cards don't show stale ages.
  const [now, setNow] = useState(() => Date.now())

  const t = useMemo(() => getTranslations(language), [language])

  // Check if we're in settings mode (hash routing)
  const isSettingsPage = window.location.hash === '#settings'
  const isOnboardingPage = window.location.hash === '#onboarding'

  useEffect(() => {
    if (isSettingsPage || isOnboardingPage) return // Don't load clipboard stuff for settings/onboarding pages

    const applySettings = (settings: { panelPosition?: PanelPosition; pasteDirectly?: boolean; cardSize?: CardSize; language?: Language }) => {
      setPanelPosition(settings.panelPosition || 'bottom')
      setPasteDirectly(settings.pasteDirectly ?? false)
      setCardSize(settings.cardSize || 'medium')
      setLanguage(settings.language || 'en')
    }

    // Load initial history and settings
    window.electronAPI.getHistory().then(setHistory)
    window.electronAPI.getCollections().then(setCollections)
    window.electronAPI.getCaptureStatus().then(setCaptureStatus)
    window.electronAPI.getSettings().then(applySettings)

    // Listen for updates. The main process pushes whatever changed while the
    // panel was hidden right BEFORE 'panel-shown', so opening needs no getters.
    const unsubHistory = window.electronAPI.onHistoryUpdated(setHistory)
    const unsubShown = window.electronAPI.onPanelShown(() => {
      setIsVisible(true)
      setNow(Date.now())
    })
    // Reset transient UI state on HIDE rather than on show, so the next open
    // paints an already-clean panel instead of flashing the previous query.
    const unsubHidden = window.electronAPI.onPanelHidden(() => {
      setIsVisible(false)
      setSelectedIndex(0)
      setSearchQuery('')
      setSelectedIds(prev => (prev.size === 0 ? prev : new Set()))
      setPreviewItem(null)
      setShowQuickKeys(false)
    })
    const unsubCollections = window.electronAPI.onCollectionsUpdated(setCollections)
    const unsubCaptureStatus = window.electronAPI.onCaptureStatusUpdated(setCaptureStatus)
    const unsubSettings = window.electronAPI.onSettingsUpdated(applySettings)

    return () => {
      unsubHistory()
      unsubShown()
      unsubHidden()
      unsubCollections()
      unsubCaptureStatus()
      unsubSettings()
    }
  }, [isSettingsPage, isOnboardingPage])

  const collectionNames = useMemo(() => new Map(collections.map(c => [c.id, c.name])), [collections])
  const customCollections = useMemo(
    () => collections.filter(c => !c.system && c.id !== DEFAULT_SAVED_COLLECTION_ID).sort((a, b) => a.sortOrder - b.sortOrder),
    [collections]
  )

  // If the active collection disappears (deleted elsewhere), fall back to Recent.
  useEffect(() => {
    if (shelfView === 'collection' && selectedCollectionId && !collectionNames.has(selectedCollectionId)) {
      setShelfView('recent')
      setSelectedCollectionId(null)
    }
  }, [collectionNames, selectedCollectionId, shelfView])

  // Typing stays responsive on large histories: the input updates immediately,
  // the ranking catches up in a lower-priority render. Results are ranked by
  // fuzzy relevance; the sort is stable, so equal scores keep recency order.
  const deferredQuery = useDeferredValue(searchQuery)
  const filteredHistory = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    const shelfItems = shelfView === 'saved'
      ? history.filter(isItemSaved)
      : shelfView === 'collection' && selectedCollectionId
        ? history.filter(item => item.collectionIds?.includes(selectedCollectionId))
        : history.filter(item => !isItemSaved(item))
    const base = filterType === 'all' ? shelfItems : shelfItems.filter(item => item.type === filterType)
    if (!q) return base
    const scored: { item: ClipboardItem; score: number }[] = []
    for (const item of base) {
      const itemCollections = (item.collectionIds || []).map(id => collectionNames.get(id) || '').join(' ')
      const haystack = itemCollections || item.tags?.length
        ? `${item.searchText} ${itemCollections} ${(item.tags || []).join(' ')}`.toLowerCase()
        : item.searchText
      const score = fuzzyScore(q, haystack)
      if (score > 0) scored.push({ item, score })
    }
    scored.sort((a, b) => b.score - a.score)
    return scored.map(s => s.item)
  }, [history, filterType, deferredQuery, shelfView, selectedCollectionId, collectionNames])

  // Brief flash before the window hides to confirm the action
  const flashCopied = useCallback((id: string) => {
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 500)
  }, [])

  const handlePaste = useCallback((item: ClipboardItem) => {
    flashCopied(item.id)
    window.electronAPI.pasteItem(item.id)
  }, [flashCopied])

  const handlePastePlain = useCallback((item: ClipboardItem) => {
    flashCopied(item.id)
    window.electronAPI.pastePlain(item.id)
  }, [flashCopied])

  const handleCopyOnly = useCallback((item: ClipboardItem) => {
    flashCopied(item.id)
    window.electronAPI.copyOnly(item.id)
  }, [flashCopied])

  const handleDelete = useCallback((id: string) => {
    window.electronAPI.deleteItem(id)
  }, [])

  const handleToggleSaved = useCallback((id: string) => {
    window.electronAPI.toggleSaved(id)
  }, [])

  const handlePauseCapture = useCallback((duration: PauseCaptureDuration) => {
    window.electronAPI.pauseCapture(duration)
  }, [])

  const handleResumeCapture = useCallback(() => {
    window.electronAPI.resumeCapture()
  }, [])

  const showRecent = useCallback(() => {
    setShelfView('recent')
    setSelectedCollectionId(null)
    setSelectedIndex(0)
  }, [])

  const showSaved = useCallback(() => {
    setShelfView('saved')
    setSelectedCollectionId(null)
    setSelectedIndex(0)
  }, [])

  const showCollection = useCallback((id: string) => {
    setShelfView('collection')
    setSelectedCollectionId(id)
    setSelectedIndex(0)
  }, [])

  // Tab / ⇧Tab cycle Recent → Saved → each collection, keyboard-only.
  const cycleView = useCallback((direction: 1 | -1) => {
    const views: { view: ShelfView; id: string | null }[] = [
      { view: 'recent', id: null },
      { view: 'saved', id: null },
      ...customCollections.map(c => ({ view: 'collection' as const, id: c.id }))
    ]
    const current = views.findIndex(v => v.view === shelfView && (v.view !== 'collection' || v.id === selectedCollectionId))
    const next = views[(Math.max(0, current) + direction + views.length) % views.length]
    setShelfView(next.view)
    setSelectedCollectionId(next.id)
    setSelectedIndex(0)
  }, [customCollections, shelfView, selectedCollectionId])

  const handleCreateCollection = useCallback(async (name: string) => {
    const collection = await window.electronAPI.createCollection(name)
    if (!collection) return false
    showCollection(collection.id)
    return true
  }, [showCollection])

  const handleRenameCollection = useCallback((id: string, name: string) => {
    return window.electronAPI.renameCollection(id, name)
  }, [])

  const handleDeleteCollection = useCallback(async (id: string) => {
    const collection = collections.find(item => item.id === id)
    if (!collection || collection.system) return
    // confirm() is implemented by Electron (unlike prompt()).
    if (!window.confirm(t.deleteCollectionConfirm.replace('{name}', collection.name))) return
    const deleted = await window.electronAPI.deleteCollection(collection.id)
    if (deleted && selectedCollectionId === id) showRecent()
  }, [collections, selectedCollectionId, showRecent, t])

  const handleAssignToCollection = useCallback(() => {
    if (!selectedCollectionId) return
    const ids = selectedIds.size > 0
      ? [...selectedIds]
      : filteredHistory[selectedIndex]
        ? [filteredHistory[selectedIndex].id]
        : []
    if (ids.length === 0) return
    const allAssigned = shelfView === 'collection' && ids.every(id =>
      history.find(item => item.id === id)?.collectionIds?.includes(selectedCollectionId)
    )
    if (allAssigned) {
      void Promise.all(ids.map(id => window.electronAPI.removeItemFromCollection(id, selectedCollectionId)))
    } else {
      window.electronAPI.assignItemsToCollection(ids, selectedCollectionId)
    }
    setSelectedIds(new Set())
  }, [filteredHistory, history, selectedCollectionId, selectedIds, selectedIndex, shelfView])

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Merge paste: combine selected text-like items with a blank-line separator,
  // in history order. Images are skipped (their content is a file:// URL).
  const handleMergePaste = useCallback(() => {
    const selectedItems = history.filter(item => selectedIds.has(item.id) && item.type !== 'image')
    if (selectedItems.length > 0) {
      window.electronAPI.copyText(selectedItems.map(item => item.content).join('\n\n'))
      setSelectedIds(new Set())
      window.electronAPI.hideWindow()
    }
  }, [history, selectedIds])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible) return

    if (e.key === 'Meta' && !quickKeyTimer.current) {
      quickKeyTimer.current = setTimeout(() => setShowQuickKeys(true), QUICK_KEY_REVEAL_MS)
    } else if (e.key !== 'Meta' && quickKeyTimer.current) {
      // A ⌘ shortcut is being typed — don't reveal badges mid-shortcut.
      clearTimeout(quickKeyTimer.current)
    }

    const target = e.target as HTMLElement | null
    // Menus (collection name field etc.) own their keys.
    if (target?.closest?.('[data-popover]')) return

    // While typing in the search field, let letters reach the input. Only
    // intercept navigation keys and modifier shortcuts. Space previews only
    // when the query is empty — a leading space is never a useful search.
    const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    if (typing) {
      const isModCombo = e.metaKey || e.ctrlKey
      // Cmd+A selects text in the field while typing, not multi-select.
      if (isModCombo && e.key.toLowerCase() === 'a') return
      const spaceToPreview = e.key === ' ' && searchQuery === ''
      if (!NAV_KEYS.has(e.key) && !isModCombo && !spaceToPreview) return
    }

    const selected = filteredHistory[selectedIndex]
    const mod = e.metaKey || e.ctrlKey

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(0, prev - 1))
        break
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(filteredHistory.length - 1, prev + 1))
        break
      case 'Tab':
        e.preventDefault()
        cycleView(e.shiftKey ? -1 : 1)
        break
      case 'Enter':
        e.preventDefault()
        if (selected) {
          if (e.shiftKey) handlePastePlain(selected) // always auto-paste, plain
          else if (pasteDirectly) handlePaste(selected)
          else handleCopyOnly(selected)
        }
        break
      case 'Escape':
        e.preventDefault()
        if (previewItem) setPreviewItem(null)
        else if (searchQuery) setSearchQuery('') // first Esc clears, second closes
        else window.electronAPI.hideWindow()
        break
      case ' ':
        e.preventDefault()
        if (previewItem) setPreviewItem(null)
        else if (selected) setPreviewItem(selected)
        break
      case 'Backspace':
        if (mod && selected) {
          e.preventDefault()
          handleDelete(selected.id)
        }
        break
      // Quick paste shortcuts: Cmd+1 through Cmd+9
      case '1': case '2': case '3': case '4': case '5':
      case '6': case '7': case '8': case '9':
        if (mod) {
          e.preventDefault()
          const item = filteredHistory[parseInt(e.key) - 1]
          if (item) handlePaste(item)
        }
        break
      default: {
        // Shift changes e.key to upper case ("S"), so compare lowercased.
        const key = e.key.toLowerCase()
        if (mod && key === 'c' && selected) {
          e.preventDefault()
          handleCopyOnly(selected)
        } else if (mod && key === 'm' && selectedIds.size > 0) {
          e.preventDefault()
          handleMergePaste()
        } else if (mod && key === 's' && e.shiftKey) {
          e.preventDefault()
          handleAssignToCollection()
        } else if (mod && key === 's' && selected) {
          e.preventDefault()
          handleToggleSaved(selected.id)
        } else if (mod && key === 'a' && selected) {
          e.preventDefault()
          handleToggleSelect(selected.id)
        } else if (!mod && key === 'o' && selected?.type === 'link') {
          // Bare O; guarded above so it never fires while typing a query.
          e.preventDefault()
          window.electronAPI.openExternal(selected.content)
          window.electronAPI.hideWindow()
        }
      }
    }
  }, [isVisible, selectedIndex, filteredHistory, searchQuery, handlePaste, handlePastePlain, handleCopyOnly, handleDelete, handleToggleSaved, previewItem, pasteDirectly, selectedIds, handleMergePaste, handleToggleSelect, handleAssignToCollection, cycleView])

  useEffect(() => {
    if (isSettingsPage || isOnboardingPage) return
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta') {
        if (quickKeyTimer.current) clearTimeout(quickKeyTimer.current)
        quickKeyTimer.current = null
        setShowQuickKeys(false)
      }
    }
    const onBlur = () => {
      if (quickKeyTimer.current) clearTimeout(quickKeyTimer.current)
      quickKeyTimer.current = null
      setShowQuickKeys(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [handleKeyDown, isSettingsPage, isOnboardingPage])

  useEffect(() => {
    if (!isVisible) return
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [isVisible])

  // Reset selection when the result set changes shape.
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery, filterType])

  // Keep selectedIndex in range when the filtered list shrinks (delete, etc.).
  useEffect(() => {
    setSelectedIndex(i => Math.min(i, Math.max(0, filteredHistory.length - 1)))
  }, [filteredHistory.length])

  // If the previewed item disappears from history (deleted/cleared elsewhere),
  // close the preview so it never operates on stale data.
  useEffect(() => {
    if (previewItem && !history.some(h => h.id === previewItem.id)) {
      setPreviewItem(null)
    }
  }, [history, previewItem])

  // Render settings page if hash is #settings
  if (isSettingsPage) {
    return <SettingsPage />
  }
  if (isOnboardingPage) {
    return <OnboardingPage />
  }

  return (
    <>
      <ClipboardPanel
        items={filteredHistory}
        selectedIndex={selectedIndex}
        selectedIds={selectedIds}
        searchQuery={searchQuery}
        highlightQuery={deferredQuery}
        onSearchChange={setSearchQuery}
        onSelect={setSelectedIndex}
        onToggleSelect={handleToggleSelect}
        onPaste={pasteDirectly ? handlePaste : handleCopyOnly}
        onDelete={handleDelete}
        onToggleSaved={handleToggleSaved}
        onPreview={setPreviewItem}
        shelfView={shelfView}
        collections={collections}
        selectedCollectionId={selectedCollectionId}
        onShowRecent={showRecent}
        onShowSaved={showSaved}
        onShowCollection={showCollection}
        onCreateCollection={handleCreateCollection}
        onRenameCollection={handleRenameCollection}
        onDeleteCollection={handleDeleteCollection}
        onAssignToCollection={handleAssignToCollection}
        captureStatus={captureStatus}
        onPauseCapture={handlePauseCapture}
        onResumeCapture={handleResumeCapture}
        filterType={filterType}
        onFilterChange={setFilterType}
        panelPosition={panelPosition}
        cardSize={cardSize}
        pasteDirectly={pasteDirectly}
        showQuickKeys={showQuickKeys}
        now={now}
        t={t}
      />
      {copiedId && (
        <div className="toast pointer-events-none fixed left-1/2 top-3 z-50 -translate-x-1/2 animate-fade-in">
          <Icon name="check" className="h-3.5 w-3.5 text-[var(--success)]" />
          {t.copied}
        </div>
      )}
      <PreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        t={t}
      />
    </>
  )
}

export default App

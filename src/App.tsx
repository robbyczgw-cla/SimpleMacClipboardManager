import { useState, useEffect, useCallback, useMemo } from 'react'
import { ClipboardItem, PanelPosition, CardSize } from './types'
import { getTranslations, Language } from './i18n/translations'
import { fuzzyScore } from './utils/fuzzy'
import { Icon } from './components/icons'
import ClipboardPanel from './components/ClipboardPanel'
import SettingsPage from './components/SettingsPage'
import PreviewModal from './components/PreviewModal'

type FilterType = 'all' | ClipboardItem['type']

const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'])

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

  const t = useMemo(() => getTranslations(language), [language])

  // Check if we're in settings mode (hash routing)
  const isSettingsPage = window.location.hash === '#settings'

  useEffect(() => {
    if (isSettingsPage) return // Don't load clipboard stuff for settings page

    const applySettings = (settings: { panelPosition?: PanelPosition; pasteDirectly?: boolean; cardSize?: CardSize; language?: Language }) => {
      setPanelPosition(settings.panelPosition || 'bottom')
      setPasteDirectly(settings.pasteDirectly ?? false)
      setCardSize(settings.cardSize || 'medium')
      setLanguage(settings.language || 'en')
    }

    // Load initial history and settings
    window.electronAPI.getHistory().then(setHistory)
    window.electronAPI.getSettings().then(applySettings)

    // Listen for updates
    const unsubHistory = window.electronAPI.onHistoryUpdated(setHistory)
    const unsubShown = window.electronAPI.onPanelShown(() => {
      setIsVisible(true)
      setSelectedIndex(0)
      setSearchQuery('')
      setSelectedIds(new Set()) // Clear multi-select
      // The main process only pushes history while visible, so re-sync on open.
      window.electronAPI.getHistory().then(setHistory)
      window.electronAPI.getSettings().then(applySettings)
    })
    const unsubHidden = window.electronAPI.onPanelHidden(() => {
      setIsVisible(false)
    })

    return () => {
      unsubHistory()
      unsubShown()
      unsubHidden()
    }
  }, [isSettingsPage])

  // PERFORMANCE: memoize so the filter (and the keydown callback that depends on
  // it) is only recomputed when its inputs change — not on every render/keystroke.
  // When a query is present, results are ranked by fuzzy relevance; the sort is
  // stable, so equal scores keep their recency order.
  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const base = filterType === 'all' ? history : history.filter(item => item.type === filterType)
    if (!q) return base
    const scored: { item: ClipboardItem; score: number }[] = []
    for (const item of base) {
      const score = fuzzyScore(q, item.searchText)
      if (score > 0) scored.push({ item, score })
    }
    scored.sort((a, b) => b.score - a.score)
    return scored.map(s => s.item)
  }, [history, filterType, searchQuery])

  // Brief flash before the window hides to confirm the action
  const flashCopied = useCallback((id: string) => {
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 500)
  }, [])

  const handlePaste = useCallback((item: ClipboardItem) => {
    flashCopied(item.id)
    window.electronAPI.pasteItem(item)
  }, [flashCopied])

  const handlePastePlain = useCallback((item: ClipboardItem) => {
    flashCopied(item.id)
    window.electronAPI.pastePlain(item)
  }, [flashCopied])

  const handleCopyOnly = useCallback((item: ClipboardItem) => {
    flashCopied(item.id)
    window.electronAPI.copyOnly(item)
  }, [flashCopied])

  const handleDelete = useCallback((id: string) => {
    window.electronAPI.deleteItem(id)
  }, [])

  const handleTogglePin = useCallback((id: string) => {
    window.electronAPI.togglePin(id)
  }, [])

  // Toggle item in multi-select
  const handleToggleSelect = useCallback((id: string, shiftKey: boolean) => {
    if (shiftKey) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    }
  }, [])

  // Merge paste: combine selected text-like items with a blank-line separator.
  // Images are skipped (their content is a file:// URL, meaningless as text).
  const handleMergePaste = useCallback(() => {
    const selectedItems = filteredHistory.filter(item => selectedIds.has(item.id) && item.type !== 'image')
    if (selectedItems.length > 0) {
      const merged = selectedItems.map(item => item.content).join('\n\n')
      window.electronAPI.copyText(merged)
      setSelectedIds(new Set())
      window.electronAPI.hideWindow()
    }
  }, [filteredHistory, selectedIds])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible) return

    // While typing in the search field, let bare Space and letters (incl. 'o')
    // reach the input. Only intercept navigation keys and modifier shortcuts.
    const target = e.target as HTMLElement | null
    const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    if (typing) {
      const isModCombo = e.metaKey || e.ctrlKey
      // Cmd+A selects text in the field while typing, not multi-select.
      if (isModCombo && (e.key === 'a' || e.key === 'A')) return
      if (!NAV_KEYS.has(e.key) && !isModCombo) return
    }

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
      case 'Enter':
        e.preventDefault()
        if (filteredHistory[selectedIndex]) {
          if (e.shiftKey) {
            // Shift+Enter = paste as plain text (always auto-paste)
            handlePastePlain(filteredHistory[selectedIndex])
          } else {
            // Enter respects pasteDirectly setting
            if (pasteDirectly) {
              handlePaste(filteredHistory[selectedIndex])
            } else {
              handleCopyOnly(filteredHistory[selectedIndex])
            }
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        if (previewItem) {
          setPreviewItem(null)
        } else {
          window.electronAPI.hideWindow()
        }
        break
      case ' ':
        e.preventDefault()
        if (previewItem) {
          setPreviewItem(null)
        } else if (filteredHistory[selectedIndex]) {
          setPreviewItem(filteredHistory[selectedIndex])
        }
        break
      case 'Backspace':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault()
          if (filteredHistory[selectedIndex]) {
            handleDelete(filteredHistory[selectedIndex].id)
          }
        }
        break
      // Quick paste shortcuts: Cmd+1 through Cmd+9
      case '1': case '2': case '3': case '4': case '5':
      case '6': case '7': case '8': case '9':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault()
          const index = parseInt(e.key) - 1
          if (filteredHistory[index]) {
            handlePaste(filteredHistory[index])
          }
        }
        break
      // Cmd+C = Copy only (no auto-paste)
      case 'c':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault()
          if (filteredHistory[selectedIndex]) {
            handleCopyOnly(filteredHistory[selectedIndex])
          }
        }
        break
      // Cmd+M = Merge paste selected items
      case 'm':
        if ((e.metaKey || e.ctrlKey) && selectedIds.size > 0) {
          e.preventDefault()
          handleMergePaste()
        }
        break
      // Cmd+A = Toggle current item in multi-select (when not typing in search)
      case 'a':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault()
          if (filteredHistory[selectedIndex]) {
            handleToggleSelect(filteredHistory[selectedIndex].id, true)
          }
        }
        break
      // O = Open link in browser (bare key; guarded above so it never fires while typing)
      case 'o':
        if (filteredHistory[selectedIndex]?.type === 'link') {
          e.preventDefault()
          window.electronAPI.openExternal(filteredHistory[selectedIndex].content)
          window.electronAPI.hideWindow()
        }
        break
    }
  }, [isVisible, selectedIndex, filteredHistory, handlePaste, handlePastePlain, handleCopyOnly, handleDelete, previewItem, pasteDirectly, selectedIds, handleMergePaste, handleToggleSelect])

  useEffect(() => {
    if (isSettingsPage) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, isSettingsPage])

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

  return (
    <>
      <ClipboardPanel
        items={filteredHistory}
        selectedIndex={selectedIndex}
        selectedIds={selectedIds}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelect={setSelectedIndex}
        onToggleSelect={handleToggleSelect}
        onPaste={pasteDirectly ? handlePaste : handleCopyOnly}
        onDelete={handleDelete}
        onTogglePin={handleTogglePin}
        onPreview={setPreviewItem}
        filterType={filterType}
        onFilterChange={setFilterType}
        panelPosition={panelPosition}
        cardSize={cardSize}
        t={t}
      />
      {copiedId && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass border border-[var(--border-strong)] text-[var(--text-primary)] text-sm font-medium shadow-lg animate-fade-in pointer-events-none">
          <Icon name="check" className="w-4 h-4 text-[var(--success)]" />
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

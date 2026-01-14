import { useState, useEffect, useCallback } from 'react'
import { ClipboardItem, PanelPosition } from './types'
import ClipboardPanel from './components/ClipboardPanel'
import SettingsPage from './components/SettingsPage'
import PreviewModal from './components/PreviewModal'

type FilterType = 'all' | ClipboardItem['type']

function App() {
  const [history, setHistory] = useState<ClipboardItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [previewItem, setPreviewItem] = useState<ClipboardItem | null>(null)
  const [panelPosition, setPanelPosition] = useState<PanelPosition>('bottom')

  // Check if we're in settings mode (hash routing)
  const isSettingsPage = window.location.hash === '#settings'

  useEffect(() => {
    if (isSettingsPage) return // Don't load clipboard stuff for settings page

    // Load initial history and settings
    window.electronAPI.getHistory().then(setHistory)
    window.electronAPI.getSettings().then(settings => {
      setPanelPosition(settings.panelPosition || 'bottom')
    })

    // Listen for updates
    const unsubHistory = window.electronAPI.onHistoryUpdated(setHistory)
    const unsubShown = window.electronAPI.onPanelShown(() => {
      setIsVisible(true)
      setSelectedIndex(0)
      setSearchQuery('')
      // Reload settings in case they changed
      window.electronAPI.getSettings().then(settings => {
        setPanelPosition(settings.panelPosition || 'bottom')
      })
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

  const filteredHistory = history.filter(item => {
    // Filter by type
    if (filterType !== 'all' && item.type !== filterType) return false
    // Filter by search query
    if (searchQuery && !item.searchText.includes(searchQuery.toLowerCase())) return false
    return true
  })

  const handlePaste = useCallback((item: ClipboardItem) => {
    window.electronAPI.pasteItem(item)
  }, [])

  const handlePastePlain = useCallback((item: ClipboardItem) => {
    window.electronAPI.pastePlain(item)
  }, [])

  const handleDelete = useCallback((id: string) => {
    window.electronAPI.deleteItem(id)
  }, [])

  const handleTogglePin = useCallback((id: string) => {
    window.electronAPI.togglePin(id)
  }, [])

  const isVertical = panelPosition === 'left' || panelPosition === 'right'

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible) return

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
            // Shift+Enter = paste as plain text
            handlePastePlain(filteredHistory[selectedIndex])
          } else {
            handlePaste(filteredHistory[selectedIndex])
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
    }
  }, [isVisible, selectedIndex, filteredHistory, handlePaste, handlePastePlain, handleDelete, previewItem, isVertical])

  useEffect(() => {
    if (isSettingsPage) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, isSettingsPage])

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  // Render settings page if hash is #settings
  if (isSettingsPage) {
    return <SettingsPage />
  }

  return (
    <>
      <ClipboardPanel
        items={filteredHistory}
        selectedIndex={selectedIndex}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelect={setSelectedIndex}
        onPaste={handlePaste}
        onDelete={handleDelete}
        onTogglePin={handleTogglePin}
        filterType={filterType}
        onFilterChange={setFilterType}
        panelPosition={panelPosition}
      />
      <PreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </>
  )
}

export default App

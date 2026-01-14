import { useState, useEffect, useCallback } from 'react'
import { ClipboardItem } from './types'
import ClipboardPanel from './components/ClipboardPanel'
import SettingsPage from './components/SettingsPage'

function App() {
  const [history, setHistory] = useState<ClipboardItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  // Check if we're in settings mode (hash routing)
  const isSettingsPage = window.location.hash === '#settings'

  useEffect(() => {
    if (isSettingsPage) return // Don't load clipboard stuff for settings page

    // Load initial history
    window.electronAPI.getHistory().then(setHistory)

    // Listen for updates
    const unsubHistory = window.electronAPI.onHistoryUpdated(setHistory)
    const unsubShown = window.electronAPI.onPanelShown(() => {
      setIsVisible(true)
      setSelectedIndex(0)
      setSearchQuery('')
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

  const filteredHistory = searchQuery
    ? history.filter(item =>
        item.searchText.includes(searchQuery.toLowerCase())
      )
    : history

  const handlePaste = useCallback((item: ClipboardItem) => {
    window.electronAPI.pasteItem(item)
  }, [])

  const handleDelete = useCallback((id: string) => {
    window.electronAPI.deleteItem(id)
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible) return

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(0, prev - 1))
        break
      case 'ArrowRight':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(filteredHistory.length - 1, prev + 1))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredHistory[selectedIndex]) {
          handlePaste(filteredHistory[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        window.electronAPI.hideWindow()
        break
      case 'Backspace':
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault()
          if (filteredHistory[selectedIndex]) {
            handleDelete(filteredHistory[selectedIndex].id)
          }
        }
        break
    }
  }, [isVisible, selectedIndex, filteredHistory, handlePaste, handleDelete])

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
    <ClipboardPanel
      items={filteredHistory}
      selectedIndex={selectedIndex}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSelect={setSelectedIndex}
      onPaste={handlePaste}
      onDelete={handleDelete}
    />
  )
}

export default App

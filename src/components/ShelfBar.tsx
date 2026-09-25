import { useCallback, useState } from 'react'
import type { CaptureStatus, Collection, PauseCaptureDuration } from '../types'
import type { Translations } from '../i18n/translations'
import { DEFAULT_SAVED_COLLECTION_ID } from '../../common/migrations'
import Popover, { MenuItem } from './Popover'
import { Icon } from './icons'

export type ShelfView = 'recent' | 'saved' | 'collection'

interface ShelfBarProps {
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
  isVertical: boolean
  t: Translations
}

function formatClock(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Inline name field used for both "new" and "rename" — Electron does not
// implement window.prompt(), so the old prompt-based flow silently did nothing.
function NameField({
  initial,
  placeholder,
  submitLabel,
  cancelLabel,
  onSubmit,
  onCancel
}: {
  initial: string
  placeholder: string
  submitLabel: string
  cancelLabel: string
  onSubmit: (name: string) => Promise<boolean>
  onCancel: () => void
}) {
  const [value, setValue] = useState(initial)
  const [invalid, setInvalid] = useState(false)

  const submit = async () => {
    const name = value.trim()
    if (!name) return
    const ok = await onSubmit(name)
    setInvalid(!ok)
  }

  return (
    <div className="flex items-center gap-1.5 px-1.5 py-1">
      <input
        autoFocus
        value={value}
        placeholder={placeholder}
        maxLength={120}
        aria-invalid={invalid}
        onChange={e => {
          setValue(e.target.value)
          setInvalid(false)
        }}
        onKeyDown={e => {
          // Keep Enter/arrows from reaching the panel's paste/navigation keys.
          e.stopPropagation()
          if (e.key === 'Enter') void submit()
          if (e.key === 'Escape') onCancel()
        }}
        className={`field h-7 min-w-0 flex-1 px-2 text-xs ${invalid ? 'field-invalid' : ''}`}
      />
      <button type="button" onClick={() => void submit()} className="chip chip-accent h-7 px-2.5 text-xs">
        {submitLabel}
      </button>
      <button type="button" onClick={onCancel} className="chip h-7 w-7 justify-center" aria-label={cancelLabel} title={cancelLabel}>
        <Icon name="close" className="h-3 w-3" />
      </button>
    </div>
  )
}

export default function ShelfBar({
  shelfView,
  collections,
  selectedCollectionId,
  onShowRecent,
  onShowSaved,
  onShowCollection,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onAssignToCollection,
  captureStatus,
  onPauseCapture,
  onResumeCapture,
  isVertical,
  t
}: ShelfBarProps) {
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [pauseOpen, setPauseOpen] = useState(false)
  const [editing, setEditing] = useState<{ mode: 'new' } | { mode: 'rename'; id: string } | null>(null)

  const customCollections = collections
    .filter(collection => !collection.system && collection.id !== DEFAULT_SAVED_COLLECTION_ID)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const activeCollection = shelfView === 'collection'
    ? customCollections.find(collection => collection.id === selectedCollectionId)
    : undefined

  const closeCollections = useCallback(() => {
    setCollectionsOpen(false)
    setEditing(null)
  }, [])
  const closePause = useCallback(() => setPauseOpen(false), [])

  const segment = (active: boolean) => `segment ${active ? 'segment-active' : ''}`

  return (
    <div className="flex items-center gap-2">
      <div className="segmented" role="tablist" aria-label={t.switchView}>
        <button type="button" role="tab" aria-selected={shelfView === 'recent'} className={segment(shelfView === 'recent')} onClick={onShowRecent}>
          {t.recent}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={shelfView === 'saved'}
          aria-label={t.saved}
          title={t.saved}
          className={segment(shelfView === 'saved')}
          onClick={onShowSaved}
        >
          <Icon name="star" filled={shelfView === 'saved'} className="h-3 w-3" />
          {!isVertical && t.saved}
        </button>
        <div className="relative">
          <button
            type="button"
            role="tab"
            aria-selected={shelfView === 'collection'}
            aria-haspopup="menu"
            aria-expanded={collectionsOpen}
            className={`${segment(shelfView === 'collection')} ${isVertical ? 'max-w-[140px]' : 'max-w-[180px]'}`}
            onClick={() => setCollectionsOpen(open => !open)}
          >
            <Icon name="stack" className="h-3 w-3 shrink-0" />
            <span className="truncate">{activeCollection?.name ?? t.collections}</span>
            <Icon name="chevron" className="h-3 w-3 shrink-0 opacity-70" />
          </button>
          <Popover open={collectionsOpen} onClose={closeCollections}>
            <div className="max-h-[180px] overflow-y-auto">
              {customCollections.length === 0 && editing?.mode !== 'new' && (
                <p className="px-2.5 py-1.5 text-xs text-[var(--text-tertiary)]">{t.noCollections}</p>
              )}
              {customCollections.map(collection =>
                editing?.mode === 'rename' && editing.id === collection.id ? (
                  <NameField
                    key={collection.id}
                    initial={collection.name}
                    placeholder={t.collectionNamePlaceholder}
                    submitLabel={t.save}
                    cancelLabel={t.cancel}
                    onSubmit={async name => {
                      const ok = await onRenameCollection(collection.id, name)
                      if (ok) setEditing(null)
                      return ok
                    }}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <MenuItem
                    key={collection.id}
                    active={activeCollection?.id === collection.id}
                    onClick={() => {
                      onShowCollection(collection.id)
                      closeCollections()
                    }}
                    trailing={
                      <span className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/item:opacity-100">
                        <span
                          role="button"
                          tabIndex={-1}
                          className="icon-btn"
                          aria-label={t.renameCollection}
                          title={t.renameCollection}
                          onClick={e => {
                            e.stopPropagation()
                            setEditing({ mode: 'rename', id: collection.id })
                          }}
                        >
                          <Icon name="pencil" className="h-3 w-3" />
                        </span>
                        <span
                          role="button"
                          tabIndex={-1}
                          className="icon-btn hover:!text-[var(--danger)]"
                          aria-label={t.deleteCollection}
                          title={t.deleteCollection}
                          onClick={e => {
                            e.stopPropagation()
                            onDeleteCollection(collection.id)
                          }}
                        >
                          <Icon name="trash" className="h-3 w-3" />
                        </span>
                      </span>
                    }
                  >
                    {collection.name}
                  </MenuItem>
                )
              )}
            </div>
            <div className="menu-separator" />
            {editing?.mode === 'new' ? (
              <NameField
                initial=""
                placeholder={t.collectionNamePlaceholder}
                submitLabel={t.create}
                cancelLabel={t.cancel}
                onSubmit={async name => {
                  const ok = await onCreateCollection(name)
                  if (ok) closeCollections()
                  return ok
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <MenuItem onClick={() => setEditing({ mode: 'new' })} trailing={<Icon name="plus" className="h-3.5 w-3.5 opacity-70" />}>
                {t.newCollection}
              </MenuItem>
            )}
            {activeCollection && (
              <MenuItem
                onClick={() => {
                  onAssignToCollection()
                  closeCollections()
                }}
                trailing={<kbd className="kbd">⌘⇧S</kbd>}
              >
                {t.addToCollection}
              </MenuItem>
            )}
          </Popover>
        </div>
      </div>

      <div className="relative ml-auto">
        {captureStatus.paused ? (
          <button type="button" onClick={onResumeCapture} className="chip chip-warning h-7 px-2.5 text-xs" title={t.resumeCapture}>
            <Icon name="play" className="h-3 w-3" />
            {captureStatus.pausedUntil ? t.pausedUntil.replace('{time}', formatClock(captureStatus.pausedUntil)) : t.capturePaused}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPauseOpen(open => !open)}
              className="chip h-7 px-2.5 text-xs"
              aria-haspopup="menu"
              aria-expanded={pauseOpen}
              title={t.pauseCapture}
            >
              <Icon name="pause" className="h-3 w-3" />
              {!isVertical && t.pause}
            </button>
            <Popover open={pauseOpen} onClose={closePause} align="right" className="min-w-[180px]">
              <MenuItem onClick={() => { onPauseCapture(5); closePause() }}>{t.pauseFor5Minutes}</MenuItem>
              <MenuItem onClick={() => { onPauseCapture(30); closePause() }}>{t.pauseFor30Minutes}</MenuItem>
              <MenuItem onClick={() => { onPauseCapture('indefinite'); closePause() }}>{t.pauseIndefinitely}</MenuItem>
            </Popover>
          </>
        )}
      </div>
    </div>
  )
}

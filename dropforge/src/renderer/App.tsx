import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ACTION_DEFINITIONS,
  BUILTIN_RECIPES,
  detectKind
} from '../shared/actions'
import { IMAGE_ACTION_DEFINITIONS } from '../shared/image-actions'
import type {
  ActionId,
  ImageActionId,
  TransformResult,
  WorkspaceImageItem,
  WorkspaceMetadata,
  WorkspaceOutput,
  WorkspaceResult
} from '../shared/types'

type Mode = 'text' | 'images'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function App() {
  const [mode, setMode] = useState<Mode>('text')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [workspace, setWorkspace] = useState<WorkspaceMetadata | null>(null)
  const [selectedItemId, setSelectedItemId] = useState('')
  const [selectedOutputId, setSelectedOutputId] = useState('')
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const kind = useMemo(() => detectKind(input), [input])
  const actions = useMemo(
    () => ACTION_DEFINITIONS.filter((action) => action.supportedKinds.includes(kind)),
    [kind]
  )
  const recipes = useMemo(
    () => BUILTIN_RECIPES.filter((recipe) => recipe.supportedKinds.includes(kind)),
    [kind]
  )

  const selectedItem = useMemo(
    () => workspace?.items.find((item) => item.id === selectedItemId) ?? workspace?.items.at(-1),
    [selectedItemId, workspace]
  )
  const itemOutputs = useMemo(
    () => workspace?.outputs.filter((candidate) => candidate.sourceItemId === selectedItem?.id) ?? [],
    [selectedItem?.id, workspace]
  )
  const selectedImageOutput = useMemo(
    () =>
      itemOutputs.find((candidate) => candidate.id === selectedOutputId) ?? itemOutputs.at(-1),
    [itemOutputs, selectedOutputId]
  )

  const useWorkspace = (nextWorkspace: WorkspaceMetadata): void => {
    setWorkspace(nextWorkspace)
    const lastItem = nextWorkspace.items.at(-1)
    if (lastItem) {
      setSelectedItemId((current) =>
        nextWorkspace.items.some((candidate) => candidate.id === current) ? current : lastItem.id
      )
    } else {
      setSelectedItemId('')
      setSelectedOutputId('')
    }
  }

  const applyWorkspaceResult = (result: WorkspaceResult): boolean => {
    if (!result.ok || !result.workspace) {
      setError(result.error ?? 'Workspace operation failed.')
      return false
    }
    useWorkspace(result.workspace)
    setError('')
    return true
  }

  useEffect(() => {
    void window.dropforge.getWorkspace().then((result) => {
      if (applyWorkspaceResult(result) && result.workspace?.items.length) setMode('images')
    })
    return window.dropforge.onWorkspaceUpdated((nextWorkspace) => {
      useWorkspace(nextWorkspace)
      setMode('images')
      setInput('')
      setOutput('')
      setError('')
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const modifier = event.metaKey || event.ctrlKey

      if (event.key === 'Escape') {
        event.preventDefault()
        void window.dropforge.hide()
      }

      if (modifier && event.key.toLowerCase() === 'k' && mode === 'text') {
        event.preventDefault()
        inputRef.current?.focus()
      }

      if (modifier && event.key.toLowerCase() === 'v' && document.activeElement !== inputRef.current) {
        event.preventDefault()
        void importClipboard()
      }

      if (modifier && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        void createWorkspace()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode])

  const applyTextResult = (result: TransformResult): void => {
    if (result.ok && result.output !== undefined) {
      setOutput(result.output)
      setError('')
    } else {
      setOutput('')
      setError(result.error ?? 'Transformation failed.')
    }
  }

  const runAction = async (actionId: ActionId): Promise<void> => {
    if (!input) return
    setIsProcessing(true)
    setCopied(false)
    applyTextResult(await window.dropforge.transform({ actionId, input }))
    setIsProcessing(false)
  }

  const runRecipe = async (recipeId: string): Promise<void> => {
    if (!input) return
    setIsProcessing(true)
    setCopied(false)
    applyTextResult(await window.dropforge.runRecipe({ recipeId, input }))
    setIsProcessing(false)
  }

  const runImageAction = async (actionId: ImageActionId): Promise<void> => {
    if (!selectedItem) return
    setIsProcessing(true)
    setCopied(false)
    const result = await window.dropforge.transformImage({ itemId: selectedItem.id, actionId })
    if (result.ok && result.workspace && result.output) {
      useWorkspace(result.workspace)
      setSelectedOutputId(result.output.id)
      setError('')
    } else {
      setError(result.error ?? 'Image transformation failed.')
    }
    setIsProcessing(false)
  }

  const importClipboard = async (): Promise<void> => {
    const imageResult = await window.dropforge.importClipboardImage()
    if (imageResult.ok && imageResult.workspace) {
      useWorkspace(imageResult.workspace)
      setSelectedItemId(imageResult.workspace.items.at(-1)?.id ?? '')
      setMode('images')
      setInput('')
      setOutput('')
      setError('')
      return
    }

    const payload = await window.dropforge.readClipboard()
    if (payload.kind === 'empty') {
      setError('The clipboard does not contain text or an image yet.')
      return
    }

    setMode('text')
    setInput(payload.value)
    setOutput('')
    setError('')
  }

  const createWorkspace = async (): Promise<void> => {
    const result = await window.dropforge.newWorkspace()
    if (!applyWorkspaceResult(result)) return
    setInput('')
    setOutput('')
    setMode('text')
    inputRef.current?.focus()
  }

  const copyOutput = async (): Promise<void> => {
    if (!output) return
    const success = await window.dropforge.copyText(output)
    setCopied(success)
    window.setTimeout(() => setCopied(false), 1200)
  }

  const copyImagePath = async (imageOutput: WorkspaceOutput): Promise<void> => {
    const success = await window.dropforge.copyOutputPath(imageOutput.id)
    setCopied(success)
    window.setTimeout(() => setCopied(false), 1200)
  }

  const importImageFiles = async (files: File[]): Promise<void> => {
    const paths = files.map((file) => window.dropforge.getPathForFile(file)).filter(Boolean)
    if (paths.length !== files.length) {
      setError('DropForge could not resolve one or more Finder file paths.')
      return
    }

    setIsProcessing(true)
    const result = await window.dropforge.importImagePaths(paths)
    if (applyWorkspaceResult(result) && result.workspace) {
      setSelectedItemId(result.workspace.items.at(-1)?.id ?? '')
      setMode('images')
      setInput('')
      setOutput('')
    }
    setIsProcessing(false)
  }

  const handleDrop = async (event: React.DragEvent<HTMLElement>): Promise<void> => {
    event.preventDefault()
    const files = [...event.dataTransfer.files]
    if (!files.length) return

    const imageFiles = files.filter(
      (file) =>
        file.type.startsWith('image/') || /\.(avif|gif|heic|heif|jpe?g|png|tiff?|webp)$/i.test(file.name)
    )
    if (imageFiles.length) {
      await importImageFiles(imageFiles)
      return
    }

    const [file] = files
    const looksTextual =
      file.type.startsWith('text/') || /\.(txt|md|json|csv|xml|yaml|yml)$/i.test(file.name)
    if (!looksTextual) {
      setError('This slice supports images and text-like files.')
      return
    }

    setMode('text')
    setInput(await file.text())
    setOutput('')
    setError('')
  }

  const renderImageItem = (item: WorkspaceImageItem) => (
    <button
      className={`image-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
      key={item.id}
      onClick={() => {
        setSelectedItemId(item.id)
        setSelectedOutputId('')
      }}
    >
      <div className="image-thumb">
        {item.previewDataUrl ? <img src={item.previewDataUrl} alt="" /> : <span>◇</span>}
      </div>
      <strong title={item.sourceName}>{item.sourceName}</strong>
      <small>
        {item.width} × {item.height} · {formatBytes(item.sizeBytes)}
      </small>
    </button>
  )

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">LOCAL TRANSFORMATION WORKBENCH</div>
          <h1>DropForge</h1>
        </div>
        <div className="topbar-actions">
          <span className="workspace-pill">
            {workspace ? `${workspace.items.length} images` : 'Loading workspace'}
          </span>
          <span className="privacy-pill">● Local only</span>
          <button className="ghost-button" onClick={() => void window.dropforge.showWorkspaceFolder()}>
            Folder
          </button>
          <button className="ghost-button" onClick={() => void createWorkspace()}>
            New
          </button>
        </div>
      </header>

      <div className="mode-switch" role="tablist" aria-label="Input type">
        <button className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>
          Text & URL
        </button>
        <button className={mode === 'images' ? 'active' : ''} onClick={() => setMode('images')}>
          Images {workspace?.items.length ? `(${workspace.items.length})` : ''}
        </button>
      </div>

      <section
        className={`drop-zone ${mode === 'images' ? 'image-drop-zone' : ''}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => void handleDrop(event)}
      >
        <div className="drop-zone-heading">
          <div>
            <span className={`kind-badge kind-${mode === 'images' ? 'image' : kind}`}>
              {mode === 'images' ? 'image' : kind}
            </span>
            <strong>
              {mode === 'images' ? 'Drop product images from Finder' : 'Paste text or drop a text file'}
            </strong>
          </div>
          <button className="secondary-button" onClick={() => void importClipboard()}>
            Paste clipboard
          </button>
        </div>

        {mode === 'text' ? (
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              setOutput('')
              setError('')
            }}
            spellCheck={false}
            autoFocus
            placeholder="Drop files here or press ⌘V"
            aria-label="DropForge input"
          />
        ) : workspace?.items.length ? (
          <div className="image-strip">{workspace.items.map(renderImageItem)}</div>
        ) : (
          <div className="image-empty">
            <span>▧</span>
            <strong>Drop JPEG, PNG, WebP, HEIF, TIFF, GIF, or AVIF images here.</strong>
            <small>DropForge copies them into its managed workspace. Originals stay untouched.</small>
          </div>
        )}

        <div className="hint-row">
          <span>⌘V imports clipboard</span>
          <span>⌘N creates workspace</span>
          <span>⌥⌘Space toggles DropForge</span>
          <span>Esc hides</span>
        </div>
      </section>

      <div className="workspace-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="section-number">01</span>
              <h2>{mode === 'images' ? 'Image Actions' : 'Actions'}</h2>
            </div>
            <span>
              {mode === 'images' ? IMAGE_ACTION_DEFINITIONS.length : `${actions.length} compatible`}
            </span>
          </div>

          <div className="action-grid">
            {mode === 'images'
              ? IMAGE_ACTION_DEFINITIONS.map((action) => (
                  <button
                    className={`action-card ${action.id === 'shop-image' ? 'featured' : ''}`}
                    disabled={!selectedItem || isProcessing}
                    key={action.id}
                    onClick={() => void runImageAction(action.id)}
                  >
                    <strong>{action.label}</strong>
                    <span>{action.description}</span>
                  </button>
                ))
              : actions.map((action) => (
                  <button
                    className="action-card"
                    disabled={!input || isProcessing}
                    key={action.id}
                    onClick={() => void runAction(action.id)}
                  >
                    <strong>{action.label}</strong>
                    <span>{action.description}</span>
                  </button>
                ))}
          </div>

          {mode === 'text' && recipes.length > 0 && (
            <>
              <div className="subheading">Recipes</div>
              <div className="recipe-list">
                {recipes.map((recipe) => (
                  <button
                    className="recipe-card"
                    disabled={!input || isProcessing}
                    key={recipe.id}
                    onClick={() => void runRecipe(recipe.id)}
                  >
                    <span className="recipe-icon">↯</span>
                    <span>
                      <strong>{recipe.label}</strong>
                      <small>{recipe.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {mode === 'images' && selectedItem && itemOutputs.length > 0 && (
            <>
              <div className="subheading">Outputs for {selectedItem.sourceName}</div>
              <div className="output-chip-list">
                {itemOutputs.map((candidate) => (
                  <button
                    className={selectedImageOutput?.id === candidate.id ? 'active' : ''}
                    key={candidate.id}
                    onClick={() => setSelectedOutputId(candidate.id)}
                  >
                    {candidate.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="panel output-panel">
          <div className="section-heading">
            <div>
              <span className="section-number">02</span>
              <h2>Output</h2>
            </div>
            {isProcessing && <span className="processing">Forging…</span>}
          </div>

          {error ? (
            <div className="error-state">{error}</div>
          ) : mode === 'images' && selectedImageOutput ? (
            <ImageOutput
              item={selectedItem!}
              output={selectedImageOutput}
              copied={copied}
              onCopyPath={() => void copyImagePath(selectedImageOutput)}
            />
          ) : mode === 'text' && output ? (
            <>
              <pre>{output}</pre>
              <div className="output-actions">
                <span>{output.length.toLocaleString()} characters</span>
                <button className="primary-button" onClick={() => void copyOutput()}>
                  {copied ? 'Copied ✓' : 'Copy result'}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-output">
              <span>◇</span>
              <strong>Your transformed result appears here.</strong>
              <p>Original content is never modified.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function ImageOutput({
  item,
  output,
  copied,
  onCopyPath
}: {
  item: WorkspaceImageItem
  output: WorkspaceOutput
  copied: boolean
  onCopyPath: () => void
}) {
  const reduction = item.sizeBytes
    ? Math.round(((item.sizeBytes - output.sizeBytes) / item.sizeBytes) * 100)
    : 0

  return (
    <div className="image-output">
      <div className="image-output-preview">
        {output.previewDataUrl ? <img src={output.previewDataUrl} alt="" /> : <span>◇</span>}
      </div>
      <div className="image-output-name" title={output.name}>
        {output.name}
      </div>
      <div className="image-output-stats">
        <span>{output.format.toUpperCase()}</span>
        <span>
          {output.width} × {output.height}
        </span>
        <span>{formatBytes(output.sizeBytes)}</span>
        {reduction > 0 && <span className="saving">−{reduction}%</span>}
      </div>
      <div className="image-output-buttons">
        <button onClick={() => void window.dropforge.openOutput(output.id)}>Open</button>
        <button onClick={() => void window.dropforge.revealOutput(output.id)}>Reveal</button>
        <button className="primary-button" onClick={onCopyPath}>
          {copied ? 'Path copied ✓' : 'Copy path'}
        </button>
      </div>
    </div>
  )
}

export default App

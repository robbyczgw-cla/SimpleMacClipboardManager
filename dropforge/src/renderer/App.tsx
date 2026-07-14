import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ACTION_DEFINITIONS,
  BUILTIN_RECIPES,
  detectKind
} from '../shared/actions'
import type { ActionId, TransformResult } from '../shared/types'

function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
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

  const resetWorkspace = (): void => {
    setInput('')
    setOutput('')
    setError('')
    setCopied(false)
    inputRef.current?.focus()
  }

  useEffect(() => window.dropforge.onNewWorkspace(resetWorkspace), [])

  const importClipboard = async (): Promise<void> => {
    const payload = await window.dropforge.readClipboard()
    if (payload.kind === 'empty') {
      setError('The clipboard does not contain text yet.')
      return
    }

    setInput(payload.value)
    setOutput('')
    setError('')
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const modifier = event.metaKey || event.ctrlKey

      if (event.key === 'Escape') {
        event.preventDefault()
        void window.dropforge.hide()
      }

      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }

      if (
        modifier &&
        event.key.toLowerCase() === 'v' &&
        document.activeElement !== inputRef.current
      ) {
        event.preventDefault()
        void importClipboard()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const applyResult = (result: TransformResult): void => {
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
    applyResult(await window.dropforge.transform({ actionId, input }))
    setIsProcessing(false)
  }

  const runRecipe = async (recipeId: string): Promise<void> => {
    if (!input) return
    setIsProcessing(true)
    setCopied(false)
    applyResult(await window.dropforge.runRecipe({ recipeId, input }))
    setIsProcessing(false)
  }

  const copyOutput = async (): Promise<void> => {
    if (!output) return
    const success = await window.dropforge.copyText(output)
    setCopied(success)
    window.setTimeout(() => setCopied(false), 1200)
  }

  const handleDrop = async (event: React.DragEvent<HTMLElement>): Promise<void> => {
    event.preventDefault()
    const [file] = [...event.dataTransfer.files]
    if (!file) return

    const looksTextual =
      file.type.startsWith('text/') || /\.(txt|md|json|csv|xml|yaml|yml)$/i.test(file.name)

    if (!looksTextual) {
      setError('Image and binary-file transformations arrive in the next DropForge slice.')
      return
    }

    setInput(await file.text())
    setOutput('')
    setError('')
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">LOCAL TRANSFORMATION WORKBENCH</div>
          <h1>DropForge</h1>
        </div>
        <div className="topbar-actions">
          <span className="privacy-pill">● Local only</span>
          <button className="ghost-button" onClick={resetWorkspace}>
            New
          </button>
        </div>
      </header>

      <section
        className="drop-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => void handleDrop(event)}
      >
        <div className="drop-zone-heading">
          <div>
            <span className={`kind-badge kind-${kind}`}>{kind}</span>
            <strong>Paste text or drop a text file</strong>
          </div>
          <button className="secondary-button" onClick={() => void importClipboard()}>
            Paste clipboard
          </button>
        </div>

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
        <div className="hint-row">
          <span>⌘K focuses input</span>
          <span>⌥⌘Space toggles DropForge</span>
          <span>Esc hides</span>
        </div>
      </section>

      <div className="workspace-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="section-number">01</span>
              <h2>Actions</h2>
            </div>
            <span>{actions.length} compatible</span>
          </div>

          <div className="action-grid">
            {actions.map((action) => (
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

          {recipes.length > 0 && (
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
          ) : output ? (
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

export default App

import { Component, ErrorInfo, ReactNode } from 'react'
import { getTranslations, Language } from '../i18n/translations'
import { Icon } from './icons'

interface Props {
  children: ReactNode
  language?: Language
}

interface State {
  hasError: boolean
}

// Without this, any render throw (e.g. malformed clipboard/imported content) blanks
// the frameless transparent window with no way to recover but restarting the app.
// The boundary shows a minimal, dismissible fallback instead.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Renderer error caught by ErrorBoundary:', error, info.componentStack)
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKey)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKey)
  }

  handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.state.hasError) {
      this.setState({ hasError: false })
      window.electronAPI?.hideWindow?.()
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    const t = getTranslations(this.props.language || 'en')
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 text-center p-8">
        <div className="glass rounded-2xl px-8 py-6 flex flex-col items-center gap-3 max-w-sm">
          <Icon name="clipboard" className="w-10 h-10 text-[var(--text-tertiary)]" />
          <p className="text-[var(--text-primary)] font-medium">{t.somethingWrong}</p>
          <p className="text-sm text-[var(--text-secondary)]">{t.errorHint}</p>
        </div>
      </div>
    )
  }
}

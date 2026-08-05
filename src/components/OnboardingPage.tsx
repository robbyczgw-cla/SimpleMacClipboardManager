import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Settings } from '../types'
import { defaultSettings } from '../../common/defaults'
import { getTranslations } from '../i18n/translations'

function eventToAccelerator(event: KeyboardEvent): string | null {
  const modifiers: string[] = []
  if (event.metaKey) modifiers.push('Command')
  if (event.ctrlKey) modifiers.push('Control')
  if (event.altKey) modifiers.push('Option')
  if (event.shiftKey) modifiers.push('Shift')
  const code = event.code
  const key = code === 'Space' ? 'Space'
    : /^Key[A-Z]$/.test(code) ? code.slice(3)
      : /^Digit\d$/.test(code) ? code.slice(5)
        : /^F\d{1,2}$/.test(code) ? code
          : ''
  return key && modifiers.length > 0 ? [...modifiers, key].join('+') : null
}

function formatAccelerator(accelerator: string): string {
  return accelerator.split('+').map(part => ({
    Command: '⌘', Control: '⌃', Option: '⌥', Shift: '⇧'
  }[part] || part)).join('')
}

export default function OnboardingPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [step, setStep] = useState(0)
  const [recording, setRecording] = useState(false)
  const [testCopied, setTestCopied] = useState(false)
  const t = useMemo(() => getTranslations(settings.language), [settings.language])

  useEffect(() => {
    window.electronAPI.getSettings().then(setSettings)
  }, [])

  const saveSettings = useCallback((next: Settings) => {
    setSettings(next)
    void window.electronAPI.saveSettings(next)
  }, [])

  const finish = useCallback(() => {
    saveSettings({ ...settings, onboardingCompleted: true })
    window.electronAPI.closeSettings()
  }, [saveSettings, settings])

  useEffect(() => {
    if (!recording) return
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') {
        setRecording(false)
        return
      }
      const accelerator = eventToAccelerator(event)
      if (accelerator) {
        saveSettings({ ...settings, hotkey: accelerator })
        setRecording(false)
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [recording, saveSettings, settings])

  const isLastStep = step === 2

  return (
    <div className="h-full bg-[#2a2a2a] text-white p-8 flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-8 app-drag" />
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-300 mb-3">{t.onboardingTitle}</p>
        <div className="flex gap-1.5 mb-8" aria-label={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map(index => <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-blue-400' : 'bg-white/15'}`} />)}
        </div>

        {step === 0 && (
          <section className="space-y-5">
            <h1 className="text-2xl font-semibold">{t.onboardingLocal}</h1>
            <p className="text-white/65 leading-relaxed">{t.onboardingLocalDesc}</p>
            <button
              type="button"
              onClick={() => {
                window.electronAPI.copyText('ClipShelf onboarding test')
                setTestCopied(true)
              }}
              className="w-full px-4 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition-colors"
            >
              {testCopied ? `✓ ${t.onboardingCopyTestDone}` : t.onboardingCopyTest}
            </button>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5">
            <h1 className="text-2xl font-semibold">{t.onboardingHotkey}</h1>
            <p className="text-white/65 leading-relaxed">{t.onboardingHotkeyDesc}</p>
            <button
              type="button"
              onClick={() => setRecording(true)}
              className={`w-full px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${recording ? 'border-blue-400 bg-blue-400/15 text-blue-200 animate-pulse' : 'border-white/15 bg-white/10 hover:bg-white/15'}`}
            >
              {recording ? 'Press keys…' : formatAccelerator(settings.hotkey)}
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5">
            <h1 className="text-2xl font-semibold">{t.onboardingPaste}</h1>
            <p className="text-white/65 leading-relaxed">{t.onboardingPasteDesc}</p>
            <label className="flex items-start gap-3 rounded-lg bg-white/5 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pasteDirectly}
                onChange={event => saveSettings({ ...settings, pasteDirectly: event.target.checked })}
                className="mt-1 w-4 h-4 rounded accent-blue-500"
              />
              <span className="text-sm">{t.pasteDirectly}</span>
            </label>
          </section>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 max-w-md mx-auto w-full">
        <button type="button" onClick={finish} className="text-sm text-white/45 hover:text-white/80">{t.onboardingSkip}</button>
        <div className="flex gap-2">
          {step > 0 && <button type="button" onClick={() => setStep(value => value - 1)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm">{t.onboardingBack}</button>}
          <button type="button" onClick={() => isLastStep ? finish() : setStep(value => value + 1)} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-sm font-medium">
            {isLastStep ? t.onboardingFinish : t.onboardingNext}
          </button>
        </div>
      </div>
    </div>
  )
}

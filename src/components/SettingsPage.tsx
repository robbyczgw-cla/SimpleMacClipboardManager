import { useState, useEffect, useCallback } from 'react'
import { getTranslations, languageNames, Language } from '../i18n/translations'
import type { RetentionDays, Settings, PanelPosition, CardSize } from '../types'
import { defaultSettings, DEFAULT_IGNORED_TYPES } from '../../common/defaults'
import { Icon } from './icons'

const MB = 1024 * 1024

// Convert a keyboard event into an Electron accelerator string (e.g. "Option+Space",
// "Command+Shift+V"). Returns null for lone modifiers or unmodified keys.
function eventToAccelerator(e: KeyboardEvent): string | null {
  const mods: string[] = []
  if (e.metaKey) mods.push('Command')
  if (e.ctrlKey) mods.push('Control')
  if (e.altKey) mods.push('Option')
  if (e.shiftKey) mods.push('Shift')

  const code = e.code
  let key = ''
  if (code === 'Space') key = 'Space'
  else if (/^Key[A-Z]$/.test(code)) key = code.slice(3)
  else if (/^Digit\d$/.test(code)) key = code.slice(5)
  else if (/^F\d{1,2}$/.test(code)) key = code
  else if (code === 'ArrowUp') key = 'Up'
  else if (code === 'ArrowDown') key = 'Down'
  else if (code === 'ArrowLeft') key = 'Left'
  else if (code === 'ArrowRight') key = 'Right'
  else if (code === 'Comma') key = ','
  else if (code === 'Period') key = '.'
  else if (code === 'Slash') key = '/'
  else if (code === 'Backquote') key = '`'
  else if (code === 'Minus') key = '-'
  else if (code === 'Equal') key = '='

  if (!key) return null
  if (mods.length === 0) return null // global shortcut must have a modifier
  return [...mods, key].join('+')
}

// Pretty macOS symbols for display.
function formatAccelerator(accel: string): string {
  return accel
    .split('+')
    .map(part => {
      switch (part) {
        case 'Command': case 'CommandOrControl': return '⌘'
        case 'Control': return '⌃'
        case 'Option': case 'Alt': return '⌥'
        case 'Shift': return '⇧'
        case 'Up': return '↑'
        case 'Down': return '↓'
        case 'Left': return '←'
        case 'Right': return '→'
        default: return part
      }
    })
    .join('')
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [saved, setSaved] = useState(false)
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    window.electronAPI.getSettings().then(setSettings)
  }, [])

  const t = getTranslations(settings.language)

  // Auto-save on every change — no manual Save button needed
  const handleChange = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      window.electronAPI.saveSettings(next)
      return next
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }, [])

  // Hotkey recorder: capture the next key combo while in recording mode.
  useEffect(() => {
    if (!recording) return
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') {
        setRecording(false)
        return
      }
      const accel = eventToAccelerator(e)
      if (accel) {
        handleChange('hotkey', accel)
        setRecording(false)
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [recording, handleChange])

  return (
    <div className="h-full bg-[#2a2a2a] text-white p-6 pt-10 flex flex-col">
      {/* Drag region for title bar */}
      <div className="absolute top-0 left-0 right-0 h-8 app-drag" />

      <h1 className="text-xl font-semibold mb-6">{t.settings}</h1>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        {/* History Section */}
        <section className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white/80 mb-4">{t.history}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">{t.maximumItems}</label>
              <select
                value={settings.historyLimit}
                onChange={e => handleChange('historyLimit', Number(e.target.value))}
                className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
                <option value={2000}>2000</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.maxImageSize}</label>
                <p className="text-xs text-white/40">{t.maxImageSizeDesc}</p>
              </div>
              <select
                value={settings.maxImageBytes}
                onChange={e => handleChange('maxImageBytes', Number(e.target.value))}
                className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value={2 * MB}>2 MB</option>
                <option value={4 * MB}>4 MB</option>
                <option value={8 * MB}>8 MB ({t.defaultSuffix})</option>
                <option value={16 * MB}>16 MB</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.ignoreDuplicates}</label>
                <p className="text-xs text-white/40">{t.ignoreDuplicatesDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.ignoreDuplicates}
                onChange={e => handleChange('ignoreDuplicates', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.clearOnQuit}</label>
                <p className="text-xs text-white/40">{t.clearOnQuitDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.clearOnQuit}
                onChange={e => handleChange('clearOnQuit', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="text-sm text-white/70">{t.retention}</label>
                <p className="text-xs text-white/40">{t.retentionDesc}</p>
              </div>
              <select
                value={settings.retentionDays}
                onChange={e => handleChange('retentionDays', Number(e.target.value) as RetentionDays)}
                className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value={0}>{t.never}</option>
                <option value={1}>{t.oneDay}</option>
                <option value={7}>{t.sevenDays}</option>
                <option value={30}>{t.thirtyDays}</option>
              </select>
            </div>
          </div>
        </section>

        {/* Behavior Section */}
        <section className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white/80 mb-4">{t.behavior}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">{t.pollingInterval}</label>
              <select
                value={settings.pollingInterval}
                onChange={e => handleChange('pollingInterval', Number(e.target.value))}
                className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value={250}>250ms ({t.fast})</option>
                <option value={500}>500ms ({t.default})</option>
                <option value={1000}>1000ms ({t.slow})</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.launchAtLogin}</label>
                <p className="text-xs text-white/40">{t.launchAtLoginDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.launchAtLogin}
                onChange={e => handleChange('launchAtLogin', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.showInDock}</label>
                <p className="text-xs text-white/40">{t.showInDockDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.showInDock}
                onChange={e => handleChange('showInDock', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.playSoundOnCopy}</label>
                <p className="text-xs text-white/40">{t.playSoundOnCopyDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.playSoundOnCopy}
                onChange={e => handleChange('playSoundOnCopy', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.pasteDirectly}</label>
                <p className="text-xs text-white/40">{t.pasteDirectlyDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.pasteDirectly}
                onChange={e => handleChange('pasteDirectly', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white/80 mb-4">{t.privacy}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.ignorePasswordManagers}</label>
                <p className="text-xs text-white/40">{t.ignorePasswordManagersDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.ignorePasswordManagers}
                onChange={e => handleChange('ignorePasswordManagers', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.loadFavicons}</label>
                <p className="text-xs text-white/40">{t.loadFaviconsDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.loadFavicons}
                onChange={e => handleChange('loadFavicons', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">{t.appExclusions}</label>
              <p className="text-xs text-white/40 mb-2">{t.appExclusionsDesc}</p>
              <textarea
                value={(settings.ignoredApplications || []).join('\n')}
                onChange={e => handleChange('ignoredApplications', e.target.value.split('\n').map(value => value.trim()).filter(Boolean))}
                className="w-full h-24 bg-white/10 border border-white/10 rounded px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 resize-none"
                placeholder={t.appExclusionsPlaceholder}
              />
            </div>
            {settings.ignorePasswordManagers && (
              <div>
                <label className="text-sm text-white/70">{t.ignoredPasteboardTypes}</label>
                <p className="text-xs text-white/40 mb-2">{t.ignoredPasteboardTypesDesc}</p>
                <textarea
                  value={(settings.ignoredPasteboardTypes || DEFAULT_IGNORED_TYPES).join('\n')}
                  onChange={e => handleChange('ignoredPasteboardTypes', e.target.value.split('\n').filter(s => s.trim()))}
                  className="w-full h-32 bg-white/10 border border-white/10 rounded px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="org.nspasteboard.TransientType"
                />
                <button
                  onClick={() => handleChange('ignoredPasteboardTypes', DEFAULT_IGNORED_TYPES)}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  {t.resetToDefaults}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Appearance Section */}
        <section className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white/80 mb-4">{t.appearance}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.panelPosition}</label>
                <p className="text-xs text-white/40">{t.panelPositionDesc}</p>
              </div>
              <select
                value={settings.panelPosition}
                onChange={e => handleChange('panelPosition', e.target.value as PanelPosition)}
                className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="bottom">{t.bottom}</option>
                <option value="top">{t.top}</option>
                <option value="left">{t.left}</option>
                <option value="right">{t.right}</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.language}</label>
                <p className="text-xs text-white/40">{t.languageDesc}</p>
              </div>
              <select
                value={settings.language}
                onChange={e => handleChange('language', e.target.value as Language)}
                className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {(Object.keys(languageNames) as Language[]).map(lang => (
                  <option key={lang} value={lang}>{languageNames[lang]}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.cardSize}</label>
                <p className="text-xs text-white/40">{t.cardSizeDesc}</p>
              </div>
              <select
                value={settings.cardSize || 'medium'}
                onChange={e => handleChange('cardSize', e.target.value as CardSize)}
                className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="small">{t.small}</option>
                <option value="medium">{t.medium}</option>
                <option value="large">{t.large}</option>
              </select>
            </div>
          </div>
        </section>

        {/* Keyboard Section */}
        <section className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white/80 mb-4">{t.keyboard}</h3>
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/70">{t.globalHotkey}</label>
            <button
              onClick={() => setRecording(r => !r)}
              className={`min-w-[110px] px-3 py-1.5 text-sm rounded border transition-colors font-medium
                ${recording
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300 animate-pulse'
                  : 'bg-white/10 border-white/10 text-white hover:border-blue-500'}`}
            >
              {recording ? t.recordingPrompt : formatAccelerator(settings.hotkey)}
            </button>
          </div>
          <p className="text-xs text-white/40 mt-2">
            {recording ? t.recordingPrompt : t.restartHotkey}
          </p>
        </section>

        {/* Backup Section */}
        <section className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white/80 mb-4">{t.backup}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.exportHistory}</label>
                <p className="text-xs text-white/40">{t.exportHistoryDesc}</p>
              </div>
              <button
                onClick={async () => {
                  if (!window.confirm(t.exportPrivacyWarning)) return
                  const result = await window.electronAPI.exportHistory()
                  if (result.success) {
                    setSaved(true)
                    setTimeout(() => setSaved(false), 2000)
                  }
                }}
                className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
              >
                {t.exportBtn}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">{t.importHistory}</label>
                <p className="text-xs text-white/40">{t.importHistoryDesc}</p>
              </div>
              <button
                onClick={async () => {
                  const result = await window.electronAPI.importHistory()
                  if (result.success) {
                    setSaved(true)
                    setTimeout(() => setSaved(false), 2000)
                  }
                }}
                className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
              >
                {t.importBtn}
              </button>
            </div>
          </div>
        </section>

        {/* App — quit without needing the (possibly hidden) menu-bar icon */}
        <section className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-white/70">{t.quit}</label>
              <p className="text-xs text-white/40">SimpleMacClipboardManager</p>
            </div>
            <button
              onClick={() => window.electronAPI.quitApp()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors
                         bg-red-500/15 hover:bg-red-500/30 text-red-300 border border-red-500/30"
            >
              <Icon name="power" className="w-3.5 h-3.5" />
              {t.quit}
            </button>
          </div>
        </section>
      </div>

      {/* Auto-save indicator */}
      <div className="mt-4 flex justify-center">
        <span className={`text-sm transition-opacity duration-300 ${saved ? 'text-green-400 opacity-100' : 'opacity-0'}`}>
          ✓ {t.settingsSaved}
        </span>
      </div>
    </div>
  )
}

import Store from 'electron-store'
import { copyFileSync, existsSync } from 'node:fs'
import type { ClipboardItem, Settings, StoreState, Collection } from '../../common/types'
import { CURRENT_SCHEMA_VERSION, migrateStoreState } from '../../common/migrations'

export class StoreRepository {
  private readonly store: Store<StoreState>
  private state: StoreState

  constructor(defaultSettings: Settings) {
    this.store = new Store<StoreState>({
      defaults: {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        history: [],
        collections: [],
        settings: defaultSettings
      }
    })

    const migration = migrateStoreState(this.store.store, defaultSettings)
    if (migration.changed) this.backupBeforeMigration()
    this.state = migration.state
    if (migration.changed) this.persistState()
  }

  get history(): ClipboardItem[] {
    return this.state.history
  }

  get collections(): Collection[] {
    return this.state.collections
  }

  get settings(): Settings {
    return this.state.settings
  }

  saveHistory(history: ClipboardItem[]) {
    this.state.history = history
    this.store.set('history', history)
  }

  saveCollections(collections: Collection[]) {
    this.state.collections = collections
    this.store.set('collections', collections)
  }

  saveSettings(settings: Settings) {
    this.state.settings = settings
    this.store.set('settings', settings)
  }

  flush() {
    this.persistState()
  }

  private persistState() {
    this.store.set({
      schemaVersion: this.state.schemaVersion,
      history: this.state.history,
      collections: this.state.collections,
      settings: this.state.settings
    })
  }

  private backupBeforeMigration() {
    if (!existsSync(this.store.path)) return
    const backupPath = `${this.store.path}.pre-v${CURRENT_SCHEMA_VERSION}-${Date.now()}.bak`
    try {
      copyFileSync(this.store.path, backupPath)
      console.log('Store backup created before migration:', backupPath)
    } catch (error) {
      console.warn('Store migration backup failed; continuing with normalized state:', error)
    }
  }
}

import { describe, expect, it } from 'vitest'
import { DEFAULT_SAVED_COLLECTION_ID, CURRENT_SCHEMA_VERSION, migrateStoreState } from './migrations'
import { defaultSettings } from './defaults'

describe('migrateStoreState', () => {
  it('migrates legacy pins to durable Saved state and the system collection', () => {
    const result = migrateStoreState({
      history: [{
        id: 'legacy',
        type: 'text',
        content: 'keep me',
        metadata: {},
        createdAt: 42,
        searchText: 'keep me',
        pinned: true
      }],
      settings: { historyLimit: 100 }
    }, defaultSettings, 1000)

    expect(result.changed).toBe(true)
    expect(result.state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.state.history[0].savedAt).toBe(42)
    expect(result.state.history[0].collectionIds).toEqual([DEFAULT_SAVED_COLLECTION_ID])
    expect(result.state.collections[0].id).toBe(DEFAULT_SAVED_COLLECTION_ID)
  })

  it('is idempotent after the normalized state is persisted', () => {
    const first = migrateStoreState({ history: [], settings: defaultSettings }, defaultSettings, 1000)
    const second = migrateStoreState(first.state, defaultSettings, 2000)

    expect(second.changed).toBe(false)
    expect(second.state).toEqual(first.state)
  })

  it('drops malformed history entries without dropping valid data', () => {
    const result = migrateStoreState({
      history: [null, { id: '', content: 'bad' }, {
        id: 'valid', type: 'text', content: 'ok', metadata: {}, createdAt: 5, searchText: 'ok'
      }]
    }, defaultSettings, 1000)

    expect(result.state.history.map(item => item.id)).toEqual(['valid'])
  })

  it('shows onboarding only for fresh installs, not existing legacy stores', () => {
    const legacy = migrateStoreState({ history: [], settings: {} }, defaultSettings, 1000)
    const fresh = migrateStoreState({ schemaVersion: CURRENT_SCHEMA_VERSION, history: [], settings: defaultSettings }, defaultSettings, 1000)

    expect(legacy.state.settings.onboardingCompleted).toBe(true)
    expect(fresh.state.settings.onboardingCompleted).toBe(false)
  })
})

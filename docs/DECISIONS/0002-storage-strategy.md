# ADR 0002: Versioned Local Store Before a Database Pivot

## Status

Accepted for v1 implementation.

## Decision

Keep `electron-store` as the v1 persistence engine, but put it behind a
versioned `StoreRepository` boundary. Introduce schema version `1`, normalize
legacy records on startup, migrate `pinned` items to the future Saved/Shelf
semantics, and create a timestamped backup before writing a changed schema.

The repository owns history, collections and settings persistence. The main
process remains authoritative for item lookup and system operations. Renderer
actions pass stable IDs rather than complete clipboard objects or file paths.

## Why

- The current product volume does not yet prove that SQLite is required.
- A repository boundary and pure migrations are more valuable immediately than
  a storage rewrite with native-module packaging risk.
- `electron-store` already ships with the app and preserves existing user data.
- Shelf/Collections can be built and tested against the same boundary.
- A later SQLite adapter remains possible without changing renderer contracts.

## Migration guarantees

- Legacy stores without `schemaVersion` migrate to version 1.
- Existing IDs, content, timestamps and managed image paths are preserved.
- `pinned: true` becomes durable Saved state and is assigned to the system
  `Saved` collection.
- Migration is idempotent.
- A pre-migration backup is attempted before the normalized state is persisted.
- Malformed records are dropped rather than allowed into the main-process
  history boundary.

## SQLite trigger

Revisit SQLite only when a measured requirement appears, such as search or
OCR-scale data that makes the store boundary a real performance constraint.
The trigger must include a benchmark, migration/rollback plan and a clear
benefit for the shipped product; architecture preference alone is not enough.

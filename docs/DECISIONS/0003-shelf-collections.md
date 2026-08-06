# ADR 0003: Saved Shelf and Collections MVP

## Status

Accepted for v1 implementation.

## Decision

Treat `Saved` as durable user intent and keep `Recent` as the bounded capture
history. User-created collections are lightweight labels attached to item IDs;
an item may belong to multiple collections. Assigning an item to any
collection also saves it, while removing it from the system `Saved` collection
returns it to `Recent` without deleting the item.

The renderer owns navigation and selection state, but the main process remains
authoritative for collection validation, item lookup and persistence. The
renderer communicates through ID-based IPC only.

## MVP behavior

- `Recent` shows unsaved clipboard captures and respects the history limit.
- `Saved` shows durable saved items and survives clearing Recent history.
- The system `Saved` collection cannot be renamed or deleted.
- Custom collections can be created, renamed, deleted and assigned to one or
  many selected items.
- `⌘⇧S` assigns the selected item(s) to the active collection; in a collection
  view it removes them when every selected item is already assigned.
- Export/import preserves collections while continuing to accept the legacy
  bare-array export format.

## Deliberate follow-up

The first MVP uses native prompt/confirm dialogs for collection naming and
deletion. A branded in-panel collection editor can replace them without
changing the storage schema or IPC contract.

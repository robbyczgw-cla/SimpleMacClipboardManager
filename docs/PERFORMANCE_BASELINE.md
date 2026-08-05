# Performance Baseline

This document records the measurements required before and after a runtime or
storage change. Values must come from the same Mac, build type and dataset; do
not compare container measurements with a real macOS launch.

## Required scenarios

| Scenario | Dataset / condition | Baseline | Modernized | Status |
|---|---|---:|---:|---|
| Idle CPU | App running for 60 seconds | pending | pending | Requires macOS |
| Idle memory | App running for 60 seconds | pending | pending | Requires macOS |
| Panel open | Warm menu-bar panel | pending | pending | Requires macOS |
| Search | 500 / 2,000 / 5,000 text items | pending | pending | Requires seeded dataset |
| Copy-to-card | Text, image and link | pending | pending | Requires macOS |
| Image capture | Screenshot-sized image | pending | pending | Requires macOS |
| Startup | Cold launch to visible panel | pending | pending | Requires macOS |
| Store load | Existing user data | pending | pending | Requires representative fixture |

## Measurement rules

- Record macOS version, Mac model, architecture, app version and dataset size.
- Use a release build, not Vite development mode.
- Repeat latency measurements at least five times and report median plus the
  slowest result.
- Record CPU and memory after the app reaches a stable idle state.
- A regression needs either a fix or a written reason before the related PR is
  considered ready.

## Current evidence

The container verification for the Electron 43 modernization covers TypeScript,
unit tests and production bundle generation. It does not provide valid macOS
CPU, memory, launch or accessibility evidence. Those measurements belong in the
manual Apple Silicon and Intel smoke-test pass.

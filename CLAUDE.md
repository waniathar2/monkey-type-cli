# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MonkeyType CLI — a terminal-based typing speed/accuracy test inspired by MonkeyType. Built with TypeScript and Ink (React for the terminal).

## Commands

```bash
npm run dev          # run with tsx (development)
npm run build        # build with tsup
npm start            # run built version (node dist/index.js)
npm test             # run all tests (vitest)
npm run test:watch   # run tests in watch mode
npx vitest run tests/engine/statsCalculator.test.ts  # run a single test file
```

### CLI flags

```bash
npx tsx src/index.tsx --mode time --duration 60    # timed mode, 60 seconds
npx tsx src/index.tsx --mode words --words 50       # word count mode
npx tsx src/index.tsx --mode quote                  # quote mode
npx tsx src/index.tsx --theme dracula --caret block  # theme + caret style
npx tsx src/index.tsx --stats                       # view history and personal bests
```

## Architecture

State machine app with four screens: IDLE → TYPING → FINISHED, plus SETTINGS accessible from IDLE.

- **Ink** renders React components to the terminal via JSX
- **Zustand** stores: `testStore` (typing state, cursor, keystrokes, timer) and `configStore` (settings, persisted to disk)
- **meow** parses CLI flags in `src/index.tsx`
- Word lists and quotes are bundled JSON files in `src/data/`
- User data (history, config, personal bests) stored as JSON in `~/.monkey-type-cli/`

### Key modules

- `src/engine/` — word generation, quote selection, stats calculation (WPM, accuracy, consistency, character breakdown, WPM-per-second)
- `src/stores/` — Zustand stores for typing state machine and config with disk persistence
- `src/components/` — Ink React components: HomeScreen, TypingArea (3-line scrolling display with per-character coloring), LiveStats, ResultsScreen, SettingsScreen, CommandPalette, StatsView
- `src/persistence/` — JSON file I/O to `~/.monkey-type-cli/` (history, personal bests, config)
- `src/themes/` — 6 built-in color themes (default, monokai, dracula, solarized-dark, nord, olivia)

### Test modes

Timed (15/30/60/120s), word count (10/25/50/100), quote (short/medium/long), zen (freeform), custom text via `--custom` flag.

## Design Spec

Full spec at `docs/superpowers/specs/2026-03-27-monkey-type-cli-design.md`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MonkeyType CLI — a terminal-based typing speed/accuracy test inspired by MonkeyType. Built with TypeScript and Ink (React for the terminal).

## Commands

```bash
npm install          # install dependencies
npm run dev          # run in development mode
npm run build        # build with tsup
npm start            # run built version
npm test             # run tests
```

## Architecture

State machine app with four screens: IDLE → TYPING → FINISHED, plus SETTINGS accessible from IDLE.

- **Ink** renders React components to the terminal
- **Zustand** manages centralized test state (word list, cursor, keystrokes, timer)
- **meow** parses CLI flags
- Word lists and quotes are bundled JSON files
- User data (history, config, personal bests) stored in `~/.monkey-type-cli/`

### Key modules

- **Typing engine**: word generation, per-keystroke tracking, cursor model (wordIndex + charIndex), 3-line scrolling display
- **Stats engine**: WPM calculation `(correctChars/5)/minutes`, raw WPM, accuracy, consistency (stddev of per-second WPM), character breakdown
- **Persistence**: JSON file read/write to `~/.monkey-type-cli/` with corruption recovery

### Test modes

Timed (15/30/60/120s), word count (10/25/50/100), quote (short/medium/long), zen (freeform), custom text.

## Design Spec

Full spec at `docs/superpowers/specs/2026-03-27-monkey-type-cli-design.md`.

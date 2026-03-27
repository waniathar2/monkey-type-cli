# MonkeyType CLI — Design Spec

A terminal-based typing speed/accuracy test inspired by MonkeyType, built with TypeScript and Ink (React for the terminal).

## Architecture

### State Machine

```
IDLE → TYPING → FINISHED → IDLE
              ↘ SETTINGS ↗
```

- **IDLE**: Shows generated words. First keypress transitions to TYPING.
- **TYPING**: Test active — timer counting, keystrokes recorded. Ends on timer expiry or word count reached.
- **FINISHED**: Results screen. `Tab` restarts, `Esc` goes home.
- **SETTINGS**: Interactive settings menu. `Esc` returns to IDLE.

### Component Tree

```
App
├── HomeScreen (test mode selection + typing area)
├── ResultsScreen (post-test stats)
├── SettingsScreen (interactive settings menu)
└── StatusBar (bottom bar: mode info, theme, shortcuts)
```

### State Management

Centralized `useTestStore` hook (Zustand) holding:

- Current word list, cursor position, typed characters
- Timer state (elapsed/remaining)
- Per-keystroke log: `{ timestamp, expected, typed, position }` — feeds real-time display and post-test analytics

## Typing Engine

### Word Generation

- `WordGenerator` module: takes word list name + count, returns randomized words
- Words pre-generated as string array, each split into characters for per-char tracking
- Quote mode: quotes stored as JSON, selected randomly by length category (short/medium/long)
- Zen mode: no pre-generated words, capture freeform input

### Keystroke Tracking

- Every keypress logged as `{ timestamp, expected, typed, position }`
- Backspace removes last entry but original mistake still recorded (raw accuracy vs corrected accuracy)

### Cursor Model

- Two indices: `wordIndex` (which word) and `charIndex` (position within word)
- Space advances to next word
- Extra characters beyond word length tracked as overflow errors
- Cannot go back to a previous word (matches MonkeyType behavior)

### Line Scrolling

- Display 3 lines of words at a time
- When cursor reaches end of line 2: line 2 → line 1, line 3 → line 2, new words fill line 3
- Typed words on scrolled-away lines are no longer visible

## Test Modes

### Timed Mode (default)

- Durations: 15, 30, 60, 120 seconds
- Timer starts on first keypress, counts down
- Words generate infinitely — new words appended as you progress
- Test ends when timer hits 0

### Word Count Mode

- Counts: 10, 25, 50, 100 words
- Timer counts up (elapsed time)
- Test ends when all words are correctly completed

### Quote Mode

- Quotes bundled as JSON, categorized by length: short (<100 chars), medium (100-300), long (300+)
- User picks length category, random quote selected
- Source/author shown on results screen

### Zen Mode

- No timer, no word count, no target text
- User types freely, `Esc` to finish
- WPM based on word count / elapsed time

### Custom Text

- Via CLI flag: `--custom "text"` or `--custom-file ./path.txt`
- Behaves like quote mode with user-provided content

## Stats & Persistence

### Live Stats (during test)

- **WPM**: `(correctCharacters / 5) / elapsedMinutes`, updated every second
- **Live accuracy**: `correctKeystrokes / totalKeystrokes` as percentage

### Results Screen

- **WPM** — net words per minute (only correct characters)
- **Raw WPM** — all typed characters including mistakes
- **Accuracy** — percentage of correct keystrokes
- **Consistency** — standard deviation of per-second WPM
- **Characters** — correct / incorrect / extra / missed breakdown
- **WPM over time chart** — sparkline/ASCII chart showing WPM per second
- **Per-character accuracy heatmap** — which characters you miss most often (table)

### Local Persistence

Stored in `~/.monkey-type-cli/`:

- `history.json` — array of test results (timestamp, mode, settings, all stats)
- `personal-bests.json` — best WPM/accuracy per mode+duration combo, auto-updated
- `config.json` — user settings (theme, caret style, defaults)

### Trend Viewing

Via `--stats` flag or in-app menu:

- Last 10 results
- Personal bests table
- Average WPM/accuracy over last 50 tests
- All-time character accuracy breakdown

## UI & Theming

### Layout

```
┌─────────────────────────────────────────┐
│        [mode tabs: time/words/quote/zen]              │
│        [sub-options: 15 30 60 120]                    │
├─────────────────────────────────────────┤
│                                                       │
│  the quick brown fox jumps over the lazy dog          │  ← line 1 (dimmed)
│  pack my box with five dozen liquor jugs              │  ← line 2 (active)
│  how vexingly quick daft zebras jump                  │  ← line 3 (upcoming)
│                                                       │
├─────────────────────────────────────────┤
│  WPM: 72  |  ACC: 96%  |  TIME: 0:23                 │
└─────────────────────────────────────────┘
```

### Character Coloring

- Untyped: dim/gray
- Correct: white (theme foreground)
- Incorrect: red
- Extra characters: red + underline
- Current position: caret indicator

### Caret Styles (configurable)

- **Block** — highlights current character
- **Line** — thin vertical bar before current character
- **Underline** — underscore beneath current character

### Themes

Built-in themes, each defined as `{ bg, fg, dimmed, correct, incorrect, caret, accent }`:

- `default` — dark background, white/gray text
- `monokai` — warm dark theme
- `dracula` — purple-accented dark theme
- `solarized-dark`
- `nord`
- `olivia` — MonkeyType fan favorite

### Keyboard Shortcuts

- `Tab` — restart test
- `Esc` — go to home / exit settings
- `Ctrl+Shift+S` — open settings
- `Ctrl+Shift+P` — command palette (quick mode/theme switching)

## Settings

### Interactive Settings Menu (`Ctrl+Shift+S`)

```
Settings
────────────────────────
► Test Mode        [time ▼]
► Duration/Count   [30 ▼]
► Word List        [english-1k ▼]
► Caret Style      [line ▼]
► Theme            [default ▼]
► Show Live WPM    [on ▼]
► Show Live Accuracy [on ▼]
► Smooth Caret     [on ▼]
────────────────────────
[Esc] Back
```

- Arrow keys to navigate, Enter/Left-Right to change values
- Changes apply immediately, persisted to config.json
- All settings also available as CLI flags for one-off overrides

### CLI Flags

- `--mode time|words|quote|zen`
- `--duration 15|30|60|120`
- `--words 10|25|50|100`
- `--wordlist english-200|english-1k|english-5k`
- `--theme <name>`
- `--caret block|line|underline`
- `--custom "text"` / `--custom-file path`
- `--stats` — show stats history

## Error Handling & Edge Cases

### Terminal Size

- Minimum: 60 columns x 15 rows
- Show resize message if too small
- Handle mid-test resize — reflow words, maintain cursor position

### Input Edge Cases

- Ignore modifier-only keys (Ctrl, Alt, Shift alone), function keys, arrow keys during typing
- Handle paste: ignore or process char-by-char
- No dropped keystrokes under rapid input

### Graceful Exit

- `Ctrl+C` always exits cleanly
- Mid-test exit: don't save partial results
- Always restore terminal state (raw mode, cursor visibility) on exit — register signal handlers

### Data Integrity

- Create `~/.monkey-type-cli/` on first run if missing
- Back up and recreate corrupted `history.json`
- Config file migration if schema changes

## Tech Stack

- **Language**: TypeScript
- **TUI Framework**: Ink (React for terminal)
- **State Management**: Zustand
- **CLI Parsing**: meow (pairs well with Ink)
- **Build**: tsup
- **Word Lists**: Bundled JSON files (english-200, english-1k, english-5k)
- **Quotes**: Bundled JSON file with categorized quotes
- **Storage**: JSON files in `~/.monkey-type-cli/`

# monkey-type-cli

A terminal-based typing speed test inspired by [MonkeyType](https://monkeytype.com). Built with TypeScript, Ink, and React.

```
── monkey-type-cli ──────────────────────────────────────

              time | words | quote | zen
                        30

    the quick brown fox jumps over the lazy dog and
    the cat sat on the mat while birds flew across
    the sky watching from above with curious eyes

              WPM: 72    ACC: 97%    TIME: 0:15

    [q] [w] [e] [r] [t] [y] [u] [i] [o] [p]
      [a] [s] [d] [f] [g] [h] [j] [k] [l]
        [z] [x] [c] [v] [b] [n] [m]
               [     space     ]

──────────────────────────────────────────────────────────
      tab restart  ·  ctrl+s settings  ·  ctrl+p commands
```

## Install

```bash
npm install -g monkey-type-cli
```

Or run directly with npx:

```bash
npx monkey-type-cli
```

## Usage

```bash
monkey-type-cli                              # default: timed mode, 30s
monkey-type-cli --mode time --duration 60    # timed mode, 60 seconds
monkey-type-cli --mode words --words 50      # word count mode, 50 words
monkey-type-cli --mode quote                 # quote mode
monkey-type-cli --mode zen                   # freeform, press esc to finish
monkey-type-cli --theme dracula              # use dracula color theme
monkey-type-cli --caret block                # block cursor style
monkey-type-cli --stats                      # view history and personal bests
```

## Features

- **Test modes** - Timed (15/30/60/120s), word count (10/25/50/100), quote (short/medium/long), zen (freeform)
- **Live stats** - Real-time WPM, accuracy, and timer
- **Results screen** - WPM, raw WPM, accuracy, consistency, character breakdown, WPM line chart, weakest keys
- **Virtual keyboard** - Highlights the next key to press; shows correct/incorrect feedback
- **Blinking cursor** - Three caret styles: block, line, underline
- **6 themes** - default, monokai, dracula, solarized-dark, nord, olivia
- **Persistent stats** - History and personal bests saved to `~/.monkey-type-cli/`
- **Settings** - In-app settings screen (ctrl+s) and command palette (ctrl+p)
- **3 word lists** - english-200, english-1k, english-5k

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `tab` | Restart test |
| `ctrl+s` | Open settings |
| `ctrl+p` | Open command palette |
| `ctrl+c` | Quit |
| `esc` | Finish zen mode / go home from results |

## Options

| Flag | Description | Values | Default |
|------|-------------|--------|---------|
| `--mode` | Test mode | `time`, `words`, `quote`, `zen` | `time` |
| `--duration` | Timer duration (seconds) | `15`, `30`, `60`, `120` | `30` |
| `--words` | Word count | `10`, `25`, `50`, `100` | `25` |
| `--wordlist` | Word list | `english-200`, `english-1k`, `english-5k` | `english-1k` |
| `--theme` | Color theme | `default`, `monokai`, `dracula`, `solarized-dark`, `nord`, `olivia` | `default` |
| `--caret` | Cursor style | `block`, `line`, `underline` | `line` |
| `--stats` | Show history | | |

## Requirements

- Node.js >= 18
- Terminal with Unicode support (most modern terminals)
- Minimum terminal size: 60 columns x 15 rows

## Development

```bash
git clone https://github.com/your-username/monkey-type-cli.git
cd monkey-type-cli
npm install
npm run dev          # run with tsx
npm test             # run tests
npm run build        # build with tsup
```

## License

MIT

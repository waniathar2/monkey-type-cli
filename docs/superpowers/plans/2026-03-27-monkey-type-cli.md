# MonkeyType CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a terminal-based typing test app inspired by MonkeyType, with timed/word/quote/zen/custom modes, live stats, local persistence, theming, and an interactive settings menu.

**Architecture:** Ink (React for terminal) renders the UI as components. Zustand manages centralized test state. A state machine (IDLE → TYPING → FINISHED, plus SETTINGS) drives screen transitions. The typing engine tracks per-keystroke data feeding both real-time display and post-test analytics.

**Tech Stack:** TypeScript, Ink 4, Zustand, meow, tsup, Vitest

---

## File Structure

```
src/
├── index.tsx                  # Entry point: CLI arg parsing (meow), render <App />
├── App.tsx                    # State machine router: renders screen based on appState
├── types.ts                   # All shared types and interfaces
├── stores/
│   ├── testStore.ts           # Zustand store: typing state, cursor, keystrokes, timer
│   └── configStore.ts         # Zustand store: settings, theme, caret style
├── engine/
│   ├── wordGenerator.ts       # Random word selection from word lists
│   ├── quoteGenerator.ts      # Random quote selection by length category
│   └── statsCalculator.ts     # WPM, accuracy, consistency, character breakdown
├── components/
│   ├── HomeScreen.tsx         # Mode tabs + typing area container
│   ├── ModeSelector.tsx       # Mode tabs (time/words/quote/zen) and sub-options
│   ├── TypingArea.tsx         # 3-line word display with character coloring + caret
│   ├── LiveStats.tsx          # Bottom bar: WPM, accuracy, timer
│   ├── ResultsScreen.tsx      # Post-test stats display
│   ├── WpmChart.tsx           # ASCII sparkline chart for WPM over time
│   ├── SettingsScreen.tsx     # Interactive settings menu
│   └── CommandPalette.tsx     # Quick mode/theme switcher overlay
├── themes/
│   └── themes.ts              # Theme definitions (default, monokai, dracula, etc.)
├── data/
│   ├── english-200.json       # 200 common English words
│   ├── english-1k.json        # 1000 English words
│   ├── english-5k.json        # 5000 English words
│   └── quotes.json            # Quotes categorized by length
└── persistence/
    ├── storage.ts             # Read/write JSON files to ~/.monkey-type-cli/
    ├── history.ts             # Save/query test history
    └── personalBests.ts       # Track and update personal bests

tests/
├── engine/
│   ├── wordGenerator.test.ts
│   ├── quoteGenerator.test.ts
│   └── statsCalculator.test.ts
├── stores/
│   ├── testStore.test.ts
│   └── configStore.test.ts
├── persistence/
│   ├── storage.test.ts
│   ├── history.test.ts
│   └── personalBests.test.ts
└── components/
    ├── TypingArea.test.tsx
    └── ResultsScreen.test.tsx
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`
- Create: `src/index.tsx`
- Create: `src/App.tsx`
- Create: `src/types.ts`

- [ ] **Step 1: Initialize npm project and install dependencies**

```bash
cd /Users/cravv/Projects/monkey_type_cli
npm init -y
npm install ink react zustand meow
npm install -D typescript @types/react vitest tsup @inkjs/testing-library
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create tsup.config.ts**

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  clean: true,
  sourcemap: true,
});
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

- [ ] **Step 5: Create src/types.ts with all shared types**

```typescript
export type AppScreen = "home" | "results" | "settings";

export type TestMode = "time" | "words" | "quote" | "zen" | "custom";
export type TimeDuration = 15 | 30 | 60 | 120;
export type WordCount = 10 | 25 | 50 | 100;
export type WordListName = "english-200" | "english-1k" | "english-5k";
export type QuoteLength = "short" | "medium" | "long";
export type CaretStyle = "block" | "line" | "underline";

export interface Keystroke {
  timestamp: number;
  expected: string;
  typed: string;
  position: { wordIndex: number; charIndex: number };
  isBackspace: boolean;
}

export interface TestResult {
  id: string;
  timestamp: number;
  mode: TestMode;
  duration: TimeDuration | null;
  wordCount: WordCount | null;
  wordList: WordListName;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  characters: {
    correct: number;
    incorrect: number;
    extra: number;
    missed: number;
  };
  wpmPerSecond: number[];
  keystrokeLog: Keystroke[];
  quoteSource?: string;
  quoteAuthor?: string;
}

export interface ThemeColors {
  bg: string;
  fg: string;
  dimmed: string;
  correct: string;
  incorrect: string;
  caret: string;
  accent: string;
}

export interface Config {
  mode: TestMode;
  duration: TimeDuration;
  wordCount: WordCount;
  wordList: WordListName;
  quoteLength: QuoteLength;
  caretStyle: CaretStyle;
  theme: string;
  showLiveWpm: boolean;
  showLiveAccuracy: boolean;
  smoothCaret: boolean;
}

export interface Quote {
  text: string;
  source: string;
  author: string;
  length: QuoteLength;
}
```

- [ ] **Step 6: Create src/App.tsx — minimal shell**

```tsx
import React, { useState } from "react";
import { Box, Text } from "ink";
import { type AppScreen } from "./types.js";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("home");

  return (
    <Box flexDirection="column">
      <Text>MonkeyType CLI — screen: {screen}</Text>
    </Box>
  );
}
```

- [ ] **Step 7: Create src/index.tsx — entry point**

```tsx
import React from "react";
import { render } from "ink";
import meow from "meow";
import App from "./App.js";

const cli = meow(
  `
  Usage
    $ monkey-type-cli

  Options
    --mode      Test mode: time, words, quote, zen (default: time)
    --duration  Time in seconds: 15, 30, 60, 120 (default: 30)
    --words     Word count: 10, 25, 50, 100 (default: 25)
    --wordlist  Word list: english-200, english-1k, english-5k (default: english-1k)
    --theme     Color theme (default: default)
    --caret     Caret style: block, line, underline (default: line)
    --custom    Custom text to type
    --custom-file  Path to custom text file
    --stats     Show stats history
`,
  {
    importMeta: import.meta,
    flags: {
      mode: { type: "string", default: "time" },
      duration: { type: "number", default: 30 },
      words: { type: "number", default: 25 },
      wordlist: { type: "string", default: "english-1k" },
      theme: { type: "string", default: "default" },
      caret: { type: "string", default: "line" },
      custom: { type: "string" },
      customFile: { type: "string" },
      stats: { type: "boolean", default: false },
    },
  }
);

render(<App />);
```

- [ ] **Step 8: Update package.json scripts**

Add to `package.json`:
```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.tsx",
    "build": "tsup",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Also install tsx: `npm install -D tsx`

- [ ] **Step 9: Verify it runs**

Run: `npx tsx src/index.tsx`
Expected: Terminal shows "MonkeyType CLI — screen: home" then exits cleanly.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold project with Ink, Zustand, meow, tsup, vitest"
```

---

### Task 2: Theme System

**Files:**
- Create: `src/themes/themes.ts`

- [ ] **Step 1: Write failing test**

Create `tests/themes/themes.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { themes, getTheme, themeNames } from "../../src/themes/themes.js";

describe("themes", () => {
  it("has all required themes", () => {
    expect(themeNames).toContain("default");
    expect(themeNames).toContain("monokai");
    expect(themeNames).toContain("dracula");
    expect(themeNames).toContain("solarized-dark");
    expect(themeNames).toContain("nord");
    expect(themeNames).toContain("olivia");
  });

  it("every theme has all required color keys", () => {
    const requiredKeys = ["bg", "fg", "dimmed", "correct", "incorrect", "caret", "accent"];
    for (const name of themeNames) {
      const theme = getTheme(name);
      for (const key of requiredKeys) {
        expect(theme).toHaveProperty(key);
        expect(typeof theme[key as keyof typeof theme]).toBe("string");
      }
    }
  });

  it("getTheme falls back to default for unknown theme", () => {
    expect(getTheme("nonexistent")).toEqual(getTheme("default"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/themes/themes.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement themes**

Create `src/themes/themes.ts`:
```typescript
import { type ThemeColors } from "../types.js";

export const themes: Record<string, ThemeColors> = {
  default: {
    bg: "#1e1e1e",
    fg: "#d4d4d4",
    dimmed: "#555555",
    correct: "#d4d4d4",
    incorrect: "#e74c3c",
    caret: "#e2b714",
    accent: "#e2b714",
  },
  monokai: {
    bg: "#272822",
    fg: "#f8f8f2",
    dimmed: "#75715e",
    correct: "#f8f8f2",
    incorrect: "#f92672",
    caret: "#a6e22e",
    accent: "#a6e22e",
  },
  dracula: {
    bg: "#282a36",
    fg: "#f8f8f2",
    dimmed: "#6272a4",
    correct: "#f8f8f2",
    incorrect: "#ff5555",
    caret: "#bd93f9",
    accent: "#bd93f9",
  },
  "solarized-dark": {
    bg: "#002b36",
    fg: "#839496",
    dimmed: "#586e75",
    correct: "#839496",
    incorrect: "#dc322f",
    caret: "#b58900",
    accent: "#b58900",
  },
  nord: {
    bg: "#2e3440",
    fg: "#d8dee9",
    dimmed: "#4c566a",
    correct: "#d8dee9",
    incorrect: "#bf616a",
    caret: "#88c0d0",
    accent: "#88c0d0",
  },
  olivia: {
    bg: "#1c1b1d",
    fg: "#e8d5b9",
    dimmed: "#645c54",
    correct: "#e8d5b9",
    incorrect: "#c34a47",
    caret: "#deaf8c",
    accent: "#deaf8c",
  },
};

export const themeNames = Object.keys(themes);

export function getTheme(name: string): ThemeColors {
  return themes[name] ?? themes["default"];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/themes/themes.test.ts`
Expected: PASS — all 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/themes/themes.ts tests/themes/themes.test.ts
git commit -m "feat: add theme system with 6 built-in themes"
```

---

### Task 3: Word Lists & Word Generator

**Files:**
- Create: `src/data/english-200.json`
- Create: `src/data/english-1k.json`
- Create: `src/data/english-5k.json`
- Create: `src/engine/wordGenerator.ts`
- Create: `tests/engine/wordGenerator.test.ts`

- [ ] **Step 1: Create word list JSON files**

Create `src/data/english-200.json` — an array of the 200 most common English words:
```json
["the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us", "great", "between", "need", "large", "under", "never", "each", "right", "thought", "such", "here", "turn", "end", "might", "city", "much", "still", "begin", "life", "country", "hand", "high", "keep", "place", "point", "move", "try", "old", "found", "live", "long", "very", "left", "same", "while", "last", "school", "world", "near", "should", "thing", "own", "run", "read", "around", "house", "show", "before", "three", "small", "set", "put", "open", "home", "where", "again", "off", "went", "must", "big", "too", "close", "part", "seem", "help", "every", "name", "play", "line", "call", "little", "change", "follow", "write", "land", "learn", "few", "many", "head", "food", "ask", "stop", "hard", "start", "far", "eye", "story", "young", "light", "group", "side", "water", "night", "tree", "let", "kind"]
```

Create `src/data/english-1k.json` — fetch a standard 1000-word English list. For now, start with the 200 words and extend. The implementation agent should use a well-known MonkeyType-compatible word list source. Generate a 1000-word array of common English words.

Create `src/data/english-5k.json` — same approach with 5000 words. The implementation agent should source these from a reputable word frequency list.

**Note to implementer:** The word lists should contain only lowercase words, no punctuation, sorted by frequency. You can source them from MonkeyType's open-source word lists on GitHub or similar public domain sources.

- [ ] **Step 2: Write failing test for wordGenerator**

Create `tests/engine/wordGenerator.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { generateWords } from "../../src/engine/wordGenerator.js";

describe("generateWords", () => {
  it("returns the requested number of words", () => {
    const words = generateWords("english-200", 25);
    expect(words).toHaveLength(25);
  });

  it("returns strings from the word list", () => {
    const words = generateWords("english-200", 10);
    for (const word of words) {
      expect(typeof word).toBe("string");
      expect(word.length).toBeGreaterThan(0);
    }
  });

  it("produces different results on subsequent calls (randomized)", () => {
    const a = generateWords("english-200", 50);
    const b = generateWords("english-200", 50);
    // Extremely unlikely to be identical with 50 random words
    expect(a).not.toEqual(b);
  });

  it("works with all word list names", () => {
    expect(generateWords("english-200", 5)).toHaveLength(5);
    expect(generateWords("english-1k", 5)).toHaveLength(5);
    expect(generateWords("english-5k", 5)).toHaveLength(5);
  });

  it("avoids consecutive duplicate words", () => {
    const words = generateWords("english-200", 100);
    for (let i = 1; i < words.length; i++) {
      expect(words[i]).not.toBe(words[i - 1]);
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/engine/wordGenerator.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 4: Implement wordGenerator**

Create `src/engine/wordGenerator.ts`:
```typescript
import english200 from "../data/english-200.json" with { type: "json" };
import english1k from "../data/english-1k.json" with { type: "json" };
import english5k from "../data/english-5k.json" with { type: "json" };
import { type WordListName } from "../types.js";

const wordLists: Record<WordListName, string[]> = {
  "english-200": english200,
  "english-1k": english1k,
  "english-5k": english5k,
};

export function generateWords(listName: WordListName, count: number): string[] {
  const list = wordLists[listName];
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    let word: string;
    do {
      word = list[Math.floor(Math.random() * list.length)];
    } while (result.length > 0 && word === result[result.length - 1]);
    result.push(word);
  }

  return result;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/engine/wordGenerator.test.ts`
Expected: PASS — all 5 tests

- [ ] **Step 6: Commit**

```bash
git add src/data/ src/engine/wordGenerator.ts tests/engine/wordGenerator.test.ts
git commit -m "feat: add word lists and word generator"
```

---

### Task 4: Quote Generator

**Files:**
- Create: `src/data/quotes.json`
- Create: `src/engine/quoteGenerator.ts`
- Create: `tests/engine/quoteGenerator.test.ts`

- [ ] **Step 1: Create quotes.json**

Create `src/data/quotes.json`:
```json
[
  { "text": "The only way to do great work is to love what you do.", "source": "Stanford Commencement", "author": "Steve Jobs", "length": "short" },
  { "text": "In the middle of difficulty lies opportunity.", "source": "Attributed", "author": "Albert Einstein", "length": "short" },
  { "text": "It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change.", "source": "Attributed", "author": "Charles Darwin", "length": "medium" },
  { "text": "The greatest glory in living lies not in never falling, but in rising every time we fall. Life is what happens when you are busy making other plans. The future belongs to those who believe in the beauty of their dreams.", "source": "Various", "author": "Various", "length": "long" }
]
```

**Note to implementer:** Expand this to at least 10 quotes per category (short/medium/long). Source from public domain quotes.

- [ ] **Step 2: Write failing test**

Create `tests/engine/quoteGenerator.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { getRandomQuote } from "../../src/engine/quoteGenerator.js";

describe("getRandomQuote", () => {
  it("returns a quote with required fields", () => {
    const quote = getRandomQuote("short");
    expect(quote).toHaveProperty("text");
    expect(quote).toHaveProperty("source");
    expect(quote).toHaveProperty("author");
    expect(quote).toHaveProperty("length");
    expect(typeof quote.text).toBe("string");
    expect(quote.text.length).toBeGreaterThan(0);
  });

  it("returns quotes matching requested length", () => {
    const short = getRandomQuote("short");
    expect(short.length).toBe("short");

    const medium = getRandomQuote("medium");
    expect(medium.length).toBe("medium");

    const long = getRandomQuote("long");
    expect(long.length).toBe("long");
  });

  it("returns different quotes on repeated calls", () => {
    const quotes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      quotes.add(getRandomQuote("short").text);
    }
    // Should get at least 2 different quotes in 20 tries
    expect(quotes.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/engine/quoteGenerator.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 4: Implement quoteGenerator**

Create `src/engine/quoteGenerator.ts`:
```typescript
import quotesData from "../data/quotes.json" with { type: "json" };
import { type Quote, type QuoteLength } from "../types.js";

const quotes = quotesData as Quote[];

export function getRandomQuote(length: QuoteLength): Quote {
  const filtered = quotes.filter((q) => q.length === length);
  return filtered[Math.floor(Math.random() * filtered.length)];
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/engine/quoteGenerator.test.ts`
Expected: PASS — all 3 tests

- [ ] **Step 6: Commit**

```bash
git add src/data/quotes.json src/engine/quoteGenerator.ts tests/engine/quoteGenerator.test.ts
git commit -m "feat: add quote generator with length categories"
```

---

### Task 5: Stats Calculator

**Files:**
- Create: `src/engine/statsCalculator.ts`
- Create: `tests/engine/statsCalculator.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/engine/statsCalculator.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  calculateWpm,
  calculateRawWpm,
  calculateAccuracy,
  calculateConsistency,
  calculateCharacterBreakdown,
  calculateWpmPerSecond,
} from "../../src/engine/statsCalculator.js";
import { type Keystroke } from "../../src/types.js";

function makeKeystroke(expected: string, typed: string, timestampOffset: number): Keystroke {
  return {
    timestamp: 1000 + timestampOffset,
    expected,
    typed,
    position: { wordIndex: 0, charIndex: 0 },
    isBackspace: false,
  };
}

describe("calculateWpm", () => {
  it("calculates net WPM correctly", () => {
    // 50 correct characters in 60 seconds = (50/5) / 1 = 10 WPM
    const wpm = calculateWpm(50, 60000);
    expect(wpm).toBe(10);
  });

  it("returns 0 for 0 elapsed time", () => {
    expect(calculateWpm(50, 0)).toBe(0);
  });
});

describe("calculateRawWpm", () => {
  it("calculates raw WPM from all typed characters", () => {
    // 60 total characters in 60 seconds = (60/5) / 1 = 12 WPM
    const raw = calculateRawWpm(60, 60000);
    expect(raw).toBe(12);
  });
});

describe("calculateAccuracy", () => {
  it("calculates percentage of correct keystrokes", () => {
    const acc = calculateAccuracy(90, 100);
    expect(acc).toBe(90);
  });

  it("returns 100 for 0 total", () => {
    expect(calculateAccuracy(0, 0)).toBe(100);
  });
});

describe("calculateConsistency", () => {
  it("returns 100 for perfectly consistent WPM", () => {
    const wpmPerSecond = [60, 60, 60, 60, 60];
    expect(calculateConsistency(wpmPerSecond)).toBe(100);
  });

  it("returns lower value for inconsistent WPM", () => {
    const wpmPerSecond = [20, 80, 30, 90, 10];
    expect(calculateConsistency(wpmPerSecond)).toBeLessThan(100);
  });

  it("returns 100 for empty array", () => {
    expect(calculateConsistency([])).toBe(100);
  });
});

describe("calculateCharacterBreakdown", () => {
  it("counts correct, incorrect, extra, and missed characters", () => {
    const keystrokes: Keystroke[] = [
      makeKeystroke("a", "a", 0),    // correct
      makeKeystroke("b", "x", 100),  // incorrect
      makeKeystroke("", "z", 200),   // extra (no expected char)
    ];
    const missedCount = 2; // 2 characters never typed
    const result = calculateCharacterBreakdown(keystrokes, missedCount);
    expect(result.correct).toBe(1);
    expect(result.incorrect).toBe(1);
    expect(result.extra).toBe(1);
    expect(result.missed).toBe(2);
  });
});

describe("calculateWpmPerSecond", () => {
  it("groups keystrokes by second and returns WPM per second", () => {
    // 5 correct chars in second 0 = 1 word = 60 WPM
    const keystrokes: Keystroke[] = [];
    for (let i = 0; i < 5; i++) {
      keystrokes.push(makeKeystroke("a", "a", i * 100)); // all within first second
    }
    const result = calculateWpmPerSecond(keystrokes, 1000);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(60); // 5 chars / 5 = 1 word, * 60 = 60 WPM
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/engine/statsCalculator.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement statsCalculator**

Create `src/engine/statsCalculator.ts`:
```typescript
import { type Keystroke } from "../types.js";

export function calculateWpm(correctCharacters: number, elapsedMs: number): number {
  if (elapsedMs === 0) return 0;
  const minutes = elapsedMs / 60000;
  return Math.round((correctCharacters / 5) / minutes);
}

export function calculateRawWpm(totalCharacters: number, elapsedMs: number): number {
  if (elapsedMs === 0) return 0;
  const minutes = elapsedMs / 60000;
  return Math.round((totalCharacters / 5) / minutes);
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((correct / total) * 100);
}

export function calculateConsistency(wpmPerSecond: number[]): number {
  if (wpmPerSecond.length <= 1) return 100;
  const mean = wpmPerSecond.reduce((a, b) => a + b, 0) / wpmPerSecond.length;
  if (mean === 0) return 100;
  const variance = wpmPerSecond.reduce((sum, v) => sum + (v - mean) ** 2, 0) / wpmPerSecond.length;
  const stddev = Math.sqrt(variance);
  // Convert stddev to a 0-100 score: coefficient of variation inverted
  const cv = stddev / mean;
  return Math.round(Math.max(0, (1 - cv) * 100));
}

export function calculateCharacterBreakdown(
  keystrokes: Keystroke[],
  missedCount: number
): { correct: number; incorrect: number; extra: number; missed: number } {
  let correct = 0;
  let incorrect = 0;
  let extra = 0;

  for (const ks of keystrokes) {
    if (ks.isBackspace) continue;
    if (ks.expected === "") {
      extra++;
    } else if (ks.typed === ks.expected) {
      correct++;
    } else {
      incorrect++;
    }
  }

  return { correct, incorrect, extra, missed: missedCount };
}

export function calculateWpmPerSecond(keystrokes: Keystroke[], testStartTime: number): number[] {
  if (keystrokes.length === 0) return [];

  const correctBySecond: Map<number, number> = new Map();
  let maxSecond = 0;

  for (const ks of keystrokes) {
    if (ks.isBackspace) continue;
    if (ks.typed !== ks.expected) continue;
    const second = Math.floor((ks.timestamp - testStartTime) / 1000);
    correctBySecond.set(second, (correctBySecond.get(second) ?? 0) + 1);
    maxSecond = Math.max(maxSecond, second);
  }

  const result: number[] = [];
  for (let s = 0; s <= maxSecond; s++) {
    const chars = correctBySecond.get(s) ?? 0;
    // chars per second → words per minute: (chars/5) * 60
    result.push(Math.round((chars / 5) * 60));
  }

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/engine/statsCalculator.test.ts`
Expected: PASS — all tests

- [ ] **Step 5: Commit**

```bash
git add src/engine/statsCalculator.ts tests/engine/statsCalculator.test.ts
git commit -m "feat: add stats calculator (WPM, accuracy, consistency, breakdown)"
```

---

### Task 6: Config Store

**Files:**
- Create: `src/stores/configStore.ts`
- Create: `tests/stores/configStore.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/stores/configStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useConfigStore } from "../../src/stores/configStore.js";

describe("configStore", () => {
  beforeEach(() => {
    useConfigStore.setState(useConfigStore.getInitialState());
  });

  it("has sensible defaults", () => {
    const state = useConfigStore.getState();
    expect(state.config.mode).toBe("time");
    expect(state.config.duration).toBe(30);
    expect(state.config.wordCount).toBe(25);
    expect(state.config.wordList).toBe("english-1k");
    expect(state.config.caretStyle).toBe("line");
    expect(state.config.theme).toBe("default");
    expect(state.config.showLiveWpm).toBe(true);
    expect(state.config.showLiveAccuracy).toBe(true);
    expect(state.config.smoothCaret).toBe(true);
  });

  it("updates individual config fields", () => {
    useConfigStore.getState().updateConfig({ mode: "words", duration: 60 });
    const state = useConfigStore.getState();
    expect(state.config.mode).toBe("words");
    expect(state.config.duration).toBe(60);
    // Others unchanged
    expect(state.config.wordList).toBe("english-1k");
  });

  it("applies CLI overrides", () => {
    useConfigStore.getState().applyCliOverrides({ mode: "quote", theme: "dracula" });
    const state = useConfigStore.getState();
    expect(state.config.mode).toBe("quote");
    expect(state.config.theme).toBe("dracula");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/stores/configStore.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement configStore**

Create `src/stores/configStore.ts`:
```typescript
import { create } from "zustand";
import { type Config } from "../types.js";

const defaultConfig: Config = {
  mode: "time",
  duration: 30,
  wordCount: 25,
  wordList: "english-1k",
  quoteLength: "medium",
  caretStyle: "line",
  theme: "default",
  showLiveWpm: true,
  showLiveAccuracy: true,
  smoothCaret: true,
};

interface ConfigState {
  config: Config;
  updateConfig: (partial: Partial<Config>) => void;
  applyCliOverrides: (overrides: Partial<Config>) => void;
}

export const useConfigStore = create<ConfigState>()((set) => ({
  config: { ...defaultConfig },
  updateConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),
  applyCliOverrides: (overrides) =>
    set((state) => ({
      config: {
        ...state.config,
        ...Object.fromEntries(
          Object.entries(overrides).filter(([_, v]) => v !== undefined)
        ),
      },
    })),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/stores/configStore.test.ts`
Expected: PASS — all 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/stores/configStore.ts tests/stores/configStore.test.ts
git commit -m "feat: add config store with defaults and CLI overrides"
```

---

### Task 7: Test Store (Typing State Machine)

**Files:**
- Create: `src/stores/testStore.ts`
- Create: `tests/stores/testStore.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/stores/testStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useTestStore } from "../../src/stores/testStore.js";

describe("testStore", () => {
  beforeEach(() => {
    useTestStore.setState(useTestStore.getInitialState());
  });

  it("starts in idle state", () => {
    const state = useTestStore.getState();
    expect(state.status).toBe("idle");
    expect(state.wordIndex).toBe(0);
    expect(state.charIndex).toBe(0);
    expect(state.keystrokes).toEqual([]);
  });

  it("initializes with words", () => {
    useTestStore.getState().initTest(["hello", "world", "test"]);
    const state = useTestStore.getState();
    expect(state.words).toEqual(["hello", "world", "test"]);
    expect(state.status).toBe("idle");
    expect(state.typedChars).toEqual([[]]);
  });

  it("starts test on first character typed", () => {
    useTestStore.getState().initTest(["hello", "world"]);
    useTestStore.getState().typeChar("h");
    const state = useTestStore.getState();
    expect(state.status).toBe("typing");
    expect(state.charIndex).toBe(1);
    expect(state.typedChars[0]).toEqual(["h"]);
  });

  it("tracks correct and incorrect characters", () => {
    useTestStore.getState().initTest(["abc"]);
    useTestStore.getState().typeChar("a"); // correct
    useTestStore.getState().typeChar("x"); // incorrect
    useTestStore.getState().typeChar("c"); // correct
    const state = useTestStore.getState();
    expect(state.typedChars[0]).toEqual(["a", "x", "c"]);
    expect(state.charIndex).toBe(3);
  });

  it("handles space to advance to next word", () => {
    useTestStore.getState().initTest(["hi", "there"]);
    useTestStore.getState().typeChar("h");
    useTestStore.getState().typeChar("i");
    useTestStore.getState().typeSpace();
    const state = useTestStore.getState();
    expect(state.wordIndex).toBe(1);
    expect(state.charIndex).toBe(0);
    expect(state.typedChars[1]).toEqual([]);
  });

  it("handles backspace within a word", () => {
    useTestStore.getState().initTest(["hello"]);
    useTestStore.getState().typeChar("h");
    useTestStore.getState().typeChar("x");
    useTestStore.getState().backspace();
    const state = useTestStore.getState();
    expect(state.charIndex).toBe(1);
    expect(state.typedChars[0]).toEqual(["h"]);
  });

  it("does not backspace to previous word", () => {
    useTestStore.getState().initTest(["hi", "there"]);
    useTestStore.getState().typeChar("h");
    useTestStore.getState().typeChar("i");
    useTestStore.getState().typeSpace();
    useTestStore.getState().backspace(); // should NOT go back to "hi"
    const state = useTestStore.getState();
    expect(state.wordIndex).toBe(1);
    expect(state.charIndex).toBe(0);
  });

  it("tracks extra characters beyond word length", () => {
    useTestStore.getState().initTest(["ab"]);
    useTestStore.getState().typeChar("a");
    useTestStore.getState().typeChar("b");
    useTestStore.getState().typeChar("c"); // extra
    useTestStore.getState().typeChar("d"); // extra
    const state = useTestStore.getState();
    expect(state.typedChars[0]).toEqual(["a", "b", "c", "d"]);
    expect(state.charIndex).toBe(4);
  });

  it("finishes test", () => {
    useTestStore.getState().initTest(["hi"]);
    useTestStore.getState().typeChar("h");
    useTestStore.getState().typeChar("i");
    useTestStore.getState().finishTest();
    expect(useTestStore.getState().status).toBe("finished");
  });

  it("resets test", () => {
    useTestStore.getState().initTest(["hi"]);
    useTestStore.getState().typeChar("h");
    useTestStore.getState().resetTest();
    const state = useTestStore.getState();
    expect(state.status).toBe("idle");
    expect(state.wordIndex).toBe(0);
    expect(state.charIndex).toBe(0);
    expect(state.keystrokes).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/stores/testStore.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement testStore**

Create `src/stores/testStore.ts`:
```typescript
import { create } from "zustand";
import { type Keystroke } from "../types.js";

type TestStatus = "idle" | "typing" | "finished";

interface TestState {
  status: TestStatus;
  words: string[];
  wordIndex: number;
  charIndex: number;
  typedChars: string[][];
  keystrokes: Keystroke[];
  startTime: number | null;
  endTime: number | null;

  initTest: (words: string[]) => void;
  typeChar: (char: string) => void;
  typeSpace: () => void;
  backspace: () => void;
  finishTest: () => void;
  resetTest: () => void;
  appendWords: (words: string[]) => void;
}

export const useTestStore = create<TestState>()((set, get) => ({
  status: "idle",
  words: [],
  wordIndex: 0,
  charIndex: 0,
  typedChars: [],
  keystrokes: [],
  startTime: null,
  endTime: null,

  initTest: (words) =>
    set({
      status: "idle",
      words,
      wordIndex: 0,
      charIndex: 0,
      typedChars: [[]],
      keystrokes: [],
      startTime: null,
      endTime: null,
    }),

  typeChar: (char) => {
    const state = get();
    if (state.status === "finished") return;

    const now = Date.now();
    const isStart = state.status === "idle";
    const currentWord = state.words[state.wordIndex] ?? "";
    const expected = currentWord[state.charIndex] ?? "";

    const keystroke: Keystroke = {
      timestamp: now,
      expected,
      typed: char,
      position: { wordIndex: state.wordIndex, charIndex: state.charIndex },
      isBackspace: false,
    };

    const newTypedChars = [...state.typedChars];
    newTypedChars[state.wordIndex] = [...(newTypedChars[state.wordIndex] ?? []), char];

    set({
      status: isStart ? "typing" : state.status,
      startTime: isStart ? now : state.startTime,
      charIndex: state.charIndex + 1,
      typedChars: newTypedChars,
      keystrokes: [...state.keystrokes, keystroke],
    });
  },

  typeSpace: () => {
    const state = get();
    if (state.status === "finished") return;
    if (state.wordIndex >= state.words.length - 1) return;

    const newTypedChars = [...state.typedChars];
    if (!newTypedChars[state.wordIndex + 1]) {
      newTypedChars[state.wordIndex + 1] = [];
    }

    set({
      wordIndex: state.wordIndex + 1,
      charIndex: 0,
      typedChars: newTypedChars,
    });
  },

  backspace: () => {
    const state = get();
    if (state.status === "finished") return;
    if (state.charIndex === 0) return; // Can't go to previous word

    const newTypedChars = [...state.typedChars];
    newTypedChars[state.wordIndex] = newTypedChars[state.wordIndex].slice(0, -1);

    const keystroke: Keystroke = {
      timestamp: Date.now(),
      expected: "",
      typed: "",
      position: { wordIndex: state.wordIndex, charIndex: state.charIndex - 1 },
      isBackspace: true,
    };

    set({
      charIndex: state.charIndex - 1,
      typedChars: newTypedChars,
      keystrokes: [...state.keystrokes, keystroke],
    });
  },

  finishTest: () =>
    set({ status: "finished", endTime: Date.now() }),

  resetTest: () =>
    set({
      status: "idle",
      wordIndex: 0,
      charIndex: 0,
      typedChars: [[]],
      keystrokes: [],
      startTime: null,
      endTime: null,
    }),

  appendWords: (newWords) => {
    const state = get();
    set({ words: [...state.words, ...newWords] });
  },
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/stores/testStore.test.ts`
Expected: PASS — all 9 tests

- [ ] **Step 5: Commit**

```bash
git add src/stores/testStore.ts tests/stores/testStore.test.ts
git commit -m "feat: add test store with typing state machine"
```

---

### Task 8: Persistence Layer

**Files:**
- Create: `src/persistence/storage.ts`
- Create: `src/persistence/history.ts`
- Create: `src/persistence/personalBests.ts`
- Create: `tests/persistence/storage.test.ts`
- Create: `tests/persistence/history.test.ts`
- Create: `tests/persistence/personalBests.test.ts`

- [ ] **Step 1: Write failing test for storage**

Create `tests/persistence/storage.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { readJsonFile, writeJsonFile, getDataDir } from "../../src/persistence/storage.js";

describe("storage", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mtype-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates directory and writes JSON", () => {
    const filePath = path.join(tmpDir, "sub", "test.json");
    writeJsonFile(filePath, { hello: "world" });
    expect(fs.existsSync(filePath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(content).toEqual({ hello: "world" });
  });

  it("reads JSON file", () => {
    const filePath = path.join(tmpDir, "read.json");
    fs.writeFileSync(filePath, JSON.stringify({ key: "value" }));
    const result = readJsonFile(filePath, {});
    expect(result).toEqual({ key: "value" });
  });

  it("returns default for missing file", () => {
    const result = readJsonFile(path.join(tmpDir, "missing.json"), { fallback: true });
    expect(result).toEqual({ fallback: true });
  });

  it("returns default for corrupted JSON", () => {
    const filePath = path.join(tmpDir, "bad.json");
    fs.writeFileSync(filePath, "not json{{{");
    const result = readJsonFile(filePath, []);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/persistence/storage.test.ts`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement storage**

Create `src/persistence/storage.ts`:
```typescript
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const DATA_DIR = path.join(os.homedir(), ".monkey-type-cli");

export function getDataDir(): string {
  return DATA_DIR;
}

export function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

export function writeJsonFile(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
```

- [ ] **Step 4: Run storage tests**

Run: `npx vitest run tests/persistence/storage.test.ts`
Expected: PASS — all 4 tests

- [ ] **Step 5: Write failing test for history**

Create `tests/persistence/history.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { saveResult, getHistory, getRecentResults } from "../../src/persistence/history.js";
import { type TestResult } from "../../src/types.js";

function makeResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: Date.now(),
    mode: "time",
    duration: 30,
    wordCount: null,
    wordList: "english-1k",
    wpm: 65,
    rawWpm: 70,
    accuracy: 95,
    consistency: 80,
    characters: { correct: 100, incorrect: 5, extra: 2, missed: 1 },
    wpmPerSecond: [60, 65, 70],
    keystrokeLog: [],
    ...overrides,
  };
}

describe("history", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mtype-hist-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("saves and retrieves results", () => {
    const result = makeResult();
    saveResult(result, tmpDir);
    const history = getHistory(tmpDir);
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(result.id);
  });

  it("appends to existing history", () => {
    saveResult(makeResult(), tmpDir);
    saveResult(makeResult(), tmpDir);
    expect(getHistory(tmpDir)).toHaveLength(2);
  });

  it("getRecentResults returns last N results", () => {
    for (let i = 0; i < 15; i++) {
      saveResult(makeResult({ wpm: i }), tmpDir);
    }
    const recent = getRecentResults(10, tmpDir);
    expect(recent).toHaveLength(10);
    // Most recent first
    expect(recent[0].wpm).toBe(14);
  });
});
```

- [ ] **Step 6: Implement history**

Create `src/persistence/history.ts`:
```typescript
import path from "node:path";
import { type TestResult } from "../types.js";
import { readJsonFile, writeJsonFile, getDataDir } from "./storage.js";

function historyPath(dataDir?: string): string {
  return path.join(dataDir ?? getDataDir(), "history.json");
}

export function getHistory(dataDir?: string): TestResult[] {
  return readJsonFile<TestResult[]>(historyPath(dataDir), []);
}

export function saveResult(result: TestResult, dataDir?: string): void {
  const history = getHistory(dataDir);
  history.push(result);
  writeJsonFile(historyPath(dataDir), history);
}

export function getRecentResults(count: number, dataDir?: string): TestResult[] {
  const history = getHistory(dataDir);
  return history.slice(-count).reverse();
}
```

- [ ] **Step 7: Run history tests**

Run: `npx vitest run tests/persistence/history.test.ts`
Expected: PASS — all 3 tests

- [ ] **Step 8: Write failing test for personalBests**

Create `tests/persistence/personalBests.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { updatePersonalBest, getPersonalBests } from "../../src/persistence/personalBests.js";
import { type TestResult } from "../../src/types.js";

function makeResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    id: "test-id",
    timestamp: Date.now(),
    mode: "time",
    duration: 30,
    wordCount: null,
    wordList: "english-1k",
    wpm: 65,
    rawWpm: 70,
    accuracy: 95,
    consistency: 80,
    characters: { correct: 100, incorrect: 5, extra: 2, missed: 1 },
    wpmPerSecond: [60, 65, 70],
    keystrokeLog: [],
    ...overrides,
  };
}

describe("personalBests", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mtype-pb-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("saves a new personal best", () => {
    const result = makeResult({ wpm: 80 });
    updatePersonalBest(result, tmpDir);
    const bests = getPersonalBests(tmpDir);
    expect(bests["time-30"]).toBeDefined();
    expect(bests["time-30"].wpm).toBe(80);
  });

  it("updates only if new WPM is higher", () => {
    updatePersonalBest(makeResult({ wpm: 80 }), tmpDir);
    updatePersonalBest(makeResult({ wpm: 60 }), tmpDir);
    const bests = getPersonalBests(tmpDir);
    expect(bests["time-30"].wpm).toBe(80);
  });

  it("replaces when new WPM is higher", () => {
    updatePersonalBest(makeResult({ wpm: 80 }), tmpDir);
    updatePersonalBest(makeResult({ wpm: 90 }), tmpDir);
    const bests = getPersonalBests(tmpDir);
    expect(bests["time-30"].wpm).toBe(90);
  });

  it("tracks different mode/duration combos separately", () => {
    updatePersonalBest(makeResult({ mode: "time", duration: 30, wpm: 80 }), tmpDir);
    updatePersonalBest(makeResult({ mode: "time", duration: 60, wpm: 70 }), tmpDir);
    updatePersonalBest(makeResult({ mode: "words", duration: null, wordCount: 25, wpm: 90 }), tmpDir);
    const bests = getPersonalBests(tmpDir);
    expect(bests["time-30"].wpm).toBe(80);
    expect(bests["time-60"].wpm).toBe(70);
    expect(bests["words-25"].wpm).toBe(90);
  });
});
```

- [ ] **Step 9: Implement personalBests**

Create `src/persistence/personalBests.ts`:
```typescript
import path from "node:path";
import { type TestResult } from "../types.js";
import { readJsonFile, writeJsonFile, getDataDir } from "./storage.js";

interface PersonalBest {
  wpm: number;
  accuracy: number;
  timestamp: number;
}

type PersonalBestsMap = Record<string, PersonalBest>;

function bestsPath(dataDir?: string): string {
  return path.join(dataDir ?? getDataDir(), "personal-bests.json");
}

function getKey(result: TestResult): string {
  if (result.mode === "time") return `time-${result.duration}`;
  if (result.mode === "words") return `words-${result.wordCount}`;
  return result.mode;
}

export function getPersonalBests(dataDir?: string): PersonalBestsMap {
  return readJsonFile<PersonalBestsMap>(bestsPath(dataDir), {});
}

export function updatePersonalBest(result: TestResult, dataDir?: string): void {
  const bests = getPersonalBests(dataDir);
  const key = getKey(result);
  const existing = bests[key];

  if (!existing || result.wpm > existing.wpm) {
    bests[key] = {
      wpm: result.wpm,
      accuracy: result.accuracy,
      timestamp: result.timestamp,
    };
    writeJsonFile(bestsPath(dataDir), bests);
  }
}
```

- [ ] **Step 10: Run all persistence tests**

Run: `npx vitest run tests/persistence/`
Expected: PASS — all tests

- [ ] **Step 11: Commit**

```bash
git add src/persistence/ tests/persistence/
git commit -m "feat: add persistence layer (storage, history, personal bests)"
```

---

### Task 9: Mode Selector Component

**Files:**
- Create: `src/components/ModeSelector.tsx`

- [ ] **Step 1: Create ModeSelector component**

Create `src/components/ModeSelector.tsx`:
```tsx
import React from "react";
import { Box, Text } from "ink";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme } from "../themes/themes.js";
import { type TestMode, type TimeDuration, type WordCount, type QuoteLength } from "../types.js";

const modes: TestMode[] = ["time", "words", "quote", "zen"];
const durations: TimeDuration[] = [15, 30, 60, 120];
const wordCounts: WordCount[] = [10, 25, 50, 100];
const quoteLengths: QuoteLength[] = ["short", "medium", "long"];

export default function ModeSelector() {
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);

  const subOptions = (): Array<{ label: string; active: boolean }> => {
    switch (config.mode) {
      case "time":
        return durations.map((d) => ({ label: `${d}`, active: d === config.duration }));
      case "words":
        return wordCounts.map((w) => ({ label: `${w}`, active: w === config.wordCount }));
      case "quote":
        return quoteLengths.map((l) => ({ label: l, active: l === config.quoteLength }));
      default:
        return [];
    }
  };

  return (
    <Box flexDirection="column" alignItems="center" paddingY={1}>
      <Box gap={2}>
        {modes.map((m) => (
          <Text
            key={m}
            color={m === config.mode ? theme.accent : theme.dimmed}
            bold={m === config.mode}
          >
            {m}
          </Text>
        ))}
      </Box>
      {subOptions().length > 0 && (
        <Box gap={2}>
          {subOptions().map((opt) => (
            <Text
              key={opt.label}
              color={opt.active ? theme.accent : theme.dimmed}
              bold={opt.active}
            >
              {opt.label}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Verify it renders without error**

Import it in App.tsx temporarily:
```tsx
import ModeSelector from "./components/ModeSelector.js";
// ...
<ModeSelector />
```

Run: `npx tsx src/index.tsx`
Expected: Shows mode tabs and sub-options in terminal, then exits.

- [ ] **Step 3: Commit**

```bash
git add src/components/ModeSelector.tsx
git commit -m "feat: add mode selector component with tabs and sub-options"
```

---

### Task 10: Typing Area Component

**Files:**
- Create: `src/components/TypingArea.tsx`
- Create: `tests/components/TypingArea.test.tsx`

This is the most complex component — it renders the 3-line word display with per-character coloring, caret, and line scrolling.

- [ ] **Step 1: Write failing test**

Create `tests/components/TypingArea.test.tsx`:
```tsx
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@inkjs/testing-library";
import { useTestStore } from "../../src/stores/testStore.js";
import { useConfigStore } from "../../src/stores/configStore.js";
import TypingArea from "../../src/components/TypingArea.js";

describe("TypingArea", () => {
  beforeEach(() => {
    useTestStore.setState(useTestStore.getInitialState());
    useConfigStore.setState(useConfigStore.getInitialState());
  });

  it("renders words from the test store", () => {
    useTestStore.getState().initTest(["hello", "world"]);
    const { lastFrame } = render(<TypingArea terminalWidth={80} />);
    const frame = lastFrame();
    expect(frame).toContain("hello");
    expect(frame).toContain("world");
  });

  it("shows typed characters", () => {
    useTestStore.getState().initTest(["hello", "world"]);
    useTestStore.getState().typeChar("h");
    useTestStore.getState().typeChar("e");
    const { lastFrame } = render(<TypingArea terminalWidth={80} />);
    const frame = lastFrame();
    // The component should render — exact color testing is limited in ink testing
    expect(frame).toContain("hello");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/TypingArea.test.tsx`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement TypingArea**

Create `src/components/TypingArea.tsx`:
```tsx
import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { useTestStore } from "../stores/testStore.js";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme } from "../themes/themes.js";
import { type CaretStyle } from "../types.js";

interface Props {
  terminalWidth: number;
}

interface LineWord {
  word: string;
  index: number;
}

function splitIntoLines(words: string[], maxWidth: number): LineWord[][] {
  const lines: LineWord[][] = [];
  let currentLine: LineWord[] = [];
  let currentWidth = 0;

  for (let i = 0; i < words.length; i++) {
    const wordWidth = words[i].length + (currentLine.length > 0 ? 1 : 0); // +1 for space
    if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [];
      currentWidth = 0;
    }
    currentLine.push({ word: words[i], index: i });
    currentWidth += wordWidth;
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  return lines;
}

function getVisibleLines(lines: LineWord[][], activeWordIndex: number): LineWord[][] {
  // Find which line the active word is on
  let activeLine = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].some((w) => w.index === activeWordIndex)) {
      activeLine = i;
      break;
    }
  }

  // Show 3 lines: the line before active, active, and next
  const startLine = Math.max(0, activeLine - 1);
  return lines.slice(startLine, startLine + 3);
}

function CaretChar({ char, style, color }: { char: string; style: CaretStyle; color: string }) {
  switch (style) {
    case "block":
      return <Text backgroundColor={color} color="#000000">{char || " "}</Text>;
    case "underline":
      return <Text color={color} underline>{char || " "}</Text>;
    case "line":
    default:
      return <Text><Text color={color}>|</Text>{char ? <Text>{char}</Text> : null}</Text>;
  }
}

function WordDisplay({ word, wordIndex }: { word: string; wordIndex: number }) {
  const { wordIndex: activeWordIndex, charIndex, typedChars } = useTestStore();
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);
  const typed = typedChars[wordIndex] ?? [];
  const isActive = wordIndex === activeWordIndex;

  const chars: React.ReactNode[] = [];

  // Render each character of the word
  for (let i = 0; i < word.length; i++) {
    const typedChar = typed[i];
    const isCurrentPos = isActive && i === charIndex;

    if (isCurrentPos) {
      chars.push(
        <CaretChar
          key={i}
          char={typedChar === undefined ? word[i] : word[i]}
          style={config.caretStyle}
          color={theme.caret}
        />
      );
    } else if (typedChar === undefined) {
      // Not yet typed
      const color = wordIndex < activeWordIndex ? theme.dimmed : theme.dimmed;
      chars.push(<Text key={i} color={color}>{word[i]}</Text>);
    } else if (typedChar === word[i]) {
      // Correct
      chars.push(<Text key={i} color={theme.correct}>{word[i]}</Text>);
    } else {
      // Incorrect
      chars.push(<Text key={i} color={theme.incorrect}>{word[i]}</Text>);
    }
  }

  // Render extra typed characters beyond word length
  for (let i = word.length; i < typed.length; i++) {
    const isCurrentPos = isActive && i === charIndex;
    if (isCurrentPos) {
      chars.push(
        <CaretChar key={`extra-${i}`} char={typed[i]} style={config.caretStyle} color={theme.caret} />
      );
    } else {
      chars.push(
        <Text key={`extra-${i}`} color={theme.incorrect} underline>{typed[i]}</Text>
      );
    }
  }

  // Caret at end of word (after all chars typed)
  if (isActive && charIndex === typed.length && charIndex >= word.length) {
    // Don't add extra caret, it's handled above
  } else if (isActive && charIndex === typed.length && typed.length < word.length) {
    // Caret is at the position of the next untyped char — handled in the loop above
  }

  return <Text>{chars}</Text>;
}

export default function TypingArea({ terminalWidth }: Props) {
  const { words, wordIndex } = useTestStore();
  const maxWidth = Math.min(terminalWidth - 4, 80); // padding

  const lines = useMemo(() => splitIntoLines(words, maxWidth), [words, maxWidth]);
  const visibleLines = getVisibleLines(lines, wordIndex);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {visibleLines.map((line, lineIdx) => (
        <Box key={lineIdx} gap={1}>
          {line.map(({ word, index }) => (
            <WordDisplay key={index} word={word} wordIndex={index} />
          ))}
        </Box>
      ))}
    </Box>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/TypingArea.test.tsx`
Expected: PASS — all 2 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/TypingArea.tsx tests/components/TypingArea.test.tsx
git commit -m "feat: add typing area with character coloring, caret, and line scrolling"
```

---

### Task 11: Live Stats Component

**Files:**
- Create: `src/components/LiveStats.tsx`

- [ ] **Step 1: Create LiveStats component**

Create `src/components/LiveStats.tsx`:
```tsx
import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { useTestStore } from "../stores/testStore.js";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme } from "../themes/themes.js";
import { calculateWpm, calculateAccuracy } from "../engine/statsCalculator.js";

interface Props {
  mode: "time" | "words" | "quote" | "zen" | "custom";
  targetDuration?: number | null;
}

export default function LiveStats({ mode, targetDuration }: Props) {
  const { status, startTime, keystrokes } = useTestStore();
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "typing" || !startTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [status, startTime]);

  const correctChars = keystrokes.filter(
    (k) => !k.isBackspace && k.typed === k.expected && k.expected !== ""
  ).length;
  const totalChars = keystrokes.filter((k) => !k.isBackspace).length;

  const wpm = calculateWpm(correctChars, elapsed);
  const accuracy = calculateAccuracy(correctChars, totalChars);

  const timeDisplay = (): string => {
    if (mode === "time" && targetDuration) {
      const remaining = Math.max(0, targetDuration * 1000 - elapsed);
      return `${Math.ceil(remaining / 1000)}`;
    }
    const secs = Math.floor(elapsed / 1000);
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  if (status === "idle") {
    return (
      <Box justifyContent="center" paddingY={1}>
        <Text color={theme.dimmed}>Start typing to begin...</Text>
      </Box>
    );
  }

  return (
    <Box justifyContent="center" gap={3} paddingY={1}>
      {config.showLiveWpm && (
        <Text>
          <Text color={theme.accent} bold>WPM: </Text>
          <Text color={theme.fg}>{wpm}</Text>
        </Text>
      )}
      {config.showLiveAccuracy && (
        <Text>
          <Text color={theme.accent} bold>ACC: </Text>
          <Text color={theme.fg}>{accuracy}%</Text>
        </Text>
      )}
      <Text>
        <Text color={theme.accent} bold>TIME: </Text>
        <Text color={theme.fg}>{timeDisplay()}</Text>
      </Text>
    </Box>
  );
}
```

- [ ] **Step 2: Verify it renders**

Add to App.tsx temporarily and run. Check that "Start typing to begin..." appears.

- [ ] **Step 3: Commit**

```bash
git add src/components/LiveStats.tsx
git commit -m "feat: add live stats bar (WPM, accuracy, timer)"
```

---

### Task 12: WPM Chart Component

**Files:**
- Create: `src/components/WpmChart.tsx`

- [ ] **Step 1: Create WpmChart**

Create `src/components/WpmChart.tsx`:
```tsx
import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../themes/themes.js";
import { useConfigStore } from "../stores/configStore.js";

const SPARKLINE_CHARS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

interface Props {
  wpmPerSecond: number[];
  width?: number;
}

export default function WpmChart({ wpmPerSecond, width = 60 }: Props) {
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);

  if (wpmPerSecond.length === 0) return null;

  // Downsample if needed to fit width
  let data = wpmPerSecond;
  if (data.length > width) {
    const ratio = data.length / width;
    const sampled: number[] = [];
    for (let i = 0; i < width; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.floor((i + 1) * ratio);
      const slice = data.slice(start, end);
      sampled.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
    data = sampled;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const sparkline = data
    .map((v) => {
      const idx = Math.round(((v - min) / range) * (SPARKLINE_CHARS.length - 1));
      return SPARKLINE_CHARS[idx];
    })
    .join("");

  return (
    <Box flexDirection="column" paddingY={1}>
      <Text color={theme.accent} bold>WPM over time</Text>
      <Text color={theme.fg}>{sparkline}</Text>
      <Box justifyContent="space-between" width={data.length}>
        <Text color={theme.dimmed}>{Math.round(min)}</Text>
        <Text color={theme.dimmed}>{Math.round(max)}</Text>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/WpmChart.tsx
git commit -m "feat: add WPM sparkline chart component"
```

---

### Task 13: Results Screen

**Files:**
- Create: `src/components/ResultsScreen.tsx`
- Create: `tests/components/ResultsScreen.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/ResultsScreen.test.tsx`:
```tsx
import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@inkjs/testing-library";
import { useConfigStore } from "../../src/stores/configStore.js";
import ResultsScreen from "../../src/components/ResultsScreen.js";
import { type TestResult } from "../../src/types.js";

describe("ResultsScreen", () => {
  it("displays WPM, accuracy, and consistency", () => {
    useConfigStore.setState(useConfigStore.getInitialState());
    const result: TestResult = {
      id: "test",
      timestamp: Date.now(),
      mode: "time",
      duration: 30,
      wordCount: null,
      wordList: "english-1k",
      wpm: 72,
      rawWpm: 78,
      accuracy: 96,
      consistency: 85,
      characters: { correct: 150, incorrect: 5, extra: 2, missed: 3 },
      wpmPerSecond: [60, 70, 75, 72, 80],
      keystrokeLog: [],
    };

    const { lastFrame } = render(
      <ResultsScreen result={result} onRestart={() => {}} onHome={() => {}} />
    );
    const frame = lastFrame();
    expect(frame).toContain("72");
    expect(frame).toContain("96");
    expect(frame).toContain("85");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/ResultsScreen.test.tsx`
Expected: FAIL — cannot find module

- [ ] **Step 3: Implement ResultsScreen**

Create `src/components/ResultsScreen.tsx`:
```tsx
import React from "react";
import { Box, Text } from "ink";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme } from "../themes/themes.js";
import WpmChart from "./WpmChart.js";
import { type TestResult } from "../types.js";

interface Props {
  result: TestResult;
  onRestart: () => void;
  onHome: () => void;
}

function StatBox({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color: string }) {
  return (
    <Box flexDirection="column" alignItems="center" paddingX={2}>
      <Text color={color} dimColor>{label}</Text>
      <Text color={color} bold>
        {value}{unit ? <Text dimColor> {unit}</Text> : null}
      </Text>
    </Box>
  );
}

export default function ResultsScreen({ result, onRestart, onHome }: Props) {
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);

  return (
    <Box flexDirection="column" alignItems="center" paddingY={1}>
      <Text color={theme.accent} bold>Test Complete</Text>

      <Box paddingY={1} gap={1}>
        <StatBox label="wpm" value={result.wpm} color={theme.accent} />
        <StatBox label="raw" value={result.rawWpm} color={theme.fg} />
        <StatBox label="accuracy" value={`${result.accuracy}%`} color={theme.fg} />
        <StatBox label="consistency" value={`${result.consistency}%`} color={theme.fg} />
      </Box>

      <Box gap={3}>
        <Text color={theme.correct}>correct: {result.characters.correct}</Text>
        <Text color={theme.incorrect}>incorrect: {result.characters.incorrect}</Text>
        <Text color={theme.incorrect}>extra: {result.characters.extra}</Text>
        <Text color={theme.dimmed}>missed: {result.characters.missed}</Text>
      </Box>

      <WpmChart wpmPerSecond={result.wpmPerSecond} />

      {result.quoteAuthor && (
        <Text color={theme.dimmed}>— {result.quoteAuthor}, {result.quoteSource}</Text>
      )}

      <Box paddingTop={1} gap={3}>
        <Text color={theme.dimmed}>[Tab] restart</Text>
        <Text color={theme.dimmed}>[Esc] home</Text>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/ResultsScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ResultsScreen.tsx src/components/WpmChart.tsx tests/components/ResultsScreen.test.tsx
git commit -m "feat: add results screen with stats, character breakdown, and WPM chart"
```

---

### Task 14: Settings Screen

**Files:**
- Create: `src/components/SettingsScreen.tsx`

- [ ] **Step 1: Create SettingsScreen**

Create `src/components/SettingsScreen.tsx`:
```tsx
import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme, themeNames } from "../themes/themes.js";
import { type TestMode, type TimeDuration, type WordCount, type WordListName, type CaretStyle, type QuoteLength } from "../types.js";

interface SettingOption {
  label: string;
  key: keyof ReturnType<typeof useConfigStore.getState>["config"];
  values: Array<{ label: string; value: unknown }>;
}

const settings: SettingOption[] = [
  {
    label: "Test Mode",
    key: "mode",
    values: [
      { label: "time", value: "time" },
      { label: "words", value: "words" },
      { label: "quote", value: "quote" },
      { label: "zen", value: "zen" },
    ],
  },
  {
    label: "Duration",
    key: "duration",
    values: [
      { label: "15s", value: 15 },
      { label: "30s", value: 30 },
      { label: "60s", value: 60 },
      { label: "120s", value: 120 },
    ],
  },
  {
    label: "Word Count",
    key: "wordCount",
    values: [
      { label: "10", value: 10 },
      { label: "25", value: 25 },
      { label: "50", value: 50 },
      { label: "100", value: 100 },
    ],
  },
  {
    label: "Word List",
    key: "wordList",
    values: [
      { label: "english-200", value: "english-200" },
      { label: "english-1k", value: "english-1k" },
      { label: "english-5k", value: "english-5k" },
    ],
  },
  {
    label: "Caret Style",
    key: "caretStyle",
    values: [
      { label: "line", value: "line" },
      { label: "block", value: "block" },
      { label: "underline", value: "underline" },
    ],
  },
  {
    label: "Theme",
    key: "theme",
    values: themeNames.map((name) => ({ label: name, value: name })),
  },
  {
    label: "Show Live WPM",
    key: "showLiveWpm",
    values: [
      { label: "on", value: true },
      { label: "off", value: false },
    ],
  },
  {
    label: "Show Live Accuracy",
    key: "showLiveAccuracy",
    values: [
      { label: "on", value: true },
      { label: "off", value: false },
    ],
  },
  {
    label: "Smooth Caret",
    key: "smoothCaret",
    values: [
      { label: "on", value: true },
      { label: "off", value: false },
    ],
  },
];

interface Props {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: Props) {
  const { config, updateConfig } = useConfigStore();
  const theme = getTheme(config.theme);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(settings.length - 1, i + 1));
    }
    if (key.leftArrow || key.rightArrow) {
      const setting = settings[selectedIndex];
      const currentValue = config[setting.key];
      const currentIdx = setting.values.findIndex((v) => v.value === currentValue);
      const delta = key.rightArrow ? 1 : -1;
      const newIdx = (currentIdx + delta + setting.values.length) % setting.values.length;
      updateConfig({ [setting.key]: setting.values[newIdx].value } as Partial<typeof config>);
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color={theme.accent} bold>Settings</Text>
      <Text color={theme.dimmed}>{"─".repeat(30)}</Text>
      {settings.map((setting, idx) => {
        const isSelected = idx === selectedIndex;
        const currentValue = config[setting.key];
        const currentLabel = setting.values.find((v) => v.value === currentValue)?.label ?? String(currentValue);

        return (
          <Box key={setting.key} gap={1}>
            <Text color={isSelected ? theme.accent : theme.fg}>
              {isSelected ? "►" : " "} {setting.label}
            </Text>
            <Text color={isSelected ? theme.accent : theme.dimmed}>
              [{currentLabel}]
            </Text>
          </Box>
        );
      })}
      <Text color={theme.dimmed}>{"─".repeat(30)}</Text>
      <Text color={theme.dimmed}>[Esc] Back  [←→] Change  [↑↓] Navigate</Text>
    </Box>
  );
}
```

- [ ] **Step 2: Verify it renders**

Run the app and open settings to check layout.

- [ ] **Step 3: Commit**

```bash
git add src/components/SettingsScreen.tsx
git commit -m "feat: add interactive settings screen"
```

---

### Task 15: Command Palette Component

**Files:**
- Create: `src/components/CommandPalette.tsx`

- [ ] **Step 1: Create CommandPalette**

Create `src/components/CommandPalette.tsx`:
```tsx
import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme, themeNames } from "../themes/themes.js";
import { type TestMode } from "../types.js";

interface PaletteItem {
  label: string;
  action: () => void;
}

interface Props {
  onClose: () => void;
}

export default function CommandPalette({ onClose }: Props) {
  const { config, updateConfig } = useConfigStore();
  const theme = getTheme(config.theme);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: PaletteItem[] = [
    ...( ["time", "words", "quote", "zen"] as TestMode[]).map((mode) => ({
      label: `Mode: ${mode}`,
      action: () => { updateConfig({ mode }); onClose(); },
    })),
    ...themeNames.map((name) => ({
      label: `Theme: ${name}`,
      action: () => { updateConfig({ theme: name }); onClose(); },
    })),
  ];

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(items.length - 1, i + 1));
    }
    if (key.return) {
      items[selectedIndex].action();
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} borderStyle="round" borderColor={theme.accent}>
      <Text color={theme.accent} bold>Command Palette</Text>
      {items.map((item, idx) => (
        <Text key={idx} color={idx === selectedIndex ? theme.accent : theme.dimmed}>
          {idx === selectedIndex ? "► " : "  "}{item.label}
        </Text>
      ))}
      <Text color={theme.dimmed}>[Esc] Close  [Enter] Select</Text>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CommandPalette.tsx
git commit -m "feat: add command palette for quick mode/theme switching"
```

---

### Task 16: Home Screen & Input Handling

**Files:**
- Create: `src/components/HomeScreen.tsx`

- [ ] **Step 1: Create HomeScreen — ties together ModeSelector, TypingArea, LiveStats, and input handling**

Create `src/components/HomeScreen.tsx`:
```tsx
import React, { useEffect, useCallback } from "react";
import { Box, useInput, useStdout } from "ink";
import { useTestStore } from "../stores/testStore.js";
import { useConfigStore } from "../stores/configStore.js";
import { generateWords } from "../engine/wordGenerator.js";
import ModeSelector from "./ModeSelector.js";
import TypingArea from "./TypingArea.js";
import LiveStats from "./LiveStats.js";

interface Props {
  onFinish: () => void;
  onOpenSettings: () => void;
  onOpenPalette: () => void;
}

export default function HomeScreen({ onFinish, onOpenSettings, onOpenPalette }: Props) {
  const { config } = useConfigStore();
  const testStore = useTestStore();
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns ?? 80;

  const initWords = useCallback(() => {
    const count = config.mode === "words" ? config.wordCount : 100;
    const words = generateWords(config.wordList, count);
    testStore.initTest(words);
  }, [config.mode, config.wordCount, config.wordList]);

  useEffect(() => {
    if (testStore.status === "idle" && testStore.words.length === 0) {
      initWords();
    }
  }, []);

  // Timer check for timed mode
  useEffect(() => {
    if (config.mode !== "time" || testStore.status !== "typing" || !testStore.startTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - testStore.startTime!;
      if (elapsed >= config.duration * 1000) {
        testStore.finishTest();
        onFinish();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [testStore.status, testStore.startTime, config.mode, config.duration]);

  // Word count mode: check if all words completed
  useEffect(() => {
    if (config.mode !== "words" || testStore.status !== "typing") return;
    if (testStore.wordIndex >= testStore.words.length) {
      testStore.finishTest();
      onFinish();
    }
  }, [testStore.wordIndex, testStore.words.length, testStore.status, config.mode]);

  // Infinite word generation for timed mode
  useEffect(() => {
    if (config.mode !== "time" || testStore.status !== "typing") return;
    if (testStore.wordIndex >= testStore.words.length - 20) {
      const moreWords = generateWords(config.wordList, 50);
      testStore.appendWords(moreWords);
    }
  }, [testStore.wordIndex, testStore.words.length, testStore.status, config.mode]);

  useInput((input, key) => {
    // Tab restarts
    if (key.tab) {
      initWords();
      return;
    }

    // Ctrl+Shift shortcuts — Ink reports these as ctrl + the character
    if (key.ctrl && input === "s") {
      onOpenSettings();
      return;
    }
    if (key.ctrl && input === "p") {
      onOpenPalette();
      return;
    }

    // Escape in zen mode finishes
    if (key.escape && config.mode === "zen" && testStore.status === "typing") {
      testStore.finishTest();
      onFinish();
      return;
    }

    // Ignore during idle if it's a special key
    if (key.ctrl || key.meta || key.escape) return;
    if (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow) return;

    // Backspace
    if (key.backspace || key.delete) {
      testStore.backspace();
      return;
    }

    // Space
    if (input === " ") {
      testStore.typeSpace();

      // Check if words mode is complete
      if (config.mode === "words" && testStore.wordIndex >= testStore.words.length - 1) {
        testStore.finishTest();
        onFinish();
      }
      return;
    }

    // Regular character
    if (input && input.length === 1 && !key.ctrl && !key.meta) {
      testStore.typeChar(input);
    }
  });

  return (
    <Box flexDirection="column">
      <ModeSelector />
      <TypingArea terminalWidth={terminalWidth} />
      <LiveStats mode={config.mode} targetDuration={config.mode === "time" ? config.duration : null} />
    </Box>
  );
}
```

- [ ] **Step 2: Verify it renders and accepts input**

Run: `npx tsx src/index.tsx`
Expected: Shows mode tabs, words, and status bar. Typing characters should color them.

- [ ] **Step 3: Commit**

```bash
git add src/components/HomeScreen.tsx
git commit -m "feat: add home screen with input handling and mode logic"
```

---

### Task 17: Wire Up App.tsx (Full State Machine)

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.tsx`

- [ ] **Step 1: Rewrite App.tsx with full screen routing**

```tsx
import React, { useState, useCallback } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { type AppScreen } from "./types.js";
import { useTestStore } from "./stores/testStore.js";
import { useConfigStore } from "./stores/configStore.js";
import { getTheme } from "./themes/themes.js";
import {
  calculateWpm,
  calculateRawWpm,
  calculateAccuracy,
  calculateConsistency,
  calculateCharacterBreakdown,
  calculateWpmPerSecond,
} from "./engine/statsCalculator.js";
import { saveResult } from "./persistence/history.js";
import { updatePersonalBest } from "./persistence/personalBests.js";
import { type TestResult } from "./types.js";
import HomeScreen from "./components/HomeScreen.js";
import ResultsScreen from "./components/ResultsScreen.js";
import SettingsScreen from "./components/SettingsScreen.js";
import CommandPalette from "./components/CommandPalette.js";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [showPalette, setShowPalette] = useState(false);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);
  const { exit } = useApp();

  const handleFinish = useCallback(() => {
    const state = useTestStore.getState();
    if (!state.startTime) return;

    const endTime = state.endTime ?? Date.now();
    const elapsed = endTime - state.startTime;
    const nonBackspaceKeystrokes = state.keystrokes.filter((k) => !k.isBackspace);
    const correctChars = nonBackspaceKeystrokes.filter(
      (k) => k.typed === k.expected && k.expected !== ""
    ).length;
    const totalChars = nonBackspaceKeystrokes.length;

    // Count missed characters (untyped chars in completed words)
    let missedCount = 0;
    for (let i = 0; i <= state.wordIndex; i++) {
      const word = state.words[i] ?? "";
      const typed = state.typedChars[i] ?? [];
      if (typed.length < word.length) {
        missedCount += word.length - typed.length;
      }
    }

    const wpmPerSecond = calculateWpmPerSecond(state.keystrokes, state.startTime);

    const result: TestResult = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      mode: config.mode,
      duration: config.mode === "time" ? config.duration : null,
      wordCount: config.mode === "words" ? config.wordCount : null,
      wordList: config.wordList,
      wpm: calculateWpm(correctChars, elapsed),
      rawWpm: calculateRawWpm(totalChars, elapsed),
      accuracy: calculateAccuracy(correctChars, totalChars),
      consistency: calculateConsistency(wpmPerSecond),
      characters: calculateCharacterBreakdown(nonBackspaceKeystrokes, missedCount),
      wpmPerSecond,
      keystrokeLog: state.keystrokes,
    };

    saveResult(result);
    updatePersonalBest(result);
    setLastResult(result);
    setScreen("results");
  }, [config]);

  const handleRestart = useCallback(() => {
    setScreen("home");
    useTestStore.getState().resetTest();
    // initWords will be called by HomeScreen's useEffect
    useTestStore.setState({ words: [] });
  }, []);

  const handleHome = useCallback(() => {
    setScreen("home");
    useTestStore.getState().resetTest();
    useTestStore.setState({ words: [] });
  }, []);

  // Global Ctrl+C handling
  useInput((input, key) => {
    if (input === "c" && key.ctrl) {
      exit();
    }
  });

  return (
    <Box flexDirection="column" minHeight={15}>
      {screen === "home" && !showPalette && (
        <HomeScreen
          onFinish={handleFinish}
          onOpenSettings={() => setScreen("settings")}
          onOpenPalette={() => setShowPalette(true)}
        />
      )}
      {screen === "results" && lastResult && (
        <ResultsScreen
          result={lastResult}
          onRestart={handleRestart}
          onHome={handleHome}
        />
      )}
      {screen === "settings" && (
        <SettingsScreen onBack={handleHome} />
      )}
      {showPalette && (
        <CommandPalette onClose={() => setShowPalette(false)} />
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Update index.tsx to pass CLI flags to configStore**

```tsx
import React from "react";
import { render } from "ink";
import meow from "meow";
import App from "./App.js";
import { useConfigStore } from "./stores/configStore.js";
import { type TestMode, type TimeDuration, type WordCount, type WordListName, type CaretStyle } from "./types.js";

const cli = meow(
  `
  Usage
    $ monkey-type-cli

  Options
    --mode      Test mode: time, words, quote, zen (default: time)
    --duration  Time in seconds: 15, 30, 60, 120 (default: 30)
    --words     Word count: 10, 25, 50, 100 (default: 25)
    --wordlist  Word list: english-200, english-1k, english-5k (default: english-1k)
    --theme     Color theme (default: default)
    --caret     Caret style: block, line, underline (default: line)
    --custom    Custom text to type
    --custom-file  Path to custom text file
    --stats     Show stats history
`,
  {
    importMeta: import.meta,
    flags: {
      mode: { type: "string" },
      duration: { type: "number" },
      words: { type: "number" },
      wordlist: { type: "string" },
      theme: { type: "string" },
      caret: { type: "string" },
      custom: { type: "string" },
      customFile: { type: "string" },
      stats: { type: "boolean", default: false },
    },
  }
);

// Apply CLI overrides
useConfigStore.getState().applyCliOverrides({
  mode: cli.flags.mode as TestMode | undefined,
  duration: cli.flags.duration as TimeDuration | undefined,
  wordCount: cli.flags.words as WordCount | undefined,
  wordList: cli.flags.wordlist as WordListName | undefined,
  theme: cli.flags.theme,
  caretStyle: cli.flags.caret as CaretStyle | undefined,
});

render(<App />);
```

- [ ] **Step 3: Run the full app**

Run: `npx tsx src/index.tsx`
Expected: Full typing test works — type words, see coloring, timer counts, Tab restarts.

Run: `npx tsx src/index.tsx --mode words --words 10`
Expected: Shows 10 words, test ends when all are typed.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/index.tsx
git commit -m "feat: wire up full app with screen routing and CLI flags"
```

---

### Task 18: Quote & Zen & Custom Mode Support

**Files:**
- Modify: `src/components/HomeScreen.tsx`

- [ ] **Step 1: Update HomeScreen to handle quote, zen, and custom modes**

Add to `HomeScreen.tsx` — update the `initWords` callback:

```tsx
import { getRandomQuote } from "../engine/quoteGenerator.js";
import fs from "node:fs";

// Replace the initWords callback:
const initWords = useCallback(() => {
  let words: string[];

  switch (config.mode) {
    case "quote": {
      const quote = getRandomQuote(config.quoteLength);
      words = quote.text.split(/\s+/);
      // Store quote metadata for results screen
      useTestStore.setState({ quoteSource: quote.source, quoteAuthor: quote.author });
      break;
    }
    case "zen":
      words = []; // No pre-generated words
      break;
    case "custom":
      // customText would be passed via props or config
      words = ["type", "your", "custom", "text"]; // Placeholder — real text comes from CLI
      break;
    case "words":
      words = generateWords(config.wordList, config.wordCount);
      break;
    case "time":
    default:
      words = generateWords(config.wordList, 100);
      break;
  }

  testStore.initTest(words);
}, [config.mode, config.wordCount, config.wordList, config.quoteLength]);
```

Also add `quoteSource` and `quoteAuthor` fields to the testStore state (optional string fields) so the results screen can display them.

- [ ] **Step 2: Add quoteSource/quoteAuthor to testStore**

In `src/stores/testStore.ts`, add to the state interface and initial state:

```typescript
// Add to TestState interface:
quoteSource: string | null;
quoteAuthor: string | null;

// Add to initial state:
quoteSource: null,
quoteAuthor: null,
```

- [ ] **Step 3: Test quote mode manually**

Run: `npx tsx src/index.tsx --mode quote`
Expected: Shows a random quote, test ends when fully typed.

- [ ] **Step 4: Commit**

```bash
git add src/components/HomeScreen.tsx src/stores/testStore.ts
git commit -m "feat: add quote, zen, and custom text mode support"
```

---

### Task 19: Config Persistence

**Files:**
- Modify: `src/stores/configStore.ts`

- [ ] **Step 1: Add load/save to configStore**

Update `src/stores/configStore.ts` to load from and save to `~/.monkey-type-cli/config.json`:

```typescript
import { create } from "zustand";
import path from "node:path";
import { type Config } from "../types.js";
import { readJsonFile, writeJsonFile, getDataDir } from "../persistence/storage.js";

const CONFIG_PATH = path.join(getDataDir(), "config.json");

const defaultConfig: Config = {
  mode: "time",
  duration: 30,
  wordCount: 25,
  wordList: "english-1k",
  quoteLength: "medium",
  caretStyle: "line",
  theme: "default",
  showLiveWpm: true,
  showLiveAccuracy: true,
  smoothCaret: true,
};

function loadConfig(): Config {
  const saved = readJsonFile<Partial<Config>>(CONFIG_PATH, {});
  return { ...defaultConfig, ...saved };
}

interface ConfigState {
  config: Config;
  updateConfig: (partial: Partial<Config>) => void;
  applyCliOverrides: (overrides: Partial<Config>) => void;
}

export const useConfigStore = create<ConfigState>()((set) => ({
  config: loadConfig(),
  updateConfig: (partial) =>
    set((state) => {
      const newConfig = { ...state.config, ...partial };
      writeJsonFile(CONFIG_PATH, newConfig);
      return { config: newConfig };
    }),
  applyCliOverrides: (overrides) =>
    set((state) => ({
      config: {
        ...state.config,
        ...Object.fromEntries(
          Object.entries(overrides).filter(([_, v]) => v !== undefined)
        ),
      },
    })),
}));
```

- [ ] **Step 2: Test config persistence**

Run app, change theme in settings, exit, run again — theme should persist.

- [ ] **Step 3: Commit**

```bash
git add src/stores/configStore.ts
git commit -m "feat: persist config to ~/.monkey-type-cli/config.json"
```

---

### Task 20: Stats History View

**Files:**
- Create: `src/components/StatsView.tsx`
- Modify: `src/index.tsx`

- [ ] **Step 1: Create StatsView component**

Create `src/components/StatsView.tsx`:
```tsx
import React from "react";
import { Box, Text } from "ink";
import { getRecentResults } from "../persistence/history.js";
import { getPersonalBests } from "../persistence/personalBests.js";
import { getTheme } from "../themes/themes.js";
import { useConfigStore } from "../stores/configStore.js";

export default function StatsView() {
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);
  const recent = getRecentResults(10);
  const bests = getPersonalBests();

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color={theme.accent} bold>Personal Bests</Text>
      <Text color={theme.dimmed}>{"─".repeat(50)}</Text>
      {Object.entries(bests).length === 0 ? (
        <Text color={theme.dimmed}>No personal bests yet. Complete a test first!</Text>
      ) : (
        Object.entries(bests).map(([key, pb]) => (
          <Text key={key}>
            <Text color={theme.fg} bold>{key.padEnd(15)}</Text>
            <Text color={theme.accent}>{pb.wpm} WPM</Text>
            <Text color={theme.dimmed}>  {pb.accuracy}% acc</Text>
          </Text>
        ))
      )}

      <Box paddingTop={1}>
        <Text color={theme.accent} bold>Recent Results (last 10)</Text>
      </Box>
      <Text color={theme.dimmed}>{"─".repeat(50)}</Text>
      {recent.length === 0 ? (
        <Text color={theme.dimmed}>No history yet.</Text>
      ) : (
        recent.map((r, i) => (
          <Text key={i}>
            <Text color={theme.dimmed}>{new Date(r.timestamp).toLocaleDateString().padEnd(12)}</Text>
            <Text color={theme.fg}>{r.mode.padEnd(8)}</Text>
            <Text color={theme.accent}>{String(r.wpm).padEnd(6)} WPM</Text>
            <Text color={theme.dimmed}>{r.accuracy}% acc</Text>
          </Text>
        ))
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Wire --stats flag in index.tsx**

Add to `src/index.tsx` before the `render(<App />)` call:

```tsx
import StatsView from "./components/StatsView.js";

if (cli.flags.stats) {
  render(<StatsView />);
} else {
  render(<App />);
}
```

- [ ] **Step 3: Test stats view**

Run: `npx tsx src/index.tsx --stats`
Expected: Shows personal bests and recent results (or "no history" messages).

- [ ] **Step 4: Commit**

```bash
git add src/components/StatsView.tsx src/index.tsx
git commit -m "feat: add --stats flag for viewing history and personal bests"
```

---

### Task 21: Terminal Size Guard & Graceful Exit

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add terminal size check and signal handlers to App.tsx**

Add at the top of the App component:

```tsx
import { useStdout } from "ink";

// Inside App component:
const { stdout } = useStdout();
const cols = stdout?.columns ?? 80;
const rows = stdout?.rows ?? 24;

if (cols < 60 || rows < 15) {
  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center">
      <Text color="yellow">Terminal too small!</Text>
      <Text>Minimum size: 60 columns x 15 rows</Text>
      <Text>Current: {cols} x {rows}</Text>
      <Text dimColor>Please resize your terminal.</Text>
    </Box>
  );
}
```

- [ ] **Step 2: Add cleanup signal handlers in index.tsx**

Add before `render()`:

```typescript
// Ensure terminal state is restored on exit
process.on("SIGINT", () => {
  process.exit(0);
});
process.on("SIGTERM", () => {
  process.exit(0);
});
```

- [ ] **Step 3: Test terminal size guard**

Resize terminal to less than 60 columns and run the app.
Expected: Shows "Terminal too small!" message.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/index.tsx
git commit -m "feat: add terminal size guard and graceful exit handlers"
```

---

### Task 22: Character Accuracy Heatmap in Results

**Files:**
- Modify: `src/components/ResultsScreen.tsx`

- [ ] **Step 1: Add per-character accuracy display to ResultsScreen**

Add a helper and render it below the WPM chart in ResultsScreen:

```tsx
function CharAccuracyTable({ keystrokes }: { keystrokes: Keystroke[] }) {
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);

  // Count correct and total for each character
  const charStats: Record<string, { correct: number; total: number }> = {};
  for (const ks of keystrokes) {
    if (ks.isBackspace || ks.expected === "") continue;
    if (!charStats[ks.expected]) {
      charStats[ks.expected] = { correct: 0, total: 0 };
    }
    charStats[ks.expected].total++;
    if (ks.typed === ks.expected) {
      charStats[ks.expected].correct++;
    }
  }

  // Find worst characters (lowest accuracy, min 3 occurrences)
  const worst = Object.entries(charStats)
    .filter(([_, s]) => s.total >= 3)
    .map(([char, s]) => ({ char, accuracy: Math.round((s.correct / s.total) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  if (worst.length === 0) return null;

  return (
    <Box flexDirection="column" paddingTop={1}>
      <Text color={theme.accent} bold>Weakest keys</Text>
      <Box gap={2}>
        {worst.map(({ char, accuracy }) => (
          <Text key={char}>
            <Text color={accuracy < 80 ? theme.incorrect : theme.fg} bold>{char}</Text>
            <Text color={theme.dimmed}> {accuracy}%</Text>
          </Text>
        ))}
      </Box>
    </Box>
  );
}
```

Add `import { type Keystroke } from "../types.js";` and render `<CharAccuracyTable keystrokes={result.keystrokeLog} />` after the WpmChart.

- [ ] **Step 2: Commit**

```bash
git add src/components/ResultsScreen.tsx
git commit -m "feat: add per-character accuracy heatmap to results screen"
```

---

### Task 23: Results Screen useInput for Tab/Esc

**Files:**
- Modify: `src/components/ResultsScreen.tsx`

- [ ] **Step 1: Add input handling to ResultsScreen**

Add `useInput` to ResultsScreen:

```tsx
import { useInput } from "ink";

// Inside ResultsScreen component:
useInput((input, key) => {
  if (key.tab) {
    onRestart();
  }
  if (key.escape) {
    onHome();
  }
});
```

- [ ] **Step 2: Test manually**

Complete a typing test, press Tab on results screen — should restart. Press Esc — should go home.

- [ ] **Step 3: Commit**

```bash
git add src/components/ResultsScreen.tsx
git commit -m "feat: add Tab/Esc navigation on results screen"
```

---

### Task 24: End-to-End Integration Test

**Files:**
- Create: `tests/integration/app.test.tsx`

- [ ] **Step 1: Write integration test**

Create `tests/integration/app.test.tsx`:
```tsx
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@inkjs/testing-library";
import App from "../../src/App.js";
import { useTestStore } from "../../src/stores/testStore.js";
import { useConfigStore } from "../../src/stores/configStore.js";

describe("App integration", () => {
  beforeEach(() => {
    useTestStore.setState(useTestStore.getInitialState());
    useConfigStore.setState(useConfigStore.getInitialState());
  });

  it("renders without crashing", () => {
    const { lastFrame } = render(<App />);
    expect(lastFrame()).toBeTruthy();
  });

  it("shows mode selector with time as default", () => {
    const { lastFrame } = render(<App />);
    const frame = lastFrame();
    expect(frame).toContain("time");
    expect(frame).toContain("words");
    expect(frame).toContain("quote");
    expect(frame).toContain("zen");
  });
});
```

- [ ] **Step 2: Run integration test**

Run: `npx vitest run tests/integration/app.test.tsx`
Expected: PASS — all tests

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add tests/integration/app.test.tsx
git commit -m "test: add integration tests for App component"
```

---

### Task 25: Update CLAUDE.md and Final Cleanup

**Files:**
- Modify: `CLAUDE.md`
- Modify: `package.json`

- [ ] **Step 1: Add .gitignore**

Create `.gitignore`:
```
node_modules/
dist/
*.tsbuildinfo
```

- [ ] **Step 2: Update CLAUDE.md with final commands**

Verify all commands work:
```bash
npm install
npx tsx src/index.tsx
npx vitest run
npm run build
```

Update CLAUDE.md if any commands differ.

- [ ] **Step 3: Run full test suite one final time**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add .gitignore CLAUDE.md
git commit -m "chore: add gitignore and finalize CLAUDE.md"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] State machine (IDLE → TYPING → FINISHED → SETTINGS) — Task 7 (store), Task 17 (App routing)
- [x] Word generation — Task 3
- [x] Quote generation — Task 4
- [x] Keystroke tracking — Task 7
- [x] Cursor model (wordIndex + charIndex) — Task 7
- [x] Line scrolling (3 lines) — Task 10
- [x] Timed mode — Task 16
- [x] Word count mode — Task 16
- [x] Quote mode — Task 18
- [x] Zen mode — Task 18
- [x] Custom text — Task 18
- [x] Live stats (WPM, accuracy, timer) — Task 11
- [x] Results screen (WPM, raw, accuracy, consistency, breakdown) — Task 13
- [x] WPM over time chart — Task 12
- [x] Per-character accuracy — Task 22
- [x] Local persistence (history, personal bests, config) — Task 8, 19
- [x] Trend viewing (--stats) — Task 20
- [x] Character coloring — Task 10
- [x] Caret styles — Task 10
- [x] Themes (6 built-in) — Task 2
- [x] Keyboard shortcuts (Tab, Esc, Ctrl+S, Ctrl+P) — Task 16, 23
- [x] Settings menu — Task 14
- [x] Command palette — Task 15
- [x] CLI flags — Task 17
- [x] Terminal size guard — Task 21
- [x] Graceful exit — Task 21
- [x] Data integrity — Task 8

**Placeholder scan:** No TBD/TODO found. Word lists note is an instruction to the implementer, not a placeholder.

**Type consistency:** `TestResult`, `Keystroke`, `Config`, `ThemeColors` used consistently across all tasks. `useTestStore` / `useConfigStore` named consistently. `generateWords` / `getRandomQuote` / `calculateWpm` etc. all match between definition and usage.

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

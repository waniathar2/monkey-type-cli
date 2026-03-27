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
  quoteSource: string | null;
  quoteAuthor: string | null;

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
  quoteSource: null,
  quoteAuthor: null,

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
      quoteSource: null,
      quoteAuthor: null,
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
    if (state.charIndex === 0) return;

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
      quoteSource: null,
      quoteAuthor: null,
    }),

  appendWords: (newWords) => {
    const state = get();
    set({ words: [...state.words, ...newWords] });
  },
}));

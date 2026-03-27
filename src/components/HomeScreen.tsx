import React, { useEffect, useCallback } from "react";
import { Box, useInput, useStdout } from "ink";
import { useTestStore } from "../stores/testStore.js";
import { useConfigStore } from "../stores/configStore.js";
import { generateWords } from "../engine/wordGenerator.js";
import { getRandomQuote } from "../engine/quoteGenerator.js";
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
    let words: string[];

    switch (config.mode) {
      case "quote": {
        const quote = getRandomQuote(config.quoteLength);
        words = quote.text.split(/\s+/);
        useTestStore.setState({ quoteSource: quote.source, quoteAuthor: quote.author });
        break;
      }
      case "zen":
        words = [];
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

  // Quote mode: check if all words completed
  useEffect(() => {
    if (config.mode !== "quote" || testStore.status !== "typing") return;
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

    // Ctrl shortcuts
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

    // Ignore special keys during typing
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

      // Check if words/quote mode is complete
      if ((config.mode === "words" || config.mode === "quote") &&
          testStore.wordIndex >= testStore.words.length - 1) {
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

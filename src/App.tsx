import React, { useState, useCallback } from "react";
import { Box, Text, useInput, useApp, useStdout } from "ink";
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
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  const rows = stdout?.rows ?? 24;

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
      quoteSource: state.quoteSource ?? undefined,
      quoteAuthor: state.quoteAuthor ?? undefined,
    };

    saveResult(result);
    updatePersonalBest(result);
    setLastResult(result);
    setScreen("results");
  }, [config]);

  const handleRestart = useCallback(() => {
    setScreen("home");
    useTestStore.getState().resetTest();
    useTestStore.setState({ words: [] });
  }, []);

  const handleHome = useCallback(() => {
    setScreen("home");
    useTestStore.getState().resetTest();
    useTestStore.setState({ words: [] });
  }, []);

  useInput((input, key) => {
    if (input === "c" && key.ctrl) {
      exit();
    }
  });

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

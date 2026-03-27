import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import { useConfigStore } from "../../src/stores/configStore.js";
import ResultsScreen from "../../src/components/ResultsScreen.js";
import { type TestResult } from "../../src/types.js";

describe("ResultsScreen", () => {
  beforeEach(() => {
    useConfigStore.setState(useConfigStore.getInitialState());
  });

  it("displays WPM, accuracy, and consistency", () => {
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

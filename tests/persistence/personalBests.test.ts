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

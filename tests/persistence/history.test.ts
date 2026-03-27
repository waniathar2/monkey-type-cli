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
    expect(recent[0].wpm).toBe(14);
  });
});

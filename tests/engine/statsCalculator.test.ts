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
    const wpm = calculateWpm(50, 60000);
    expect(wpm).toBe(10);
  });

  it("returns 0 for 0 elapsed time", () => {
    expect(calculateWpm(50, 0)).toBe(0);
  });
});

describe("calculateRawWpm", () => {
  it("calculates raw WPM from all typed characters", () => {
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
      makeKeystroke("a", "a", 0),
      makeKeystroke("b", "x", 100),
      makeKeystroke("", "z", 200),
    ];
    const result = calculateCharacterBreakdown(keystrokes, 2);
    expect(result.correct).toBe(1);
    expect(result.incorrect).toBe(1);
    expect(result.extra).toBe(1);
    expect(result.missed).toBe(2);
  });
});

describe("calculateWpmPerSecond", () => {
  it("groups keystrokes by second and returns WPM per second", () => {
    const keystrokes: Keystroke[] = [];
    for (let i = 0; i < 5; i++) {
      keystrokes.push(makeKeystroke("a", "a", i * 100));
    }
    const result = calculateWpmPerSecond(keystrokes, 1000);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(60);
  });
});

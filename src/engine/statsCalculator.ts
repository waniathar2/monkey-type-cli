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
    result.push(Math.round((chars / 5) * 60));
  }

  return result;
}

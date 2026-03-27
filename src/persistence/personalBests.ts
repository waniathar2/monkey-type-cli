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

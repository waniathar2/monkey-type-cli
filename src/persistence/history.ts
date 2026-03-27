import path from "node:path";
import { type TestResult } from "../types.js";
import { readJsonFile, writeJsonFile, getDataDir } from "./storage.js";

function historyPath(dataDir?: string): string {
  return path.join(dataDir ?? getDataDir(), "history.json");
}

export function getHistory(dataDir?: string): TestResult[] {
  return readJsonFile<TestResult[]>(historyPath(dataDir), []);
}

export function saveResult(result: TestResult, dataDir?: string): void {
  const history = getHistory(dataDir);
  history.push(result);
  writeJsonFile(historyPath(dataDir), history);
}

export function getRecentResults(count: number, dataDir?: string): TestResult[] {
  const history = getHistory(dataDir);
  return history.slice(-count).reverse();
}

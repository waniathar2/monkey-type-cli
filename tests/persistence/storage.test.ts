import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { readJsonFile, writeJsonFile } from "../../src/persistence/storage.js";

describe("storage", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mtype-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates directory and writes JSON", () => {
    const filePath = path.join(tmpDir, "sub", "test.json");
    writeJsonFile(filePath, { hello: "world" });
    expect(fs.existsSync(filePath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(content).toEqual({ hello: "world" });
  });

  it("reads JSON file", () => {
    const filePath = path.join(tmpDir, "read.json");
    fs.writeFileSync(filePath, JSON.stringify({ key: "value" }));
    const result = readJsonFile(filePath, {});
    expect(result).toEqual({ key: "value" });
  });

  it("returns default for missing file", () => {
    const result = readJsonFile(path.join(tmpDir, "missing.json"), { fallback: true });
    expect(result).toEqual({ fallback: true });
  });

  it("returns default for corrupted JSON", () => {
    const filePath = path.join(tmpDir, "bad.json");
    fs.writeFileSync(filePath, "not json{{{");
    const result = readJsonFile(filePath, []);
    expect(result).toEqual([]);
  });
});

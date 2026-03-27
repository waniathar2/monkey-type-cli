import { describe, it, expect } from "vitest";
import { generateWords } from "../../src/engine/wordGenerator.js";

describe("generateWords", () => {
  it("returns the requested number of words", () => {
    const words = generateWords("english-200", 25);
    expect(words).toHaveLength(25);
  });

  it("returns strings from the word list", () => {
    const words = generateWords("english-200", 10);
    for (const word of words) {
      expect(typeof word).toBe("string");
      expect(word.length).toBeGreaterThan(0);
    }
  });

  it("produces different results on subsequent calls (randomized)", () => {
    const a = generateWords("english-200", 50);
    const b = generateWords("english-200", 50);
    expect(a).not.toEqual(b);
  });

  it("works with all word list names", () => {
    expect(generateWords("english-200", 5)).toHaveLength(5);
    expect(generateWords("english-1k", 5)).toHaveLength(5);
    expect(generateWords("english-5k", 5)).toHaveLength(5);
  });

  it("avoids consecutive duplicate words", () => {
    const words = generateWords("english-200", 100);
    for (let i = 1; i < words.length; i++) {
      expect(words[i]).not.toBe(words[i - 1]);
    }
  });
});

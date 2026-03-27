import { describe, it, expect } from "vitest";
import { getRandomQuote } from "../../src/engine/quoteGenerator.js";

describe("getRandomQuote", () => {
  it("returns a quote with required fields", () => {
    const quote = getRandomQuote("short");
    expect(quote).toHaveProperty("text");
    expect(quote).toHaveProperty("source");
    expect(quote).toHaveProperty("author");
    expect(quote).toHaveProperty("length");
    expect(typeof quote.text).toBe("string");
    expect(quote.text.length).toBeGreaterThan(0);
  });

  it("returns quotes matching requested length", () => {
    const short = getRandomQuote("short");
    expect(short.length).toBe("short");

    const medium = getRandomQuote("medium");
    expect(medium.length).toBe("medium");

    const long = getRandomQuote("long");
    expect(long.length).toBe("long");
  });

  it("returns different quotes on repeated calls", () => {
    const quotes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      quotes.add(getRandomQuote("short").text);
    }
    expect(quotes.size).toBeGreaterThan(1);
  });
});

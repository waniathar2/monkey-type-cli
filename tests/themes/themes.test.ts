import { describe, it, expect } from "vitest";
import { themes, getTheme, themeNames } from "../../src/themes/themes.js";

describe("themes", () => {
  it("has all required themes", () => {
    expect(themeNames).toContain("default");
    expect(themeNames).toContain("monokai");
    expect(themeNames).toContain("dracula");
    expect(themeNames).toContain("solarized-dark");
    expect(themeNames).toContain("nord");
    expect(themeNames).toContain("olivia");
  });

  it("every theme has all required color keys", () => {
    const requiredKeys = ["bg", "fg", "dimmed", "correct", "incorrect", "caret", "accent"];
    for (const name of themeNames) {
      const theme = getTheme(name);
      for (const key of requiredKeys) {
        expect(theme).toHaveProperty(key);
        expect(typeof theme[key as keyof typeof theme]).toBe("string");
      }
    }
  });

  it("getTheme falls back to default for unknown theme", () => {
    expect(getTheme("nonexistent")).toEqual(getTheme("default"));
  });
});

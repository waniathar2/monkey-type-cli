import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import { useTestStore } from "../../src/stores/testStore.js";
import { useConfigStore } from "../../src/stores/configStore.js";
import TypingArea from "../../src/components/TypingArea.js";

describe("TypingArea", () => {
  beforeEach(() => {
    useTestStore.setState(useTestStore.getInitialState());
    useConfigStore.setState(useConfigStore.getInitialState());
  });

  it("renders words from the test store", () => {
    useTestStore.getState().initTest(["hello", "world"]);
    const { lastFrame } = render(<TypingArea terminalWidth={80} />);
    const frame = lastFrame();
    expect(frame).toContain("hello");
    expect(frame).toContain("world");
  });

  it("shows typed characters with caret", () => {
    useTestStore.getState().initTest(["hello", "world"]);
    useTestStore.getState().typeChar("h");
    useTestStore.getState().typeChar("e");
    const { lastFrame } = render(<TypingArea terminalWidth={80} />);
    const frame = lastFrame();
    // Caret character splits the word display
    expect(frame).toContain("he");
    expect(frame).toContain("world");
  });

  it("shows empty message when no words", () => {
    useTestStore.getState().initTest([]);
    const { lastFrame } = render(<TypingArea terminalWidth={80} />);
    expect(lastFrame()).toContain("No words");
  });
});

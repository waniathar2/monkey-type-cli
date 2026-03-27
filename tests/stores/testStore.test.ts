import { describe, it, expect, beforeEach } from "vitest";
import { useTestStore } from "../../src/stores/testStore.js";

describe("testStore", () => {
  beforeEach(() => {
    useTestStore.setState(useTestStore.getInitialState());
  });

  it("starts in idle state", () => {
    const state = useTestStore.getState();
    expect(state.status).toBe("idle");
    expect(state.wordIndex).toBe(0);
    expect(state.charIndex).toBe(0);
    expect(state.keystrokes).toEqual([]);
  });

  it("initializes with words", () => {
    useTestStore.getState().initTest(["hello", "world", "test"]);
    const state = useTestStore.getState();
    expect(state.words).toEqual(["hello", "world", "test"]);
    expect(state.status).toBe("idle");
    expect(state.typedChars).toEqual([[]]);
  });

  it("starts test on first character typed", () => {
    useTestStore.getState().initTest(["hello", "world"]);
    useTestStore.getState().typeChar("h");
    const state = useTestStore.getState();
    expect(state.status).toBe("typing");
    expect(state.charIndex).toBe(1);
    expect(state.typedChars[0]).toEqual(["h"]);
  });

  it("tracks correct and incorrect characters", () => {
    useTestStore.getState().initTest(["abc"]);
    useTestStore.getState().typeChar("a");
    useTestStore.getState().typeChar("x");
    useTestStore.getState().typeChar("c");
    const state = useTestStore.getState();
    expect(state.typedChars[0]).toEqual(["a", "x", "c"]);
    expect(state.charIndex).toBe(3);
  });

  it("handles space to advance to next word", () => {
    useTestStore.getState().initTest(["hi", "there"]);
    useTestStore.getState().typeChar("h");
    useTestStore.getState().typeChar("i");
    useTestStore.getState().typeSpace();
    const state = useTestStore.getState();
    expect(state.wordIndex).toBe(1);
    expect(state.charIndex).toBe(0);
    expect(state.typedChars[1]).toEqual([]);
  });

  it("handles backspace within a word", () => {
    useTestStore.getState().initTest(["hello"]);
    useTestStore.getState().typeChar("h");
    useTestStore.getState().typeChar("x");
    useTestStore.getState().backspace();
    const state = useTestStore.getState();
    expect(state.charIndex).toBe(1);
    expect(state.typedChars[0]).toEqual(["h"]);
  });

  it("does not backspace to previous word", () => {
    useTestStore.getState().initTest(["hi", "there"]);
    useTestStore.getState().typeChar("h");
    useTestStore.getState().typeChar("i");
    useTestStore.getState().typeSpace();
    useTestStore.getState().backspace();
    const state = useTestStore.getState();
    expect(state.wordIndex).toBe(1);
    expect(state.charIndex).toBe(0);
  });

  it("tracks extra characters beyond word length", () => {
    useTestStore.getState().initTest(["ab"]);
    useTestStore.getState().typeChar("a");
    useTestStore.getState().typeChar("b");
    useTestStore.getState().typeChar("c");
    useTestStore.getState().typeChar("d");
    const state = useTestStore.getState();
    expect(state.typedChars[0]).toEqual(["a", "b", "c", "d"]);
    expect(state.charIndex).toBe(4);
  });

  it("finishes test", () => {
    useTestStore.getState().initTest(["hi"]);
    useTestStore.getState().typeChar("h");
    useTestStore.getState().typeChar("i");
    useTestStore.getState().finishTest();
    expect(useTestStore.getState().status).toBe("finished");
  });

  it("resets test", () => {
    useTestStore.getState().initTest(["hi"]);
    useTestStore.getState().typeChar("h");
    useTestStore.getState().resetTest();
    const state = useTestStore.getState();
    expect(state.status).toBe("idle");
    expect(state.wordIndex).toBe(0);
    expect(state.charIndex).toBe(0);
    expect(state.keystrokes).toEqual([]);
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { useConfigStore } from "../../src/stores/configStore.js";

describe("configStore", () => {
  beforeEach(() => {
    useConfigStore.setState(useConfigStore.getInitialState());
  });

  it("has sensible defaults", () => {
    const state = useConfigStore.getState();
    expect(state.config.mode).toBe("time");
    expect(state.config.duration).toBe(30);
    expect(state.config.wordCount).toBe(25);
    expect(state.config.wordList).toBe("english-1k");
    expect(state.config.caretStyle).toBe("line");
    expect(state.config.theme).toBe("default");
    expect(state.config.showLiveWpm).toBe(true);
    expect(state.config.showLiveAccuracy).toBe(true);
    expect(state.config.smoothCaret).toBe(true);
  });

  it("updates individual config fields", () => {
    useConfigStore.getState().updateConfig({ mode: "words", duration: 60 });
    const state = useConfigStore.getState();
    expect(state.config.mode).toBe("words");
    expect(state.config.duration).toBe(60);
    expect(state.config.wordList).toBe("english-1k");
  });

  it("applies CLI overrides", () => {
    useConfigStore.getState().applyCliOverrides({ mode: "quote", theme: "dracula" });
    const state = useConfigStore.getState();
    expect(state.config.mode).toBe("quote");
    expect(state.config.theme).toBe("dracula");
  });
});

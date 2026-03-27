import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import App from "../../src/App.js";
import { useTestStore } from "../../src/stores/testStore.js";
import { useConfigStore } from "../../src/stores/configStore.js";

describe("App integration", () => {
  beforeEach(() => {
    useTestStore.setState(useTestStore.getInitialState());
    useConfigStore.setState(useConfigStore.getInitialState());
  });

  it("renders without crashing", () => {
    const { lastFrame } = render(<App />);
    expect(lastFrame()).toBeTruthy();
  });

  it("shows mode selector with time as default", () => {
    const { lastFrame } = render(<App />);
    const frame = lastFrame();
    expect(frame).toContain("time");
    expect(frame).toContain("words");
    expect(frame).toContain("quote");
    expect(frame).toContain("zen");
  });
});

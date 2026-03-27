import { create } from "zustand";
import { type Config } from "../types.js";

const defaultConfig: Config = {
  mode: "time",
  duration: 30,
  wordCount: 25,
  wordList: "english-1k",
  quoteLength: "medium",
  caretStyle: "line",
  theme: "default",
  showLiveWpm: true,
  showLiveAccuracy: true,
  smoothCaret: true,
};

interface ConfigState {
  config: Config;
  updateConfig: (partial: Partial<Config>) => void;
  applyCliOverrides: (overrides: Partial<Config>) => void;
}

export const useConfigStore = create<ConfigState>()((set) => ({
  config: { ...defaultConfig },
  updateConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),
  applyCliOverrides: (overrides) =>
    set((state) => ({
      config: {
        ...state.config,
        ...Object.fromEntries(
          Object.entries(overrides).filter(([_, v]) => v !== undefined)
        ),
      },
    })),
}));

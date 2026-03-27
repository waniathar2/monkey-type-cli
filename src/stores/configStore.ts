import { create } from "zustand";
import path from "node:path";
import { type Config } from "../types.js";
import { readJsonFile, writeJsonFile, getDataDir } from "../persistence/storage.js";

const CONFIG_PATH = path.join(getDataDir(), "config.json");

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

function loadConfig(): Config {
  const saved = readJsonFile<Partial<Config>>(CONFIG_PATH, {});
  return { ...defaultConfig, ...saved };
}

interface ConfigState {
  config: Config;
  updateConfig: (partial: Partial<Config>) => void;
  applyCliOverrides: (overrides: Partial<Config>) => void;
}

export const useConfigStore = create<ConfigState>()((set) => ({
  config: loadConfig(),
  updateConfig: (partial) =>
    set((state) => {
      const newConfig = { ...state.config, ...partial };
      writeJsonFile(CONFIG_PATH, newConfig);
      return { config: newConfig };
    }),
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

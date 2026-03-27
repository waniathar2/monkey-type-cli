import { type ThemeColors } from "../types.js";

export const themes: Record<string, ThemeColors> = {
  default: {
    bg: "#1e1e1e",
    fg: "#d4d4d4",
    dimmed: "#555555",
    correct: "#d4d4d4",
    incorrect: "#e74c3c",
    caret: "#e2b714",
    accent: "#e2b714",
  },
  monokai: {
    bg: "#272822",
    fg: "#f8f8f2",
    dimmed: "#75715e",
    correct: "#f8f8f2",
    incorrect: "#f92672",
    caret: "#a6e22e",
    accent: "#a6e22e",
  },
  dracula: {
    bg: "#282a36",
    fg: "#f8f8f2",
    dimmed: "#6272a4",
    correct: "#f8f8f2",
    incorrect: "#ff5555",
    caret: "#bd93f9",
    accent: "#bd93f9",
  },
  "solarized-dark": {
    bg: "#002b36",
    fg: "#839496",
    dimmed: "#586e75",
    correct: "#839496",
    incorrect: "#dc322f",
    caret: "#b58900",
    accent: "#b58900",
  },
  nord: {
    bg: "#2e3440",
    fg: "#d8dee9",
    dimmed: "#4c566a",
    correct: "#d8dee9",
    incorrect: "#bf616a",
    caret: "#88c0d0",
    accent: "#88c0d0",
  },
  olivia: {
    bg: "#1c1b1d",
    fg: "#e8d5b9",
    dimmed: "#645c54",
    correct: "#e8d5b9",
    incorrect: "#c34a47",
    caret: "#deaf8c",
    accent: "#deaf8c",
  },
};

export const themeNames = Object.keys(themes);

export function getTheme(name: string): ThemeColors {
  return themes[name] ?? themes["default"];
}

import React from "react";
import { render } from "ink";
import meow from "meow";
import App from "./App.js";
import StatsView from "./components/StatsView.js";
import { useConfigStore } from "./stores/configStore.js";
import { type TestMode, type TimeDuration, type WordCount, type WordListName, type CaretStyle } from "./types.js";

const cli = meow(
  `
  Usage
    $ monkey-type-cli

  Options
    --mode      Test mode: time, words, quote, zen (default: time)
    --duration  Time in seconds: 15, 30, 60, 120 (default: 30)
    --words     Word count: 10, 25, 50, 100 (default: 25)
    --wordlist  Word list: english-200, english-1k, english-5k (default: english-1k)
    --theme     Color theme (default: default)
    --caret     Caret style: block, line, underline (default: line)
    --custom    Custom text to type
    --custom-file  Path to custom text file
    --stats     Show stats history
`,
  {
    importMeta: import.meta,
    flags: {
      mode: { type: "string" },
      duration: { type: "number" },
      words: { type: "number" },
      wordlist: { type: "string" },
      theme: { type: "string" },
      caret: { type: "string" },
      custom: { type: "string" },
      customFile: { type: "string" },
      stats: { type: "boolean", default: false },
    },
  }
);

// Apply CLI overrides
useConfigStore.getState().applyCliOverrides({
  mode: cli.flags.mode as TestMode | undefined,
  duration: cli.flags.duration as TimeDuration | undefined,
  wordCount: cli.flags.words as WordCount | undefined,
  wordList: cli.flags.wordlist as WordListName | undefined,
  theme: cli.flags.theme,
  caretStyle: cli.flags.caret as CaretStyle | undefined,
});

// Ensure terminal state is restored on exit
process.on("SIGINT", () => {
  process.exit(0);
});
process.on("SIGTERM", () => {
  process.exit(0);
});

if (cli.flags.stats) {
  render(<StatsView />);
} else {
  render(<App />);
}

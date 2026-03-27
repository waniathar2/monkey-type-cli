import React from "react";
import { render } from "ink";
import meow from "meow";
import App from "./App.js";

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
      mode: { type: "string", default: "time" },
      duration: { type: "number", default: 30 },
      words: { type: "number", default: 25 },
      wordlist: { type: "string", default: "english-1k" },
      theme: { type: "string", default: "default" },
      caret: { type: "string", default: "line" },
      custom: { type: "string" },
      customFile: { type: "string" },
      stats: { type: "boolean", default: false },
    },
  }
);

render(<App />);

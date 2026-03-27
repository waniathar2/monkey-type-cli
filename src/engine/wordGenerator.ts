import { createRequire } from "node:module";
import { type WordListName } from "../types.js";

const require = createRequire(import.meta.url);
const english200: string[] = require("../data/english-200.json");
const english1k: string[] = require("../data/english-1k.json");
const english5k: string[] = require("../data/english-5k.json");

const wordLists: Record<WordListName, string[]> = {
  "english-200": english200,
  "english-1k": english1k,
  "english-5k": english5k,
};

export function generateWords(listName: WordListName, count: number): string[] {
  const list = wordLists[listName];
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    let word: string;
    do {
      word = list[Math.floor(Math.random() * list.length)];
    } while (result.length > 0 && word === result[result.length - 1]);
    result.push(word);
  }

  return result;
}

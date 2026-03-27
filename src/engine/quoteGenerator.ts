import { createRequire } from "node:module";
import { type Quote, type QuoteLength } from "../types.js";

const require = createRequire(import.meta.url);
const quotesData: Quote[] = require("../data/quotes.json");

export function getRandomQuote(length: QuoteLength): Quote {
  const filtered = quotesData.filter((q) => q.length === length);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

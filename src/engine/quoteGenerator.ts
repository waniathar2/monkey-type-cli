import { type Quote, type QuoteLength } from "../types.js";
import quotesData from "../data/quotes.json";

export function getRandomQuote(length: QuoteLength): Quote {
  const filtered = quotesData.filter((q) => q.length === length);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

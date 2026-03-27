import React from "react";
import { Box, Text } from "ink";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme } from "../themes/themes.js";
import { type TestMode, type TimeDuration, type WordCount, type QuoteLength } from "../types.js";

const modes: TestMode[] = ["time", "words", "quote", "zen"];
const durations: TimeDuration[] = [15, 30, 60, 120];
const wordCounts: WordCount[] = [10, 25, 50, 100];
const quoteLengths: QuoteLength[] = ["short", "medium", "long"];

export default function ModeSelector() {
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);

  const subOptions = (): Array<{ label: string; active: boolean }> => {
    switch (config.mode) {
      case "time":
        return durations.map((d) => ({ label: `${d}`, active: d === config.duration }));
      case "words":
        return wordCounts.map((w) => ({ label: `${w}`, active: w === config.wordCount }));
      case "quote":
        return quoteLengths.map((l) => ({ label: l, active: l === config.quoteLength }));
      default:
        return [];
    }
  };

  return (
    <Box flexDirection="column" alignItems="center" paddingY={1}>
      <Box gap={2}>
        {modes.map((m) => (
          <Text
            key={m}
            color={m === config.mode ? theme.accent : theme.dimmed}
            bold={m === config.mode}
          >
            {m}
          </Text>
        ))}
      </Box>
      {subOptions().length > 0 && (
        <Box gap={2}>
          {subOptions().map((opt) => (
            <Text
              key={opt.label}
              color={opt.active ? theme.accent : theme.dimmed}
              bold={opt.active}
            >
              {opt.label}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}

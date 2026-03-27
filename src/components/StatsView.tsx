import React from "react";
import { Box, Text } from "ink";
import { getRecentResults } from "../persistence/history.js";
import { getPersonalBests } from "../persistence/personalBests.js";
import { getTheme } from "../themes/themes.js";
import { useConfigStore } from "../stores/configStore.js";

export default function StatsView() {
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);
  const recent = getRecentResults(10);
  const bests = getPersonalBests();

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color={theme.accent} bold>Personal Bests</Text>
      <Text color={theme.dimmed}>{"\u2500".repeat(50)}</Text>
      {Object.entries(bests).length === 0 ? (
        <Text color={theme.dimmed}>No personal bests yet. Complete a test first!</Text>
      ) : (
        Object.entries(bests).map(([key, pb]) => (
          <Text key={key}>
            <Text color={theme.fg} bold>{key.padEnd(15)}</Text>
            <Text color={theme.accent}>{(pb as any).wpm} WPM</Text>
            <Text color={theme.dimmed}>  {(pb as any).accuracy}% acc</Text>
          </Text>
        ))
      )}

      <Box paddingTop={1}>
        <Text color={theme.accent} bold>Recent Results (last 10)</Text>
      </Box>
      <Text color={theme.dimmed}>{"\u2500".repeat(50)}</Text>
      {recent.length === 0 ? (
        <Text color={theme.dimmed}>No history yet.</Text>
      ) : (
        recent.map((r, i) => (
          <Text key={i}>
            <Text color={theme.dimmed}>{new Date(r.timestamp).toLocaleDateString().padEnd(12)}</Text>
            <Text color={theme.fg}>{r.mode.padEnd(8)}</Text>
            <Text color={theme.accent}>{String(r.wpm).padEnd(6)} WPM</Text>
            <Text color={theme.dimmed}>{r.accuracy}% acc</Text>
          </Text>
        ))
      )}
    </Box>
  );
}

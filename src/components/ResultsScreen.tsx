import React from "react";
import { Box, Text, useInput } from "ink";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme } from "../themes/themes.js";
import WpmChart from "./WpmChart.js";
import { type TestResult, type Keystroke } from "../types.js";

interface Props {
  result: TestResult;
  onRestart: () => void;
  onHome: () => void;
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Box flexDirection="column" alignItems="center" paddingX={2}>
      <Text color={color} dimColor>{label}</Text>
      <Text color={color} bold>{value}</Text>
    </Box>
  );
}

function CharAccuracyTable({ keystrokes }: { keystrokes: Keystroke[] }) {
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);

  const charStats: Record<string, { correct: number; total: number }> = {};
  for (const ks of keystrokes) {
    if (ks.isBackspace || ks.expected === "") continue;
    if (!charStats[ks.expected]) {
      charStats[ks.expected] = { correct: 0, total: 0 };
    }
    charStats[ks.expected].total++;
    if (ks.typed === ks.expected) {
      charStats[ks.expected].correct++;
    }
  }

  const worst = Object.entries(charStats)
    .filter(([_, s]) => s.total >= 3)
    .map(([char, s]) => ({ char, accuracy: Math.round((s.correct / s.total) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  if (worst.length === 0) return null;

  return (
    <Box flexDirection="column" paddingTop={1}>
      <Text color={theme.accent} bold>Weakest keys</Text>
      <Box gap={2}>
        {worst.map(({ char, accuracy }) => (
          <Text key={char}>
            <Text color={accuracy < 80 ? theme.incorrect : theme.fg} bold>{char}</Text>
            <Text color={theme.dimmed}> {accuracy}%</Text>
          </Text>
        ))}
      </Box>
    </Box>
  );
}

export default function ResultsScreen({ result, onRestart, onHome }: Props) {
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);

  useInput((input, key) => {
    if (key.tab) {
      onRestart();
    }
    if (key.escape) {
      onHome();
    }
  });

  return (
    <Box flexDirection="column" alignItems="center" paddingY={1}>
      <Text color={theme.accent} bold>Test Complete</Text>

      <Box paddingY={1} gap={1}>
        <StatBox label="wpm" value={result.wpm} color={theme.accent} />
        <StatBox label="raw" value={result.rawWpm} color={theme.fg} />
        <StatBox label="accuracy" value={`${result.accuracy}%`} color={theme.fg} />
        <StatBox label="consistency" value={`${result.consistency}%`} color={theme.fg} />
      </Box>

      <Box gap={3}>
        <Text color={theme.correct}>correct: {result.characters.correct}</Text>
        <Text color={theme.incorrect}>incorrect: {result.characters.incorrect}</Text>
        <Text color={theme.incorrect}>extra: {result.characters.extra}</Text>
        <Text color={theme.dimmed}>missed: {result.characters.missed}</Text>
      </Box>

      <WpmChart wpmPerSecond={result.wpmPerSecond} />

      <CharAccuracyTable keystrokes={result.keystrokeLog} />

      {result.quoteAuthor && (
        <Box paddingTop={1}>
          <Text color={theme.dimmed}>-- {result.quoteAuthor}, {result.quoteSource}</Text>
        </Box>
      )}

      <Box paddingTop={1} gap={3}>
        <Text color={theme.dimmed}>[Tab] restart</Text>
        <Text color={theme.dimmed}>[Esc] home</Text>
      </Box>
    </Box>
  );
}

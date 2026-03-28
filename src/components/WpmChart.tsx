import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../themes/themes.js";
import { useConfigStore } from "../stores/configStore.js";

const CHART_HEIGHT = 8;

interface Props {
  wpmPerSecond: number[];
  width?: number;
}

export default function WpmChart({ wpmPerSecond, width = 40 }: Props) {
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);

  if (wpmPerSecond.length === 0) return null;

  // Skip leading zeros
  let startIdx = 0;
  while (startIdx < wpmPerSecond.length && wpmPerSecond[startIdx] === 0) startIdx++;
  let data = wpmPerSecond.slice(startIdx);
  if (data.length === 0) return null;

  // Downsample if needed
  if (data.length > width) {
    const ratio = data.length / width;
    const sampled: number[] = [];
    for (let i = 0; i < width; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.floor((i + 1) * ratio);
      const slice = data.slice(start, end);
      sampled.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
    data = sampled;
  }

  const max = Math.max(...data);
  if (max === 0) return null;
  const min = Math.min(...data);
  const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length);
  const range = max - min || 1;

  // Calculate row position for each data point (0=bottom, CHART_HEIGHT-1=top)
  const positions = data.map((v) =>
    Math.round(((v - min) / range) * (CHART_HEIGHT - 1))
  );

  // Average row position
  const avgRow = Math.round(((avg - min) / range) * (CHART_HEIGHT - 1));

  // Build chart rows (top to bottom) — pure line chart with dots only
  const chartRows: string[] = [];
  for (let row = CHART_HEIGHT - 1; row >= 0; row--) {
    let line = "";
    for (let col = 0; col < data.length; col++) {
      if (positions[col] === row) {
        line += "●";
      } else if (row === avgRow) {
        line += "┄";
      } else {
        line += " ";
      }
    }
    chartRows.push(line);
  }

  const maxLabel = String(Math.round(max)).padStart(4);
  const minLabel = String(Math.round(min)).padStart(4);
  const avgLabel = String(avg).padStart(4);

  return (
    <Box flexDirection="column" paddingY={1}>
      <Text color={theme.accent} bold>WPM over time</Text>
      {chartRows.map((row, i) => {
        const rowLevel = CHART_HEIGHT - 1 - i;
        const isAvgRow = rowLevel === avgRow;

        let label = "    ";
        if (i === 0) label = maxLabel;
        else if (i === chartRows.length - 1) label = minLabel;
        else if (isAvgRow) label = avgLabel;

        return (
          <Box key={i}>
            <Text color={theme.dimmed}>{label} │</Text>
            <Text>
              {row.split("").map((ch, ci) =>
                ch === "●" ? (
                  <Text key={ci} color={theme.accent} bold>●</Text>
                ) : ch === "┄" ? (
                  <Text key={ci} color={theme.dimmed}>┄</Text>
                ) : (
                  <Text key={ci}> </Text>
                )
              )}
            </Text>
          </Box>
        );
      })}
      <Box>
        <Text color={theme.dimmed}>
          {"     └" + "─".repeat(Math.max(1, data.length))}
        </Text>
      </Box>
      <Box gap={3} paddingLeft={6}>
        <Text color={theme.dimmed}>avg: {avg} wpm</Text>
        <Text color={theme.dimmed}>time: {wpmPerSecond.length}s</Text>
      </Box>
    </Box>
  );
}

import React from "react";
import { Box, Text } from "ink";
import { getTheme } from "../themes/themes.js";
import { useConfigStore } from "../stores/configStore.js";

const SPARKLINE_CHARS = ["\u2581", "\u2582", "\u2583", "\u2584", "\u2585", "\u2586", "\u2587", "\u2588"];

interface Props {
  wpmPerSecond: number[];
  width?: number;
}

export default function WpmChart({ wpmPerSecond, width = 60 }: Props) {
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);

  if (wpmPerSecond.length === 0) return null;

  let data = wpmPerSecond;
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
  const min = Math.min(...data);
  const range = max - min || 1;

  const sparkline = data
    .map((v) => {
      const idx = Math.round(((v - min) / range) * (SPARKLINE_CHARS.length - 1));
      return SPARKLINE_CHARS[idx];
    })
    .join("");

  return (
    <Box flexDirection="column" paddingY={1}>
      <Text color={theme.accent} bold>WPM over time</Text>
      <Text color={theme.fg}>{sparkline}</Text>
      <Box justifyContent="space-between" width={data.length}>
        <Text color={theme.dimmed}>{Math.round(min)}</Text>
        <Text color={theme.dimmed}>{Math.round(max)}</Text>
      </Box>
    </Box>
  );
}

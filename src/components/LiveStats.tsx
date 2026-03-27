import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { useTestStore } from "../stores/testStore.js";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme } from "../themes/themes.js";
import { calculateWpm, calculateAccuracy } from "../engine/statsCalculator.js";

interface Props {
  mode: "time" | "words" | "quote" | "zen" | "custom";
  targetDuration?: number | null;
}

export default function LiveStats({ mode, targetDuration }: Props) {
  const { status, startTime, keystrokes } = useTestStore();
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "typing" || !startTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [status, startTime]);

  const correctChars = keystrokes.filter(
    (k) => !k.isBackspace && k.typed === k.expected && k.expected !== ""
  ).length;
  const totalChars = keystrokes.filter((k) => !k.isBackspace).length;

  const wpm = calculateWpm(correctChars, elapsed);
  const accuracy = calculateAccuracy(correctChars, totalChars);

  const timeDisplay = (): string => {
    if (mode === "time" && targetDuration) {
      const remaining = Math.max(0, targetDuration * 1000 - elapsed);
      return `${Math.ceil(remaining / 1000)}`;
    }
    const secs = Math.floor(elapsed / 1000);
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  if (status === "idle") {
    return (
      <Box justifyContent="center" paddingY={1}>
        <Text color={theme.dimmed}>Start typing to begin...</Text>
      </Box>
    );
  }

  return (
    <Box justifyContent="center" gap={3} paddingY={1}>
      {config.showLiveWpm && (
        <Text>
          <Text color={theme.accent} bold>WPM: </Text>
          <Text color={theme.fg}>{wpm}</Text>
        </Text>
      )}
      {config.showLiveAccuracy && (
        <Text>
          <Text color={theme.accent} bold>ACC: </Text>
          <Text color={theme.fg}>{accuracy}%</Text>
        </Text>
      )}
      <Text>
        <Text color={theme.accent} bold>TIME: </Text>
        <Text color={theme.fg}>{timeDisplay()}</Text>
      </Text>
    </Box>
  );
}

import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme, themeNames } from "../themes/themes.js";
import { type TestMode } from "../types.js";

interface PaletteItem {
  label: string;
  action: () => void;
}

interface Props {
  onClose: () => void;
}

export default function CommandPalette({ onClose }: Props) {
  const { config, updateConfig } = useConfigStore();
  const theme = getTheme(config.theme);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: PaletteItem[] = [
    ...(["time", "words", "quote", "zen"] as TestMode[]).map((mode) => ({
      label: `Mode: ${mode}`,
      action: () => { updateConfig({ mode }); onClose(); },
    })),
    ...themeNames.map((name) => ({
      label: `Theme: ${name}`,
      action: () => { updateConfig({ theme: name }); onClose(); },
    })),
  ];

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(items.length - 1, i + 1));
    }
    if (key.return) {
      items[selectedIndex].action();
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} borderStyle="round" borderColor={theme.accent}>
      <Text color={theme.accent} bold>Command Palette</Text>
      {items.map((item, idx) => (
        <Text key={idx} color={idx === selectedIndex ? theme.accent : theme.dimmed}>
          {idx === selectedIndex ? "\u25ba " : "  "}{item.label}
        </Text>
      ))}
      <Text color={theme.dimmed}>[Esc] Close  [Enter] Select</Text>
    </Box>
  );
}

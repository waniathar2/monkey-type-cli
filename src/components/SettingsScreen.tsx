import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme, themeNames } from "../themes/themes.js";

interface SettingOption {
  label: string;
  key: string;
  values: Array<{ label: string; value: unknown }>;
}

const settings: SettingOption[] = [
  {
    label: "Test Mode",
    key: "mode",
    values: [
      { label: "time", value: "time" },
      { label: "words", value: "words" },
      { label: "quote", value: "quote" },
      { label: "zen", value: "zen" },
    ],
  },
  {
    label: "Duration",
    key: "duration",
    values: [
      { label: "15s", value: 15 },
      { label: "30s", value: 30 },
      { label: "60s", value: 60 },
      { label: "120s", value: 120 },
    ],
  },
  {
    label: "Word Count",
    key: "wordCount",
    values: [
      { label: "10", value: 10 },
      { label: "25", value: 25 },
      { label: "50", value: 50 },
      { label: "100", value: 100 },
    ],
  },
  {
    label: "Word List",
    key: "wordList",
    values: [
      { label: "english-200", value: "english-200" },
      { label: "english-1k", value: "english-1k" },
      { label: "english-5k", value: "english-5k" },
    ],
  },
  {
    label: "Caret Style",
    key: "caretStyle",
    values: [
      { label: "line", value: "line" },
      { label: "block", value: "block" },
      { label: "underline", value: "underline" },
    ],
  },
  {
    label: "Theme",
    key: "theme",
    values: themeNames.map((name) => ({ label: name, value: name })),
  },
  {
    label: "Show Live WPM",
    key: "showLiveWpm",
    values: [
      { label: "on", value: true },
      { label: "off", value: false },
    ],
  },
  {
    label: "Show Live Accuracy",
    key: "showLiveAccuracy",
    values: [
      { label: "on", value: true },
      { label: "off", value: false },
    ],
  },
  {
    label: "Smooth Caret",
    key: "smoothCaret",
    values: [
      { label: "on", value: true },
      { label: "off", value: false },
    ],
  },
];

interface Props {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: Props) {
  const { config, updateConfig } = useConfigStore();
  const theme = getTheme(config.theme);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(settings.length - 1, i + 1));
    }
    if (key.leftArrow || key.rightArrow) {
      const setting = settings[selectedIndex];
      const currentValue = config[setting.key as keyof typeof config];
      const currentIdx = setting.values.findIndex((v) => v.value === currentValue);
      const delta = key.rightArrow ? 1 : -1;
      const newIdx = (currentIdx + delta + setting.values.length) % setting.values.length;
      updateConfig({ [setting.key]: setting.values[newIdx].value } as any);
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color={theme.accent} bold>Settings</Text>
      <Text color={theme.dimmed}>{"\u2500".repeat(30)}</Text>
      {settings.map((setting, idx) => {
        const isSelected = idx === selectedIndex;
        const currentValue = config[setting.key as keyof typeof config];
        const currentLabel = setting.values.find((v) => v.value === currentValue)?.label ?? String(currentValue);

        return (
          <Box key={setting.key} gap={1}>
            <Text color={isSelected ? theme.accent : theme.fg}>
              {isSelected ? "\u25ba" : " "} {setting.label.padEnd(20)}
            </Text>
            <Text color={isSelected ? theme.accent : theme.dimmed}>
              [{currentLabel}]
            </Text>
          </Box>
        );
      })}
      <Text color={theme.dimmed}>{"\u2500".repeat(30)}</Text>
      <Text color={theme.dimmed}>[Esc] Back  [Left/Right] Change  [Up/Down] Navigate</Text>
    </Box>
  );
}

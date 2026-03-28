import React from "react";
import { Box, Text } from "ink";
import { useTestStore } from "../stores/testStore.js";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme } from "../themes/themes.js";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const ROW_INDENTS = [0, 1, 2];

export default function KeyboardDisplay() {
  const { wordIndex, charIndex, words, status, keystrokes } = useTestStore();
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);

  // Expected character
  let expectedChar = "";
  if (status === "typing") {
    const currentWord = words[wordIndex] ?? "";
    expectedChar =
      charIndex < currentWord.length
        ? currentWord[charIndex].toLowerCase()
        : " ";
  }

  // Last typed character for feedback
  const lastKs =
    keystrokes.length > 0 ? keystrokes[keystrokes.length - 1] : null;
  const lastTypedChar =
    lastKs && !lastKs.isBackspace && status === "typing"
      ? lastKs.typed.toLowerCase()
      : "";
  const lastWasCorrect = lastKs
    ? lastKs.typed === lastKs.expected
    : false;

  const getKeyStyle = (
    key: string
  ): { bg?: string; fg: string; bold: boolean } => {
    if (key === expectedChar) {
      return { bg: theme.caret, fg: theme.bg, bold: true };
    }
    if (key === lastTypedChar && key !== expectedChar) {
      return {
        bg: lastWasCorrect ? theme.correct : theme.incorrect,
        fg: theme.bg,
        bold: true,
      };
    }
    return { fg: theme.dimmed, bold: false };
  };

  const renderKey = (key: string) => {
    const style = getKeyStyle(key);
    return style.bg ? (
      <Text backgroundColor={style.bg} color={style.fg} bold>
        {"[" + key + "]"}
      </Text>
    ) : (
      <Text color={style.fg}>{"[" + key + "]"}</Text>
    );
  };

  const spaceStyle = getKeyStyle(" ");

  return (
    <Box flexDirection="column" paddingTop={1}>
      <Box flexDirection="column">
        {ROWS.map((row, rowIdx) => (
          <Box key={rowIdx}>
            <Text>
              {" ".repeat(ROW_INDENTS[rowIdx] * 2)}
              {row.map((key, keyIdx) => (
                <React.Fragment key={key}>
                  {keyIdx > 0 && <Text> </Text>}
                  {renderKey(key)}
                </React.Fragment>
              ))}
            </Text>
          </Box>
        ))}
        <Box justifyContent="center">
          {spaceStyle.bg ? (
            <Text backgroundColor={spaceStyle.bg} color={spaceStyle.fg} bold>
              {"[     space     ]"}
            </Text>
          ) : (
            <Text color={spaceStyle.fg}>{"[     space     ]"}</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}

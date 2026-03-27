import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { useTestStore } from "../stores/testStore.js";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme } from "../themes/themes.js";
import { type CaretStyle } from "../types.js";

interface Props {
  terminalWidth: number;
}

interface LineWord {
  word: string;
  index: number;
}

function splitIntoLines(words: string[], maxWidth: number): LineWord[][] {
  const lines: LineWord[][] = [];
  let currentLine: LineWord[] = [];
  let currentWidth = 0;

  for (let i = 0; i < words.length; i++) {
    const wordWidth = words[i].length + (currentLine.length > 0 ? 1 : 0);
    if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [];
      currentWidth = 0;
    }
    currentLine.push({ word: words[i], index: i });
    currentWidth += wordWidth;
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  return lines;
}

function getVisibleLines(lines: LineWord[][], activeWordIndex: number): LineWord[][] {
  let activeLine = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].some((w) => w.index === activeWordIndex)) {
      activeLine = i;
      break;
    }
  }

  const startLine = Math.max(0, activeLine - 1);
  return lines.slice(startLine, startLine + 3);
}

function CaretChar({ char, style, color }: { char: string; style: CaretStyle; color: string }) {
  switch (style) {
    case "block":
      return <Text backgroundColor={color} color="#000000">{char || " "}</Text>;
    case "underline":
      return <Text color={color} underline>{char || " "}</Text>;
    case "line":
    default:
      return <Text><Text color={color}>|</Text>{char ? <Text>{char}</Text> : null}</Text>;
  }
}

function WordDisplay({ word, wordIndex }: { word: string; wordIndex: number }) {
  const { wordIndex: activeWordIndex, charIndex, typedChars } = useTestStore();
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);
  const typed = typedChars[wordIndex] ?? [];
  const isActive = wordIndex === activeWordIndex;

  const chars: React.ReactNode[] = [];

  for (let i = 0; i < word.length; i++) {
    const typedChar = typed[i];
    const isCurrentPos = isActive && i === charIndex;

    if (isCurrentPos) {
      chars.push(
        <CaretChar
          key={i}
          char={typedChar === undefined ? word[i] : word[i]}
          style={config.caretStyle}
          color={theme.caret}
        />
      );
    } else if (typedChar === undefined) {
      const color = wordIndex < activeWordIndex ? theme.dimmed : theme.dimmed;
      chars.push(<Text key={i} color={color}>{word[i]}</Text>);
    } else if (typedChar === word[i]) {
      chars.push(<Text key={i} color={theme.correct}>{word[i]}</Text>);
    } else {
      chars.push(<Text key={i} color={theme.incorrect}>{word[i]}</Text>);
    }
  }

  for (let i = word.length; i < typed.length; i++) {
    const isCurrentPos = isActive && i === charIndex;
    if (isCurrentPos) {
      chars.push(
        <CaretChar key={`extra-${i}`} char={typed[i]} style={config.caretStyle} color={theme.caret} />
      );
    } else {
      chars.push(
        <Text key={`extra-${i}`} color={theme.incorrect} underline>{typed[i]}</Text>
      );
    }
  }

  // Caret at end of typed characters when all chars typed
  if (isActive && charIndex === typed.length && typed.length <= word.length && charIndex > 0 && charIndex < word.length) {
    // Handled in loop above
  } else if (isActive && charIndex === 0 && typed.length === 0) {
    // Caret at the very start of word
    chars.unshift(
      <CaretChar key="start-caret" char={word[0]} style={config.caretStyle} color={theme.caret} />
    );
    chars.splice(1, 1); // Remove the duplicate first char
  }

  return <Text>{chars}</Text>;
}

export default function TypingArea({ terminalWidth }: Props) {
  const { words, wordIndex } = useTestStore();
  const maxWidth = Math.min(terminalWidth - 4, 80);

  const lines = useMemo(() => splitIntoLines(words, maxWidth), [words, maxWidth]);
  const visibleLines = getVisibleLines(lines, wordIndex);

  if (words.length === 0) {
    return (
      <Box paddingX={2} paddingY={1}>
        <Text dimColor>No words to display...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {visibleLines.map((line, lineIdx) => (
        <Box key={lineIdx} gap={1}>
          {line.map(({ word, index }) => (
            <WordDisplay key={index} word={word} wordIndex={index} />
          ))}
        </Box>
      ))}
    </Box>
  );
}

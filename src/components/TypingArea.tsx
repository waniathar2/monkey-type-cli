import React, { useMemo, useState, useEffect } from "react";
import { Box, Text } from "ink";
import { useTestStore } from "../stores/testStore.js";
import { useConfigStore } from "../stores/configStore.js";
import { getTheme } from "../themes/themes.js";
import { type CaretStyle, type ThemeColors } from "../types.js";

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

function getVisibleLines(
  lines: LineWord[][],
  activeWordIndex: number
): { visible: LineWord[][]; activeIdx: number } {
  let activeLine = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].some((w) => w.index === activeWordIndex)) {
      activeLine = i;
      break;
    }
  }

  const startLine = Math.max(0, activeLine - 1);
  return {
    visible: lines.slice(startLine, startLine + 3),
    activeIdx: activeLine - startLine,
  };
}

function CaretChar({
  char,
  style,
  theme,
  visible,
}: {
  char: string;
  style: CaretStyle;
  theme: ThemeColors;
  visible: boolean;
}) {
  if (!visible) {
    return <Text color={theme.dimmed}>{char || " "}</Text>;
  }

  switch (style) {
    case "block":
      return (
        <Text backgroundColor={theme.caret} color={theme.bg}>
          {char || " "}
        </Text>
      );
    case "underline":
      return (
        <Text color={theme.caret} underline>
          {char || " "}
        </Text>
      );
    case "line":
    default:
      return (
        <Text color={theme.caret} bold>
          {char || "▏"}
        </Text>
      );
  }
}

function WordDisplay({
  word,
  wordIndex,
  caretVisible,
  isActiveLine,
}: {
  word: string;
  wordIndex: number;
  caretVisible: boolean;
  isActiveLine: boolean;
}) {
  const { wordIndex: activeWordIndex, charIndex, typedChars } = useTestStore();
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);
  const typed = typedChars[wordIndex] ?? [];
  const isActive = wordIndex === activeWordIndex;
  const isPast = wordIndex < activeWordIndex;

  const chars: React.ReactNode[] = [];

  for (let i = 0; i < word.length; i++) {
    const typedChar = typed[i];
    const isCurrentPos = isActive && i === charIndex;

    if (isCurrentPos) {
      chars.push(
        <CaretChar
          key={i}
          char={word[i]}
          style={config.caretStyle}
          theme={theme}
          visible={caretVisible}
        />
      );
    } else if (typedChar === undefined) {
      chars.push(
        <Text key={i} color={theme.dimmed}>
          {word[i]}
        </Text>
      );
    } else if (typedChar === word[i]) {
      chars.push(
        <Text key={i} color={!isActiveLine && isPast ? theme.dimmed : theme.correct}>
          {word[i]}
        </Text>
      );
    } else {
      chars.push(
        <Text key={i} color={!isActiveLine && isPast ? theme.dimmed : theme.incorrect}>
          {word[i]}
        </Text>
      );
    }
  }

  // Extra typed characters beyond word length
  for (let i = word.length; i < typed.length; i++) {
    const isCurrentPos = isActive && i === charIndex;
    if (isCurrentPos) {
      chars.push(
        <CaretChar
          key={`extra-${i}`}
          char={typed[i]}
          style={config.caretStyle}
          theme={theme}
          visible={caretVisible}
        />
      );
    } else {
      chars.push(
        <Text
          key={`extra-${i}`}
          color={!isActiveLine && isPast ? theme.dimmed : theme.incorrect}
          underline
        >
          {typed[i]}
        </Text>
      );
    }
  }

  return <Text>{chars}</Text>;
}

function SpaceDisplay({
  afterWordIndex,
  caretVisible,
  isEndOfLine,
}: {
  afterWordIndex: number;
  caretVisible: boolean;
  isEndOfLine: boolean;
}) {
  const { wordIndex: activeWordIndex, charIndex, words } = useTestStore();
  const { config } = useConfigStore();
  const theme = getTheme(config.theme);

  const activeWord = words[activeWordIndex] ?? "";
  const isSpaceCaret = activeWordIndex === afterWordIndex && charIndex >= activeWord.length;

  if (isSpaceCaret) {
    return <CaretChar char=" " style={config.caretStyle} theme={theme} visible={caretVisible} />;
  }

  // End-of-line spaces only render when cursor is there
  if (isEndOfLine) return null;

  return <Text> </Text>;
}

export default function TypingArea({ terminalWidth }: Props) {
  const words = useTestStore((s) => s.words);
  const wordIndex = useTestStore((s) => s.wordIndex);
  const charIndex = useTestStore((s) => s.charIndex);
  const keystrokeCount = useTestStore((s) => s.keystrokes.length);
  const status = useTestStore((s) => s.status);
  const maxWidth = Math.min(terminalWidth - 8, 100);

  const [caretVisible, setCaretVisible] = useState(true);

  // Blink cursor — reset to visible on each keystroke
  useEffect(() => {
    if (status === "finished") return;
    setCaretVisible(true);
    const timer = setInterval(() => setCaretVisible((v) => !v), 530);
    return () => clearInterval(timer);
  }, [keystrokeCount, charIndex, wordIndex, status]);

  const lines = useMemo(() => splitIntoLines(words, maxWidth), [words, maxWidth]);
  const { visible: visibleLines, activeIdx } = useMemo(
    () => getVisibleLines(lines, wordIndex),
    [lines, wordIndex]
  );

  if (words.length === 0) {
    return (
      <Box paddingX={4} paddingY={2}>
        <Text dimColor>No words to display...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={4} paddingY={1}>
      {visibleLines.map((line, lineIdx) => (
        <Box key={lineIdx}>
          {line.map(({ word, index }, wordIdx) => (
            <React.Fragment key={index}>
              <WordDisplay
                word={word}
                wordIndex={index}
                caretVisible={caretVisible}
                isActiveLine={lineIdx === activeIdx}
              />
              <SpaceDisplay
                afterWordIndex={index}
                caretVisible={caretVisible}
                isEndOfLine={wordIdx === line.length - 1}
              />
            </React.Fragment>
          ))}
        </Box>
      ))}
    </Box>
  );
}

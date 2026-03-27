import React, { useState } from "react";
import { Box, Text } from "ink";
import { type AppScreen } from "./types.js";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("home");

  return (
    <Box flexDirection="column">
      <Text>MonkeyType CLI — screen: {screen}</Text>
    </Box>
  );
}

import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OrbIslandDemo } from './src/orbs/OrbIslandDemo';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OrbIslandDemo />
    </GestureHandlerRootView>
  );
}

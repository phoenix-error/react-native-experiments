import './global.css';

import { colorScheme, cssInterop } from 'nativewind';
import { Appearance } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

cssInterop(GestureHandlerRootView, { className: 'style' });
cssInterop(SafeAreaProvider, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });

// `darkMode: 'class'` only applies `dark:` utilities after an explicit set.
const scheme = Appearance.getColorScheme();
colorScheme.set(scheme === 'dark' ? 'dark' : 'light');

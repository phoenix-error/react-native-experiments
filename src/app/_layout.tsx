import '@/nativewind';

import { PortalHost } from '@rn-primitives/portal';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeToggle } from '@/experiments/shared/components/theme-toggle';
import { NAV_THEME, THEME } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();
SplashScreen.hideAsync();

function HeaderThemeToggle() {
  return <ThemeToggle />;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(THEME[scheme].background);
  }, [scheme]);

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider className="flex-1">
        <ThemeProvider value={NAV_THEME[scheme]}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerBackTitle: 'Back',
              headerRight: HeaderThemeToggle,
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Experiments' }} />
          </Stack>
          <PortalHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

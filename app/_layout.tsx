import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { GlobalErrorBoundary } from '@/components/global-error-boundary';
import { WebLayout } from '@/components/web-layout';
import { MomentraThemeProvider } from '@/contexts/momentra-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const isWebLanding = Platform.OS === 'web' && pathname === '/';
  const content = (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="admin-login" options={{ headerShown: false }} />
      <Stack.Screen name="partner-login" options={{ headerShown: false }} />
      <Stack.Screen name="partner-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="admin-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="explore" options={{ headerShown: false }} />
      <Stack.Screen name="moments" options={{ headerShown: false }} />
      <Stack.Screen name="offers" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="kitty/index" options={{ headerShown: false }} />
      <Stack.Screen name="kitty/venues" options={{ headerShown: false }} />
      <Stack.Screen name="kitty/venue-detail" options={{ headerShown: false }} />
      <Stack.Screen name="kitty/split" options={{ headerShown: false }} />
      <Stack.Screen name="kitty/invite-preview" options={{ headerShown: false }} />
      <Stack.Screen name="kitty/payment-tracker" options={{ headerShown: false }} />
      <Stack.Screen name="kitty/guest-payment" options={{ headerShown: false }} />
      <Stack.Screen name="kitty/confirm" options={{ headerShown: false }} />
      <Stack.Screen name="corporate/index" options={{ headerShown: false }} />
      <Stack.Screen name="corporate/details" options={{ headerShown: false }} />
      <Stack.Screen name="corporate/venues" options={{ headerShown: false }} />
      <Stack.Screen name="corporate/venue-detail" options={{ headerShown: false }} />
      <Stack.Screen name="corporate/confirm" options={{ headerShown: false }} />
      <Stack.Screen name="experiences" options={{ headerShown: false }} />
      <Stack.Screen name="experience-detail" options={{ headerShown: false }} />
      <Stack.Screen name="booking-summary" options={{ headerShown: false }} />
      <Stack.Screen name="booking-confirmation" options={{ headerShown: false }} />
      <Stack.Screen name="payment" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );

  return (
    <GlobalErrorBoundary>
      <MomentraThemeProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {Platform.OS === 'web' ? (
            <WebLayout landing={isWebLanding}>{content}</WebLayout>
          ) : content}
          <StatusBar style="auto" />
        </ThemeProvider>
      </MomentraThemeProvider>
    </GlobalErrorBoundary>
  );
}

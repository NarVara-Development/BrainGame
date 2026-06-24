import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { usePurchaseStore } from '@/stores/purchaseStore';
import { useLeaderboardSync } from '@/hooks/useLeaderboard';
import { initAdMob } from '@/lib/admob';
import { logAppOpen } from '@/lib/analytics';
import { COLORS } from '@/theme/theme';

export default function RootLayout() {
  const init = useAuthStore((s) => s.init);
  const loadPremium = usePurchaseStore((s) => s.loadPremium);
  useLeaderboardSync();

  useEffect(() => {
    init();
    loadPremium();
    initAdMob();
    logAppOpen();
  }, [init, loadPremium]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.paper },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="play/[game]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT } from '@/theme/theme';

function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 24 : 20 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.ink,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.paper,
          borderTopWidth: 3,
          borderTopColor: COLORS.ink,
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: FONT.display,
          fontSize: 10,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Play', tabBarIcon: ({ focused }) => <Icon emoji="🎮" focused={focused} /> }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{ title: 'Ranks', tabBarIcon: ({ focused }) => <Icon emoji="🏆" focused={focused} /> }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: 'Stats', tabBarIcon: ({ focused }) => <Icon emoji="📊" focused={focused} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'You', tabBarIcon: ({ focused }) => <Icon emoji="⚙️" focused={focused} /> }}
      />
    </Tabs>
  );
}

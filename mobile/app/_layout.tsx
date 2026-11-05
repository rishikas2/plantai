import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { hasCompletedOnboarding } from '../src/services/storage';
import { COLORS } from '../src/constants/theme';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function checkInitialState() {
      const completed = await hasCompletedOnboarding();
      if (!completed && segments[0] !== 'onboarding') {
        router.replace('/onboarding');
      }
      setIsReady(true);
    }
    checkInitialState();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="preview"
          options={{
            title: 'Verify Leaf Photo',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="results"
          options={{
            title: 'Diagnosis Results',
            headerBackTitle: 'Home',
          }}
        />
        <Stack.Screen
          name="comparison"
          options={{
            title: 'Plant Health Comparison',
            headerBackTitle: 'Monitor',
          }}
        />
        <Stack.Screen
          name="disease/[id]"
          options={{
            title: 'Disease Details',
            headerBackTitle: 'Library',
          }}
        />
        <Stack.Screen
          name="history/[id]"
          options={{
            title: 'Previous Scan',
            headerBackTitle: 'History',
          }}
        />
        <Stack.Screen
          name="tips"
          options={{
            title: 'Plant Care Guides',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings & Disclaimers',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}


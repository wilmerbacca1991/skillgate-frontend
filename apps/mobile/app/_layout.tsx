import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React from 'react';

import { AuthProvider } from '@/lib/auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

const skillGateTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#040a16',
    card: '#08162b',
    primary: '#fb923c',
    text: '#e6edf9',
    border: 'rgba(148,163,184,0.2)',
    notification: '#fb923c',
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={skillGateTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: '#040a16',
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="interview-room" />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'SkillGate Mobile',
              headerStyle: {
                backgroundColor: '#08162b',
              },
              headerTintColor: '#e6edf9',
              headerShadowVisible: false,
            }}
          />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </AuthProvider>
  );
}

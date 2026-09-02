import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../hooks/useAuth';
import { CropProvider } from '../context/CropContext';
import { LanguageProvider } from '../context/LanguageContext';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CropProvider>
          <StatusBar style="dark" backgroundColor={Colors.background} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="disease-scanner" options={{ presentation: 'card' }} />
            <Stack.Screen name="crop-lifecycle" options={{ presentation: 'card' }} />
            <Stack.Screen name="irrigation" options={{ presentation: 'card' }} />
            <Stack.Screen name="expenses" options={{ presentation: 'card' }} />
            <Stack.Screen name="market" options={{ presentation: 'card' }} />
            <Stack.Screen name="farm-map" options={{ presentation: 'card' }} />
            <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
            <Stack.Screen name="yield-prediction" options={{ presentation: 'card' }} />
            <Stack.Screen name="harvest" options={{ presentation: 'card' }} />
            <Stack.Screen name="logistics" options={{ presentation: 'card' }} />
            <Stack.Screen name="farm-diary" options={{ presentation: 'card' }} />
          </Stack>
        </CropProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

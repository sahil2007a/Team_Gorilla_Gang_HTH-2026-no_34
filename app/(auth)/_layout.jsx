import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="language" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="farm-setup" />
      <Stack.Screen name="crop-setup" />
    </Stack>
  );
}

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true, // Allow swipe-back to change answers
        animation: 'slide_from_right',
      }}
    />
  );
}

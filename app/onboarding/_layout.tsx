import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swipe-back during onboarding
        animation: 'slide_from_right',
      }}
    />
  );
}

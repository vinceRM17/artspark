import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/components/auth/SessionProvider';
import { useOnboardingStatus } from '@/lib/hooks/useOnboardingStatus';
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
  const { session, isLoading } = useSession();
  const { onboardingComplete, loading: onboardingLoading } = useOnboardingStatus();

  // Show loading spinner while checking session
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7C9A72" />
      </View>
    );
  }

  // Dev bypass: skip auth check in development
  // Redirect to sign-in if no session (production only)
  if (!session && !__DEV__) {
    return <Redirect href="/sign-in" />;
  }

  // Check onboarding status (safety guard for direct navigation/deep links)
  if (onboardingLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7C9A72" />
      </View>
    );
  }

  // Redirect to onboarding if not completed (except in dev mode)
  if (!onboardingComplete && !__DEV__) {
    return <Redirect href="/onboarding/step-1" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: 'History',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="history/[id]"
        options={{
          title: 'Prompt Detail',
          headerShown: true,
        }}
      />
    </Stack>
  );
}

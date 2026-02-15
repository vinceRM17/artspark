import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { useSession } from '@/components/auth/SessionProvider';
import { useOnboardingStatus } from '@/lib/hooks/useOnboardingStatus';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { session, isLoading } = useSession();
  const { onboardingComplete, loading: onboardingLoading } = useOnboardingStatus();

  // Web demo: skip auth and onboarding, go straight to app
  if (Platform.OS === 'web') {
    return <Redirect href="/(auth)" />;
  }

  // Dev bypass: check onboarding status with AsyncStorage bypass support
  if (__DEV__) {
    if (onboardingLoading) {
      return (
        <View className="flex-1 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#7C9A72" />
        </View>
      );
    }

    // In dev, route to onboarding if not completed
    if (onboardingComplete === true) {
      return <Redirect href="/(auth)" />;
    }

    // If false or null (no session / error), go to onboarding in dev
    return <Redirect href="/onboarding/step-1" />;
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7C9A72" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  // Has session, check onboarding status
  if (onboardingLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7C9A72" />
      </View>
    );
  }

  if (onboardingComplete === false) {
    return <Redirect href="/onboarding/step-1" />;
  }

  // onboardingComplete === true or null (proceed to main app)
  return <Redirect href="/(auth)" />;
}

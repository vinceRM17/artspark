import { Redirect } from 'expo-router';
import { useSession } from '@/components/auth/SessionProvider';
import { useOnboardingStatus } from '@/lib/hooks/useOnboardingStatus';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { session, isLoading } = useSession();
  const { onboardingComplete, loading: onboardingLoading } = useOnboardingStatus();

  // Dev bypass: check onboarding status with AsyncStorage bypass support
  if (__DEV__) {
    if (onboardingLoading) {
      return (
        <View className="flex-1 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#7C9A72" />
        </View>
      );
    }

    // In dev, gracefully handle errors by defaulting to main app
    if (onboardingComplete === true) {
      return <Redirect href="/(auth)" />;
    }

    if (onboardingComplete === false) {
      return <Redirect href="/onboarding/step-1" />;
    }

    // If null (error or no session), default to main app in dev
    return <Redirect href="/(auth)" />;
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

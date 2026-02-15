import { useEffect, useRef } from 'react';
import { Redirect, Stack, usePathname } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { useSession } from '@/components/auth/SessionProvider';
import { useOnboardingStatus } from '@/lib/hooks/useOnboardingStatus';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { View, ActivityIndicator } from 'react-native';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AuthLayout() {
  const { session, isLoading } = useSession();
  const { onboardingComplete, loading: onboardingLoading } = useOnboardingStatus();
  const pathname = usePathname();
  const { track } = useAnalytics();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname && pathname !== prevPathname.current) {
      track('screen_view', { screen: pathname });
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${pathname}`,
        level: 'info',
      });
      prevPathname.current = pathname;
    }
  }, [pathname, track]);

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
    <ErrorBoundary>
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
      <Stack.Screen
        name="respond"
        options={{
          title: 'My Portfolio',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="gallery"
        options={{
          title: 'My Gallery',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="challenges"
        options={{
          title: 'Challenges',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="challenges/[id]"
        options={{
          title: 'Challenge',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="badges"
        options={{
          title: 'Achievements',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="bookmarks"
        options={{
          title: 'Saved Prompts',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="recap"
        options={{
          title: 'Weekly Recap',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="packs"
        options={{
          title: 'Prompt Packs',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="privacy"
        options={{
          title: 'Privacy Policy',
          headerShown: true,
        }}
      />
    </Stack>
    </ErrorBoundary>
  );
}

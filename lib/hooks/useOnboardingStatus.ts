import { useState, useEffect } from 'react';
import { useSession } from '@/components/auth/SessionProvider';
import { getPreferences } from '@/lib/services/preferences';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook to check if the current user has completed onboarding
 *
 * Returns:
 * - onboardingComplete: true if completed, false if not, null while loading
 * - loading: true while checking status
 *
 * In __DEV__ mode, supports bypass via AsyncStorage key '@artspark:dev-skip-onboarding'
 */
export function useOnboardingStatus() {
  const { session } = useSession();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkOnboardingStatus() {
      // Check dev bypass first in development mode
      if (__DEV__) {
        try {
          const devSkip = await AsyncStorage.getItem('@artspark:dev-skip-onboarding');
          if (devSkip === 'true') {
            setOnboardingComplete(true);
            setLoading(false);
            return;
          }
        } catch (error) {
          // Ignore AsyncStorage errors in dev bypass check
          console.warn('Failed to check dev bypass:', error);
        }
      }

      // If no user session, can't check onboarding status
      if (!session?.user?.id) {
        setOnboardingComplete(null);
        setLoading(false);
        return;
      }

      try {
        const preferences = await getPreferences(session.user.id);

        if (!preferences || !preferences.onboarding_completed) {
          setOnboardingComplete(false);
        } else {
          setOnboardingComplete(true);
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        setOnboardingComplete(false);
      } finally {
        setLoading(false);
      }
    }

    checkOnboardingStatus();
  }, [session?.user?.id]);

  return { onboardingComplete, loading };
}

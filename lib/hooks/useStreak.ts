/**
 * useStreak hook
 *
 * Provides current and longest streak data with caching.
 * Dev mode returns mock streak data.
 */

import { useState, useEffect, useCallback } from 'react';
import { getStreak, recalculateStreak, StreakData } from '@/lib/services/streaks';
import { useSession } from '@/components/auth/SessionProvider';

const MOCK_STREAK: StreakData = {
  currentStreak: 3,
  longestStreak: 12,
  lastCompletionDate: new Date().toISOString().split('T')[0],
  totalDaysCompleted: 28,
};

export function useStreak(): {
  streak: StreakData;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastCompletionDate: null,
    totalDaysCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const { session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    async function load() {
      if (!userId && __DEV__) {
        setStreak(MOCK_STREAK);
        setLoading(false);
        return;
      }

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getStreak(userId);
        setStreak(data);
      } catch {
        // Keep defaults
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await recalculateStreak(userId);
      setStreak(data);
    } catch {
      // Keep current
    }
  }, [userId]);

  return { streak, loading, refresh };
}

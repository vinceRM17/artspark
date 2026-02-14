/**
 * useChallenges hook
 *
 * Provides challenge data: available challenges, active enrollments, and progress.
 * Dev mode returns mock data.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getActiveChallenges,
  joinChallenge,
  completeChallengeDay,
  leaveChallenge,
  invalidateChallengeCache,
  ActiveChallenge,
} from '@/lib/services/challenges';
import { CHALLENGES } from '@/lib/constants/challenges';
import type { ChallengeDefinition } from '@/lib/constants/challenges';
import { useSession } from '@/components/auth/SessionProvider';

// Dev mode mock data
const MOCK_ACTIVE: ActiveChallenge[] = [
  {
    challenge: CHALLENGES[0], // Watercolor Week
    progress: {
      id: 'dev-progress-1',
      challenge_id: 'watercolor-week',
      started_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      completed_at: null,
      days_completed: 2,
      day_data: [
        { day: 1, completed: true, response_id: 'dev-r1', completed_at: new Date(Date.now() - 2 * 86400000).toISOString() },
        { day: 2, completed: true, response_id: 'dev-r2', completed_at: new Date(Date.now() - 86400000).toISOString() },
        { day: 3, completed: false, response_id: null, completed_at: null },
        { day: 4, completed: false, response_id: null, completed_at: null },
        { day: 5, completed: false, response_id: null, completed_at: null },
        { day: 6, completed: false, response_id: null, completed_at: null },
        { day: 7, completed: false, response_id: null, completed_at: null },
      ],
    },
    currentDay: 3,
  },
];

export function useChallenges(): {
  challenges: ChallengeDefinition[];
  active: ActiveChallenge[];
  loading: boolean;
  error: string | null;
  join: (challengeId: string) => Promise<void>;
  completeDay: (challengeId: string, day: number, responseId: string) => Promise<void>;
  leave: (challengeId: string) => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [active, setActive] = useState<ActiveChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { session } = useSession();
  const userId = session?.user?.id;

  // Load active challenges
  useEffect(() => {
    async function load() {
      if (!userId && __DEV__) {
        setActive(MOCK_ACTIVE);
        setLoading(false);
        return;
      }

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getActiveChallenges(userId);
        setActive(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load challenges');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId && __DEV__) return;
    if (!userId) return;

    try {
      setLoading(true);
      const data = await getActiveChallenges(userId);
      setActive(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const join = useCallback(
    async (challengeId: string) => {
      if (!userId) return;
      await joinChallenge(userId, challengeId);
      await refresh();
    },
    [userId, refresh]
  );

  const completeDay = useCallback(
    async (challengeId: string, day: number, responseId: string) => {
      if (!userId) return;
      await completeChallengeDay(userId, challengeId, day, responseId);
      await refresh();
    },
    [userId, refresh]
  );

  const leave = useCallback(
    async (challengeId: string) => {
      if (!userId) return;
      await leaveChallenge(userId, challengeId);
      await refresh();
    },
    [userId, refresh]
  );

  return {
    challenges: CHALLENGES,
    active,
    loading,
    error,
    join,
    completeDay,
    leave,
    refresh,
  };
}

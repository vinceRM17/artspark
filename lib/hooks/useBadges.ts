/**
 * useBadges hook
 *
 * Evaluates and returns badge unlock status for the current user.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/components/auth/SessionProvider';
import { evaluateBadges, type EvaluatedBadge } from '@/lib/services/badges';

export function useBadges(): {
  badges: EvaluatedBadge[];
  unlockedCount: number;
  totalCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [badges, setBadges] = useState<EvaluatedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const { session } = useSession();
  const userId = session?.user?.id;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await evaluateBadges(userId);
      setBadges(result);
    } catch (err) {
      console.error('Failed to evaluate badges:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;

  return { badges, unlockedCount, totalCount, loading, refresh: load };
}

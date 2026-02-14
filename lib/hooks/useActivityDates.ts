/**
 * useActivityDates hook
 *
 * Wraps the activity dates service for use in components.
 */

import { useState, useEffect } from 'react';
import { useSession } from '@/components/auth/SessionProvider';
import { getActivityDates } from '@/lib/services/activityDates';

export function useActivityDates(): {
  dates: string[];
  loading: boolean;
} {
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const { session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    async function load() {
      try {
        const result = await getActivityDates(userId || '');
        setDates(result);
      } catch (err) {
        console.error('Failed to load activity dates:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  return { dates, loading };
}

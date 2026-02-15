/**
 * useAnalytics hook
 *
 * Returns a `track` function with the current user ID auto-injected.
 */

import { useCallback } from 'react';
import { useSession } from '@/components/auth/SessionProvider';
import { trackEvent } from '@/lib/services/analytics';

export function useAnalytics() {
  const { session } = useSession();
  const userId = session?.user?.id ?? null;

  const track = useCallback(
    (eventName: string, properties: Record<string, unknown> = {}) => {
      trackEvent(eventName, properties, userId);
    },
    [userId]
  );

  return { track };
}

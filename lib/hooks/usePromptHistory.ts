/**
 * usePromptHistory hook
 *
 * Manages prompt history state with pagination, AsyncStorage caching, and refresh support.
 * Fetches paginated prompt history on mount, supports infinite scroll via loadMore,
 * and provides pull-to-refresh capability.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPromptHistory } from '@/lib/services/prompts';
import { PromptWithStatus } from '@/lib/schemas/prompts';
import { useSession } from '@/components/auth/SessionProvider';

const CACHE_KEY = '@artspark:prompt-history';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 20;

type CachedData = {
  data: PromptWithStatus[];
  timestamp: number;
};

/**
 * Invalidate cached prompt history
 * Call this after creating a new response to ensure history reflects new completion status
 */
export async function invalidateHistoryCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}

export function usePromptHistory(): {
  prompts: PromptWithStatus[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
} {
  const [prompts, setPrompts] = useState<PromptWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const { session } = useSession();
  const userId = session?.user?.id;

  const fetchHistory = useCallback(
    async (fromOffset: number, append: boolean) => {
      // Dev mode fallback when no userId
      if (!userId && __DEV__) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

        setPrompts([
          {
            id: 'dev-prompt-1',
            user_id: 'dev',
            date_key: today,
            source: 'daily',
            medium: 'watercolor',
            subject: 'botanicals',
            color_rule: null,
            twist: 'Focus on texture over detail',
            prompt_text: 'Create a watercolor piece featuring botanicals. Focus on texture over detail.',
            created_at: new Date().toISOString(),
            response_count: 1,
            is_completed: true,
          },
          {
            id: 'dev-prompt-2',
            user_id: 'dev',
            date_key: yesterday,
            source: 'daily',
            medium: 'pencil',
            subject: 'landscapes',
            color_rule: 'warm',
            twist: null,
            prompt_text: 'Create a pencil piece featuring landscapes with warm colors.',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            response_count: 0,
            is_completed: false,
          },
          {
            id: 'dev-prompt-3',
            user_id: 'dev',
            date_key: twoDaysAgo,
            source: 'manual',
            medium: 'digital',
            subject: 'abstract',
            color_rule: null,
            twist: 'Use only straight lines',
            prompt_text: 'Create a digital piece featuring abstract. Use only straight lines.',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            response_count: 2,
            is_completed: true,
          },
        ]);
        setLoading(false);
        setHasMore(false);
        return;
      }

      // No userId in production - just stop loading
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // On first load, check cache
        if (fromOffset === 0 && !append) {
          const cachedData = await AsyncStorage.getItem(CACHE_KEY);
          if (cachedData) {
            const parsed: CachedData = JSON.parse(cachedData);
            const age = Date.now() - parsed.timestamp;

            if (age < CACHE_TTL) {
              setPrompts(parsed.data);
              setLoading(false);
              // Continue to fetch fresh data in background
            }
          }
        }

        // Fetch from service
        const { prompts: newPrompts, total } = await getPromptHistory(
          userId,
          PAGE_SIZE,
          fromOffset
        );

        if (append) {
          // Append new prompts
          setPrompts((prev) => [...prev, ...newPrompts]);
        } else {
          // Replace prompts and update cache
          setPrompts(newPrompts);
          await AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              data: newPrompts,
              timestamp: Date.now(),
            } as CachedData)
          );
        }

        // Update pagination state
        setHasMore(fromOffset + newPrompts.length < total);
        setOffset(fromOffset + newPrompts.length);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
        setLoading(false);
      }
    },
    [userId]
  );

  // Fetch on mount when userId changes
  useEffect(() => {
    fetchHistory(0, false);
  }, [fetchHistory]);

  // Load more handler
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchHistory(offset, true);
    }
  }, [loading, hasMore, offset, fetchHistory]);

  // Refresh handler
  const refresh = useCallback(async () => {
    await AsyncStorage.removeItem(CACHE_KEY);
    setOffset(0);
    await fetchHistory(0, false);
  }, [fetchHistory]);

  return {
    prompts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

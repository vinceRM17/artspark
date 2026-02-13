/**
 * useDailyPrompt hook
 *
 * Manages daily prompt state with AsyncStorage caching and on-demand generation.
 * Fetches today's prompt on mount, caches it for the day, supports manual generation.
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayPrompt, createManualPrompt } from '@/lib/services/prompts';
import { Prompt } from '@/lib/schemas/prompts';
import { useSession } from '@/components/auth/SessionProvider';

export function useDailyPrompt(): {
  prompt: Prompt | null;
  loading: boolean;
  error: string | null;
  generating: boolean;
  generateManualPrompt: () => Promise<void>;
} {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { session } = useSession();
  const userId = session?.user?.id;

  // Fetch daily prompt on mount
  useEffect(() => {
    async function fetchDailyPrompt() {
      // Dev mode fallback when no userId
      if (!userId && __DEV__) {
        const today = new Date().toISOString().split('T')[0];
        setPrompt({
          id: 'dev-mock',
          user_id: 'dev',
          date_key: today,
          source: 'daily',
          medium: 'watercolor',
          subject: 'botanicals',
          color_rule: null,
          twist: null,
          prompt_text: 'Create a watercolor piece featuring botanicals. Focus on texture over detail.',
          created_at: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      // No userId in production - just stop loading
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Build cache key with today's date
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `@artspark:daily-prompt:${today}`;

        // Check AsyncStorage cache
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const cachedPrompt = JSON.parse(cachedData) as Prompt;
          setPrompt(cachedPrompt);
          setLoading(false);
          return;
        }

        // No cache - fetch from service
        const fetchedPrompt = await getTodayPrompt(userId);
        setPrompt(fetchedPrompt);

        // Cache the result
        await AsyncStorage.setItem(cacheKey, JSON.stringify(fetchedPrompt));

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prompt');
        setLoading(false);
      }
    }

    fetchDailyPrompt();
  }, [userId]);

  // Generate manual prompt on demand
  async function handleGenerateManualPrompt() {
    if (!userId) return;

    setGenerating(true);
    setError(null);

    try {
      const manualPrompt = await createManualPrompt(userId);
      setPrompt(manualPrompt); // Replace displayed prompt
      // Do NOT cache manual prompts
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate prompt');
    } finally {
      setGenerating(false);
    }
  }

  return {
    prompt,
    loading,
    error,
    generating,
    generateManualPrompt: handleGenerateManualPrompt,
  };
}

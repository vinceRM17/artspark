/**
 * useDailyPrompt hook
 *
 * Manages daily prompt state with AsyncStorage caching and on-demand generation.
 * In dev mode, reads onboarding preferences from AsyncStorage and generates
 * preference-aware mock prompts locally.
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayPrompt, createManualPrompt } from '@/lib/services/prompts';
import { Prompt } from '@/lib/schemas/prompts';
import { useSession } from '@/components/auth/SessionProvider';
import { getTwistsForMedium } from '@/lib/constants/twists';
import { getPromptTemplate } from '@/lib/constants/promptTemplates';

const ONBOARDING_KEY = '@artspark:onboarding-progress';
const DEV_PREFS_KEY = '@artspark:dev-preferences';

type DevPreferences = {
  mediums: string[];
  subjects: string[];
  exclusions: string[];
  colorPalettes: string[];
};

const DEFAULT_DEV_PREFS: DevPreferences = {
  mediums: ['watercolor', 'pencil', 'ink'],
  subjects: ['botanicals', 'landscapes', 'animals'],
  exclusions: [],
  colorPalettes: [],
};

/**
 * Load user preferences for dev mode from AsyncStorage
 * Checks onboarding progress first, then saved dev prefs
 */
async function loadDevPreferences(): Promise<DevPreferences> {
  try {
    // Check onboarding progress (set during onboarding steps)
    const progressJson = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (progressJson) {
      const progress = JSON.parse(progressJson);
      if (progress.mediums?.length > 0 || progress.subjects?.length > 0) {
        const prefs: DevPreferences = {
          mediums: progress.mediums || DEFAULT_DEV_PREFS.mediums,
          subjects: progress.subjects || DEFAULT_DEV_PREFS.subjects,
          exclusions: progress.exclusions || [],
          colorPalettes: progress.colorPalettes || [],
        };
        // Cache for future use
        await AsyncStorage.setItem(DEV_PREFS_KEY, JSON.stringify(prefs));
        return prefs;
      }
    }

    // Check cached dev preferences
    const cachedJson = await AsyncStorage.getItem(DEV_PREFS_KEY);
    if (cachedJson) {
      return JSON.parse(cachedJson);
    }
  } catch {
    // Fall through to defaults
  }

  return DEFAULT_DEV_PREFS;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a preference-aware mock prompt for dev mode
 */
function generateDevPrompt(prefs: DevPreferences, source: 'daily' | 'manual'): Prompt {
  const medium = randomItem(prefs.mediums);

  // Filter subjects by exclusions
  const eligible = prefs.subjects.filter(s => !prefs.exclusions.includes(s));
  const subject = randomItem(eligible.length > 0 ? eligible : prefs.subjects);

  // Color rule: ~40% chance if user has palettes
  const color_rule = prefs.colorPalettes.length > 0 && Math.random() < 0.4
    ? randomItem(prefs.colorPalettes)
    : null;

  // Twist: ~50% chance, medium-compatible
  const compatibleTwists = getTwistsForMedium(medium);
  const twist = Math.random() < 0.5 && compatibleTwists.length > 0
    ? randomItem(compatibleTwists).text
    : null;

  // Build artistically meaningful prompt text
  let promptText = getPromptTemplate(medium, subject);
  if (color_rule) {
    const colorLabels: Record<string, string> = {
      'earthy': 'earthy', 'vibrant': 'vibrant', 'monochrome': 'monochrome',
      'pastels': 'pastel', 'complementary': 'complementary', 'warm': 'warm',
      'cool': 'cool', 'random-ok': 'any',
    };
    const colorLabel = colorLabels[color_rule] || color_rule;
    if (color_rule !== 'random-ok') {
      promptText += `. Work with a ${colorLabel} palette`;
    }
  }
  if (twist) {
    promptText += `. ${twist}`;
  }
  if (!promptText.endsWith('.')) {
    promptText += '.';
  }

  return {
    id: source === 'daily' ? 'dev-mock' : `dev-manual-${Date.now()}`,
    user_id: 'dev',
    date_key: new Date().toISOString().split('T')[0],
    source,
    medium,
    subject,
    color_rule,
    twist,
    prompt_text: promptText,
    created_at: new Date().toISOString(),
  };
}

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
  const [devPrefs, setDevPrefs] = useState<DevPreferences | null>(null);

  const { session } = useSession();
  const userId = session?.user?.id;

  // Load dev preferences on mount
  useEffect(() => {
    if (!userId && __DEV__) {
      loadDevPreferences().then(setDevPrefs);
    }
  }, [userId]);

  // Fetch daily prompt on mount
  useEffect(() => {
    async function fetchDailyPrompt() {
      // Dev mode fallback when no userId
      if (!userId && __DEV__) {
        const prefs = await loadDevPreferences();
        setDevPrefs(prefs);
        setPrompt(generateDevPrompt(prefs, 'daily'));
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
    // Dev mode: generate a preference-aware mock prompt
    if (!userId && __DEV__) {
      setGenerating(true);
      const prefs = devPrefs || await loadDevPreferences();
      setPrompt(generateDevPrompt(prefs, 'manual'));
      setGenerating(false);
      return;
    }

    if (!userId) return;

    setGenerating(true);
    setError(null);

    try {
      const manualPrompt = await createManualPrompt(userId);
      setPrompt(manualPrompt);
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

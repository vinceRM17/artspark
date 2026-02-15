/**
 * useDailyPrompt hook
 *
 * Manages daily prompt state with AsyncStorage caching and on-demand generation.
 * In dev mode, reads onboarding preferences from AsyncStorage and generates
 * preference-aware mock prompts locally with skill-aligned templates.
 *
 * Tracks recent selections to avoid repetitive medium/subject/template combos.
 */

import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayPrompt, createManualPrompt } from '@/lib/services/prompts';
import { Prompt } from '@/lib/schemas/prompts';
import { useSession } from '@/components/auth/SessionProvider';
import { getTwistsForMedium } from '@/lib/constants/twists';
import { getPromptTemplate } from '@/lib/constants/promptTemplates';
import { getDifficultyOption, DifficultyLevel } from '@/lib/constants/difficulty';
import { COLOR_PALETTE_OPTIONS } from '@/lib/constants/preferences';

const ONBOARDING_KEY = '@artspark:onboarding-progress';
const DEV_PREFS_KEY = '@artspark:dev-preferences';
const FREQUENCY_KEY = '@artspark:prompt-frequency';

type PromptFrequency = 'daily' | 'every-other-day' | 'weekdays' | 'weekly';

/**
 * Check if today is a prompt day based on the user's frequency setting
 */
function isPromptDay(frequency: PromptFrequency): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  switch (frequency) {
    case 'daily':
      return true;
    case 'every-other-day': {
      // Use day-of-year to alternate
      const start = new Date(now.getFullYear(), 0, 0);
      const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
      return dayOfYear % 2 === 0;
    }
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekly':
      return dayOfWeek === 1; // Mondays
    default:
      return true;
  }
}

type DevPreferences = {
  mediums: string[];
  subjects: string[];
  exclusions: string[];
  colorPalettes: string[];
  difficulty: DifficultyLevel;
};

const DEFAULT_DEV_PREFS: DevPreferences = {
  mediums: ['watercolor', 'pencil', 'ink'],
  subjects: ['botanicals', 'landscapes', 'animals'],
  exclusions: [],
  colorPalettes: [],
  difficulty: 'developing',
};

/**
 * Kids-level encouragements for dev mode prompts
 */
const KIDS_TIPS = [
  "Remember: there's no wrong way to make art — have fun!",
  "You're doing great! Every artist started just like you.",
  "Art is about having fun — don't worry about making it perfect!",
  "Try using your favorite colors — what makes you happy?",
  "Show someone your art when you're done — they'll love it!",
];

/**
 * Explorer-level tips for dev mode prompts
 */
const EXPLORER_TIPS = [
  "Tip: Start with light pencil guidelines before adding color.",
  "Tip: Take a moment to observe your subject before making any marks.",
  "Tip: Don't worry about perfection — focus on the process and enjoy it!",
  "Tip: Work from large shapes to small details.",
  "Tip: Squint at your subject to see the big value patterns.",
];

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
        // Handle legacy difficulty values
        const legacyMap: Record<string, DifficultyLevel> = {
          beginner: 'explorer',
          intermediate: 'developing',
          advanced: 'confident',
        };
        const rawDifficulty = progress.difficulty || 'developing';
        const difficulty: DifficultyLevel = legacyMap[rawDifficulty] || rawDifficulty;

        const prefs: DevPreferences = {
          mediums: progress.mediums || DEFAULT_DEV_PREFS.mediums,
          subjects: progress.subjects || DEFAULT_DEV_PREFS.subjects,
          exclusions: progress.exclusions || [],
          colorPalettes: progress.colorPalettes || [],
          difficulty,
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

/**
 * Pick a random item from an array, avoiding recently used items.
 * Falls back to any item if all have been used recently.
 */
function pickAvoiding<T>(arr: T[], recent: T[], maxRecent: number = 3): T {
  // Filter out recently used
  const fresh = arr.filter(item => !recent.includes(item));
  if (fresh.length > 0) {
    return fresh[Math.floor(Math.random() * fresh.length)];
  }
  // All used recently — pick random from full list
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Recent history to avoid repetition across manual prompt generation */
type RecentHistory = {
  mediums: string[];
  subjects: string[];
  promptTexts: string[];
};

/**
 * Generate a preference-aware mock prompt for dev mode
 * Uses history to avoid back-to-back repeats of medium, subject, and template
 */
function generateDevPrompt(
  prefs: DevPreferences,
  source: 'daily' | 'manual',
  history: RecentHistory
): Prompt {
  // Pick medium avoiding recent ones
  const medium = pickAvoiding(prefs.mediums, history.mediums);

  // Filter subjects by exclusions, then pick avoiding recent
  const eligible = prefs.subjects.filter(s => !prefs.exclusions.includes(s));
  const subjectPool = eligible.length > 0 ? eligible : prefs.subjects;
  const subject = pickAvoiding(subjectPool, history.subjects);

  // Get difficulty settings with new fields
  const difficulty = getDifficultyOption(prefs.difficulty);

  // Color rule: chance based on difficulty level
  const color_rule = prefs.colorPalettes.length > 0 && Math.random() < difficulty.colorRuleChance
    ? randomItem(prefs.colorPalettes)
    : null;

  // Twist: chance based on difficulty, medium-compatible
  const compatibleTwists = getTwistsForMedium(medium);
  const twist = Math.random() < difficulty.twistChance && compatibleTwists.length > 0
    ? randomItem(compatibleTwists).text
    : null;

  // Generate prompt text, retrying if we get a repeat
  let promptText = getPromptTemplate(medium, subject, difficulty.templateTier);
  let attempts = 0;
  while (history.promptTexts.includes(promptText) && attempts < 5) {
    promptText = getPromptTemplate(medium, subject, difficulty.templateTier);
    attempts++;
  }

  if (color_rule) {
    const colorLabel = COLOR_PALETTE_OPTIONS.find(c => c.id === color_rule)?.label || color_rule;
    if (color_rule !== 'random-ok') {
      promptText += `. Work with a ${colorLabel.toLowerCase()} palette`;
    }
  }
  if (twist) {
    promptText += `. ${twist}`;
  }
  if (!promptText.endsWith('.')) {
    promptText += '.';
  }

  // Append encouraging tip for kids/explorer levels
  if (difficulty.id === 'kids') {
    promptText += ' ' + randomItem(KIDS_TIPS);
  } else if (difficulty.id === 'explorer') {
    promptText += ' ' + randomItem(EXPLORER_TIPS);
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
  isRestDay: boolean;
  generateManualPrompt: () => Promise<void>;
} {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [devPrefs, setDevPrefs] = useState<DevPreferences | null>(null);
  const [isRestDay, setIsRestDay] = useState(false);

  // Track recent selections to prevent repetition
  const historyRef = useRef<RecentHistory>({
    mediums: [],
    subjects: [],
    promptTexts: [],
  });

  const { session } = useSession();
  const userId = session?.user?.id;

  /** Record a prompt in the recent history ring buffer */
  function recordHistory(p: Prompt) {
    const h = historyRef.current;
    h.mediums = [p.medium, ...h.mediums].slice(0, 4);
    h.subjects = [p.subject, ...h.subjects].slice(0, 4);
    h.promptTexts = [p.prompt_text, ...h.promptTexts].slice(0, 6);
  }

  // Load dev preferences on mount
  useEffect(() => {
    if (!userId && __DEV__) {
      loadDevPreferences().then(setDevPrefs);
    }
  }, [userId]);

  // Fetch daily prompt on mount
  useEffect(() => {
    async function fetchDailyPrompt() {
      // Check prompt frequency setting
      const storedFrequency = await AsyncStorage.getItem(FREQUENCY_KEY);
      const frequency = (storedFrequency as PromptFrequency) || 'daily';
      if (!isPromptDay(frequency)) {
        setIsRestDay(true);
        setLoading(false);
        return;
      }

      // Dev mode fallback when no userId
      if (!userId && __DEV__) {
        const prefs = await loadDevPreferences();
        setDevPrefs(prefs);
        const p = generateDevPrompt(prefs, 'daily', historyRef.current);
        recordHistory(p);
        setPrompt(p);
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
          recordHistory(cachedPrompt);
          setPrompt(cachedPrompt);
          setLoading(false);
          return;
        }

        // No cache - fetch from service
        const fetchedPrompt = await getTodayPrompt(userId);
        recordHistory(fetchedPrompt);
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
      const p = generateDevPrompt(prefs, 'manual', historyRef.current);
      recordHistory(p);
      setPrompt(p);
      setGenerating(false);
      return;
    }

    if (!userId) return;

    setGenerating(true);
    setError(null);

    try {
      const manualPrompt = await createManualPrompt(userId);
      recordHistory(manualPrompt);
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
    isRestDay,
    generateManualPrompt: handleGenerateManualPrompt,
  };
}

/**
 * Streak tracking service
 *
 * Calculates art-making streaks based on response submission dates.
 * A "streak day" = at least one response submitted on that calendar date.
 */

import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_CACHE_KEY = '@artspark:streak-data';
const STREAK_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null; // YYYY-MM-DD
  totalDaysCompleted: number;
};

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletionDate: null,
  totalDaysCompleted: 0,
};

/**
 * Get today's date as YYYY-MM-DD in local timezone
 */
function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if two date strings are consecutive days
 */
function isConsecutive(dateA: string, dateB: string): boolean {
  const a = new Date(dateA + 'T12:00:00');
  const b = new Date(dateB + 'T12:00:00');
  const diffMs = Math.abs(a.getTime() - b.getTime());
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * Calculate streak data from an array of completion dates (sorted descending)
 */
function calculateStreaks(dates: string[]): StreakData {
  if (dates.length === 0) return DEFAULT_STREAK;

  const today = getLocalDateKey();
  const yesterday = getLocalDateKey(new Date(Date.now() - 86400000));

  // Current streak: walk backwards from today/yesterday
  let currentStreak = 0;
  const mostRecent = dates[0];

  if (mostRecent === today || mostRecent === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      if (isConsecutive(dates[i], dates[i - 1])) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak: scan all dates
  let longestStreak = 1;
  let runLength = 1;
  for (let i = 1; i < dates.length; i++) {
    if (isConsecutive(dates[i], dates[i - 1])) {
      runLength++;
      longestStreak = Math.max(longestStreak, runLength);
    } else {
      runLength = 1;
    }
  }

  // Ensure current streak is counted in longest
  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    lastCompletionDate: mostRecent,
    totalDaysCompleted: dates.length,
  };
}

/**
 * Fetch streak data for a user from Supabase
 */
export async function getStreak(userId: string): Promise<StreakData> {
  // Check cache first
  try {
    const cached = await AsyncStorage.getItem(STREAK_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < STREAK_CACHE_TTL) {
        return data as StreakData;
      }
    }
  } catch {
    // Cache miss, continue
  }

  // Query distinct completion dates
  const { data, error } = await supabase
    .from('responses')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch streak data:', error);
    return DEFAULT_STREAK;
  }

  // Extract unique dates (local timezone)
  const dateSet = new Set<string>();
  for (const row of data || []) {
    dateSet.add(getLocalDateKey(new Date(row.created_at)));
  }

  // Sort descending
  const dates = Array.from(dateSet).sort().reverse();
  const streakData = calculateStreaks(dates);

  // Cache result
  try {
    await AsyncStorage.setItem(
      STREAK_CACHE_KEY,
      JSON.stringify({ data: streakData, timestamp: Date.now() })
    );
  } catch {
    // Non-critical
  }

  return streakData;
}

/**
 * Recalculate and update cached streak data
 * Call after a new response is submitted
 */
export async function recalculateStreak(userId: string): Promise<StreakData> {
  // Invalidate cache
  await AsyncStorage.removeItem(STREAK_CACHE_KEY);
  // Fetch fresh
  return getStreak(userId);
}

/**
 * Invalidate the streak cache (for external callers)
 */
export async function invalidateStreakCache(): Promise<void> {
  await AsyncStorage.removeItem(STREAK_CACHE_KEY);
}

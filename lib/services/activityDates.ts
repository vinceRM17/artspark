/**
 * Activity dates service
 *
 * Provides dates when user created artwork, medium counts, and total artwork count.
 * Used by calendar heatmap and badge evaluation.
 */

import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@artspark:activity-dates';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

type CachedData = {
  dates: string[];
  mediumCounts: Record<string, number>;
  totalCount: number;
  timestamp: number;
};

// Dev mode mock data
function getMockData(): CachedData {
  const today = new Date();
  const dates: string[] = [];
  // Generate ~30 random activity days over the last 90 days
  for (let i = 0; i < 90; i++) {
    if (Math.random() < 0.35) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(formatDate(d));
    }
  }
  return {
    dates,
    mediumCounts: {
      watercolor: 12,
      pencil: 8,
      ink: 5,
      acrylic: 3,
      digital: 2,
    },
    totalCount: 30,
    timestamp: Date.now(),
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function fetchAndCache(userId: string): Promise<CachedData> {
  const { data, error } = await supabase
    .from('responses')
    .select('created_at, prompts!inner(medium)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch activity dates: ${error.message}`);
  }

  const dateSet = new Set<string>();
  const mediumCounts: Record<string, number> = {};

  for (const row of data || []) {
    const dateKey = formatDate(new Date(row.created_at));
    dateSet.add(dateKey);

    const medium = (row as any).prompts?.medium || 'unknown';
    mediumCounts[medium] = (mediumCounts[medium] || 0) + 1;
  }

  const cached: CachedData = {
    dates: Array.from(dateSet).sort().reverse(),
    mediumCounts,
    totalCount: data?.length || 0,
    timestamp: Date.now(),
  };

  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Non-critical
  }

  return cached;
}

async function getCachedOrFetch(userId: string): Promise<CachedData> {
  // Dev mode
  if (!userId && __DEV__) {
    return getMockData();
  }

  // Check cache
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: CachedData = JSON.parse(raw);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached;
      }
    }
  } catch {
    // Cache miss
  }

  return fetchAndCache(userId);
}

/**
 * Get dates (YYYY-MM-DD) when user created art
 */
export async function getActivityDates(userId: string): Promise<string[]> {
  const data = await getCachedOrFetch(userId);
  return data.dates;
}

/**
 * Get count of artworks per medium
 */
export async function getMediumCounts(
  userId: string
): Promise<Record<string, number>> {
  const data = await getCachedOrFetch(userId);
  return data.mediumCounts;
}

/**
 * Get total number of artworks
 */
export async function getTotalArtworkCount(userId: string): Promise<number> {
  const data = await getCachedOrFetch(userId);
  return data.totalCount;
}

/**
 * Invalidate activity dates cache
 */
export async function invalidateActivityCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}

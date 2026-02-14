/**
 * Weekly art recap service
 *
 * Computes a summary of the user's art activity for the past 7 days:
 * pieces created, mediums used, streak, and motivational message.
 */

import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MEDIUM_OPTIONS } from '@/lib/constants/preferences';

const RECAP_CACHE_KEY = '@artspark:weekly-recap';
const RECAP_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export type WeeklyRecap = {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;
  piecesCreated: number;
  mediumsUsed: { id: string; label: string; count: number }[];
  subjectsExplored: number;
  currentStreak: number;
  message: string;
};

function getLabel(id: string): string {
  return MEDIUM_OPTIONS.find(o => o.id === id)?.label || id;
}

function getMotivationalMessage(pieces: number, streak: number): string {
  if (pieces === 0) return "This week's a blank canvas — ready to make your first mark?";
  if (pieces >= 7) return "Every single day! You're on fire. Keep that creative energy flowing.";
  if (pieces >= 5) return "What a productive week! Your dedication is showing in your art.";
  if (pieces >= 3) return "Great momentum this week! Each piece is building your skills.";
  if (streak >= 3) return `${streak}-day streak! Consistency is the secret to growth.`;
  return "You showed up and created — that's what matters most.";
}

export async function getWeeklyRecap(userId: string): Promise<WeeklyRecap> {
  // Check cache
  try {
    const cached = await AsyncStorage.getItem(RECAP_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < RECAP_CACHE_TTL) {
        return data;
      }
    }
  } catch {}

  // Calculate week boundaries (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  // Dev mode mock
  if (!userId || (__DEV__ && userId === 'dev-user')) {
    const mockRecap: WeeklyRecap = {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      piecesCreated: 4,
      mediumsUsed: [
        { id: 'watercolor', label: 'Watercolor', count: 2 },
        { id: 'pencil', label: 'Pencil', count: 1 },
        { id: 'ink', label: 'Ink', count: 1 },
      ],
      subjectsExplored: 3,
      currentStreak: 3,
      message: getMotivationalMessage(4, 3),
    };
    return mockRecap;
  }

  // Query responses from this week
  const { data, error } = await supabase
    .from('responses')
    .select('created_at, prompts!inner(medium, subject)')
    .eq('user_id', userId)
    .gte('created_at', weekStart.toISOString())
    .lte('created_at', weekEnd.toISOString());

  if (error) throw error;

  const rows = data || [];
  const piecesCreated = rows.length;

  // Count mediums
  const mediumCounts: Record<string, number> = {};
  const subjectSet = new Set<string>();
  for (const row of rows) {
    const prompt = (row as any).prompts;
    if (prompt?.medium) {
      mediumCounts[prompt.medium] = (mediumCounts[prompt.medium] || 0) + 1;
    }
    if (prompt?.subject) {
      subjectSet.add(prompt.subject);
    }
  }

  const mediumsUsed = Object.entries(mediumCounts)
    .map(([id, count]) => ({ id, label: getLabel(id), count }))
    .sort((a, b) => b.count - a.count);

  // Get streak for message
  const { getStreak } = await import('./streaks');
  const streakData = await getStreak(userId);

  const recap: WeeklyRecap = {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    piecesCreated,
    mediumsUsed,
    subjectsExplored: subjectSet.size,
    currentStreak: streakData.currentStreak,
    message: getMotivationalMessage(piecesCreated, streakData.currentStreak),
  };

  // Cache
  try {
    await AsyncStorage.setItem(RECAP_CACHE_KEY, JSON.stringify({ data: recap, timestamp: Date.now() }));
  } catch {}

  return recap;
}

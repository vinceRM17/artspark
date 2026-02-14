/**
 * Challenges service
 *
 * Manages challenge enrollment, progress tracking, and completion.
 * Uses the challenge_progress table in Supabase.
 */

import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHALLENGES, getChallengeById } from '@/lib/constants/challenges';
import type { ChallengeDefinition } from '@/lib/constants/challenges';

const CACHE_KEY = '@artspark:challenges';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export type DayProgress = {
  day: number;
  completed: boolean;
  response_id: string | null;
  completed_at: string | null;
};

export type ChallengeProgress = {
  id: string;
  challenge_id: string;
  started_at: string;
  completed_at: string | null;
  days_completed: number;
  day_data: DayProgress[];
};

export type ActiveChallenge = {
  challenge: ChallengeDefinition;
  progress: ChallengeProgress;
  currentDay: number; // 1-indexed day the user is on
};

/**
 * Get all active challenge progress records for a user
 */
export async function getUserChallenges(
  userId: string
): Promise<ChallengeProgress[]> {
  const { data, error } = await supabase
    .from('challenge_progress')
    .select('*')
    .eq('user_id', userId)
    .is('completed_at', null)
    .order('started_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch challenges: ${error.message}`);
  }

  return (data || []).map(row => ({
    id: row.id,
    challenge_id: row.challenge_id,
    started_at: row.started_at,
    completed_at: row.completed_at,
    days_completed: row.days_completed,
    day_data: row.day_data || [],
  }));
}

/**
 * Get progress for a specific challenge
 */
export async function getUserChallengeProgress(
  userId: string,
  challengeId: string
): Promise<ChallengeProgress | null> {
  const { data, error } = await supabase
    .from('challenge_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .is('completed_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch challenge progress: ${error.message}`);
  }

  if (!data) return null;

  return {
    id: data.id,
    challenge_id: data.challenge_id,
    started_at: data.started_at,
    completed_at: data.completed_at,
    days_completed: data.days_completed,
    day_data: data.day_data || [],
  };
}

/**
 * Join a challenge — creates a progress record
 */
export async function joinChallenge(
  userId: string,
  challengeId: string
): Promise<ChallengeProgress> {
  const challenge = getChallengeById(challengeId);
  if (!challenge) {
    throw new Error(`Challenge not found: ${challengeId}`);
  }

  // Check if already enrolled
  const existing = await getUserChallengeProgress(userId, challengeId);
  if (existing) {
    return existing;
  }

  // Initialize day_data array
  const dayData: DayProgress[] = Array.from(
    { length: challenge.duration },
    (_, i) => ({
      day: i + 1,
      completed: false,
      response_id: null,
      completed_at: null,
    })
  );

  const { data, error } = await supabase
    .from('challenge_progress')
    .insert({
      user_id: userId,
      challenge_id: challengeId,
      days_completed: 0,
      day_data: dayData,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to join challenge: ${error.message}`);
  }

  await invalidateChallengeCache();

  return {
    id: data.id,
    challenge_id: data.challenge_id,
    started_at: data.started_at,
    completed_at: data.completed_at,
    days_completed: data.days_completed,
    day_data: data.day_data || [],
  };
}

/**
 * Mark a challenge day as completed
 */
export async function completeChallengeDay(
  userId: string,
  challengeId: string,
  day: number,
  responseId: string
): Promise<ChallengeProgress> {
  const progress = await getUserChallengeProgress(userId, challengeId);
  if (!progress) {
    throw new Error('Not enrolled in this challenge');
  }

  const challenge = getChallengeById(challengeId);
  if (!challenge) {
    throw new Error(`Challenge not found: ${challengeId}`);
  }

  // Update day_data
  const updatedDayData = progress.day_data.map(d =>
    d.day === day
      ? {
          ...d,
          completed: true,
          response_id: responseId,
          completed_at: new Date().toISOString(),
        }
      : d
  );

  const daysCompleted = updatedDayData.filter(d => d.completed).length;
  const isFullyComplete = daysCompleted >= challenge.duration;

  const { data, error } = await supabase
    .from('challenge_progress')
    .update({
      day_data: updatedDayData,
      days_completed: daysCompleted,
      completed_at: isFullyComplete ? new Date().toISOString() : null,
    })
    .eq('id', progress.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update challenge: ${error.message}`);
  }

  await invalidateChallengeCache();

  return {
    id: data.id,
    challenge_id: data.challenge_id,
    started_at: data.started_at,
    completed_at: data.completed_at,
    days_completed: data.days_completed,
    day_data: data.day_data || [],
  };
}

/**
 * Leave/abandon a challenge
 */
export async function leaveChallenge(
  userId: string,
  challengeId: string
): Promise<void> {
  const { error } = await supabase
    .from('challenge_progress')
    .delete()
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .is('completed_at', null);

  if (error) {
    throw new Error(`Failed to leave challenge: ${error.message}`);
  }

  await invalidateChallengeCache();
}

/**
 * Get active challenges with their definitions and current day
 */
export async function getActiveChallenges(
  userId: string
): Promise<ActiveChallenge[]> {
  const progressList = await getUserChallenges(userId);

  return progressList
    .map(progress => {
      const challenge = getChallengeById(progress.challenge_id);
      if (!challenge) return null;

      // Calculate current day (days since start + 1)
      const startDate = new Date(progress.started_at);
      const now = new Date();
      const diffMs = now.getTime() - startDate.getTime();
      const currentDay = Math.min(
        Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1,
        challenge.duration
      );

      return { challenge, progress, currentDay };
    })
    .filter((item): item is ActiveChallenge => item !== null);
}

/**
 * Invalidate challenge cache
 */
export async function invalidateChallengeCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}

/**
 * Supabase preferences service
 *
 * Requires user_preferences table in Supabase -- see SQL migration in plan 02-02 or create manually.
 *
 * Run this in Supabase SQL Editor:
 *
 * CREATE TABLE user_preferences (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   onboarding_completed BOOLEAN DEFAULT FALSE,
 *   art_mediums TEXT[] NOT NULL DEFAULT '{}',
 *   color_palettes TEXT[] DEFAULT '{}',
 *   subjects TEXT[] NOT NULL DEFAULT '{}',
 *   exclusions TEXT[] DEFAULT '{}',
 *   notification_time TIME DEFAULT '09:00:00',
 *   notification_enabled BOOLEAN DEFAULT TRUE,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW(),
 *   UNIQUE(user_id)
 * );
 *
 * ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Users can read own preferences"
 *   ON user_preferences FOR SELECT
 *   USING (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can insert own preferences"
 *   ON user_preferences FOR INSERT
 *   WITH CHECK (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can update own preferences"
 *   ON user_preferences FOR UPDATE
 *   USING (auth.uid() = user_id);
 */

import { supabase } from '@/lib/supabase';

export type UserPreferences = {
  id: string;
  user_id: string;
  onboarding_completed: boolean;
  art_mediums: string[];
  color_palettes: string[];
  subjects: string[];
  exclusions: string[];
  difficulty: string; // 'beginner' | 'intermediate' | 'advanced'
  notification_time: string; // HH:MM:SS format
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Save or update user preferences
 * Uses upsert to handle both create and update cases
 */
export async function savePreferences(
  userId: string,
  preferences: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to save preferences');

  return data as UserPreferences;
}

/**
 * Get user preferences
 * Returns null if no preferences exist yet (user hasn't completed onboarding)
 */
export async function getPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Handle "no rows" error gracefully - user hasn't completed onboarding yet
  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as UserPreferences;
}

/**
 * Mark onboarding as complete for a user
 */
export async function markOnboardingComplete(userId: string): Promise<UserPreferences> {
  return savePreferences(userId, { onboarding_completed: true });
}

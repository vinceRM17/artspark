/**
 * Prompt generation service
 *
 * Core engine for generating personalized daily art prompts from user preferences.
 * Handles subject rotation (14-day window), exclusion filtering, skill-aligned
 * template selection, and date-based deduplication.
 */

import { supabase } from '@/lib/supabase';
import { getPreferences, UserPreferences } from './preferences';
import { MEDIUM_OPTIONS, SUBJECT_OPTIONS, COLOR_PALETTE_OPTIONS } from '@/lib/constants/preferences';
import { getTwistsForMedium } from '@/lib/constants/twists';
import { getPromptTemplate } from '@/lib/constants/promptTemplates';
import { getDifficultyOption } from '@/lib/constants/difficulty';
import { Prompt, PromptWithStatus } from '@/lib/schemas/prompts';

// Re-export Prompt type for convenience
export type { Prompt } from '@/lib/schemas/prompts';

/**
 * Get today's date in UTC YYYY-MM-DD format
 * Used as date_key for all prompt operations
 */
function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get random item from array
 */
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Explorer-level tips appended to prompts for beginners
 */
const EXPLORER_TIPS = [
  "Tip: Start with light pencil guidelines before adding color.",
  "Tip: Take a moment to observe your subject before making any marks.",
  "Tip: Don't worry about perfection — focus on the process and enjoy it!",
  "Tip: Work from large shapes to small details.",
  "Tip: Squint at your subject to see the big value patterns.",
  "Tip: Take breaks and come back with fresh eyes.",
  "Tip: Use a reference photo if you need one — all artists do!",
];

/**
 * Get eligible subjects for prompt generation
 * Filters out:
 * 1. Excluded subjects (user preferences)
 * 2. Recently used subjects (within repeatWindowDays)
 *
 * Graceful fallback: if all subjects are recently used,
 * returns subjects minus exclusions (allowing repeats but respecting exclusions)
 */
async function getEligibleSubjects(
  userId: string,
  userSubjects: string[],
  exclusions: string[],
  repeatWindowDays: number = 14
): Promise<string[]> {
  // Calculate cutoff date for recent subjects
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - repeatWindowDays);
  const cutoffISO = cutoffDate.toISOString();

  // Query recent subjects
  const { data: recentPrompts, error } = await supabase
    .from('prompts')
    .select('subject')
    .eq('user_id', userId)
    .gte('created_at', cutoffISO)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Build set of recently used subjects
  const recentSubjects = new Set(recentPrompts?.map(p => p.subject) || []);

  // Filter: remove exclusions AND recent subjects
  const eligible = userSubjects.filter(
    subject => !exclusions.includes(subject) && !recentSubjects.has(subject)
  );

  // Graceful fallback: if no eligible subjects, allow repeats but still respect exclusions
  if (eligible.length === 0) {
    return userSubjects.filter(subject => !exclusions.includes(subject));
  }

  return eligible;
}

/**
 * Assemble human-readable prompt text using artistically meaningful templates
 * Pairs medium + subject with appropriate artistic direction based on skill tier
 */
function assemblePromptText(
  medium: string,
  subject: string,
  colorRule: string | null,
  twist: string | null,
  difficulty: ReturnType<typeof getDifficultyOption>
): string {
  // Get an artistically meaningful base prompt filtered by skill tier
  let prompt = getPromptTemplate(medium, subject, difficulty.templateTier);

  // Add color direction if present
  if (colorRule) {
    const colorLabel = COLOR_PALETTE_OPTIONS.find(c => c.id === colorRule)?.label || colorRule;
    prompt += `. Work with a ${colorLabel.toLowerCase()} palette`;
  }

  // Add twist if present
  if (twist) {
    prompt += `. ${twist}`;
  }

  // Ensure it ends with a period
  if (!prompt.endsWith('.')) {
    prompt += '.';
  }

  // For explorer level, append a helpful tip
  if (difficulty.id === 'explorer') {
    prompt += ' ' + randomItem(EXPLORER_TIPS);
  }

  return prompt;
}

/**
 * Generate prompt data from user preferences
 * Does not save to database - returns prompt data object
 */
async function generatePrompt(
  userId: string,
  preferences: UserPreferences,
  source: 'daily' | 'manual'
): Promise<{
  source: 'daily' | 'manual';
  medium: string;
  subject: string;
  color_rule: string | null;
  twist: string | null;
  prompt_text: string;
}> {
  // Pick random medium
  const medium = randomItem(preferences.art_mediums);

  // Get eligible subjects and pick one
  const eligibleSubjects = await getEligibleSubjects(
    userId,
    preferences.subjects,
    preferences.exclusions || [],
    14
  );
  const subject = randomItem(eligibleSubjects);

  // Get difficulty settings
  const difficulty = getDifficultyOption(preferences.difficulty || 'developing');

  // Color rule: chance based on difficulty level
  const color_rule =
    preferences.color_palettes && preferences.color_palettes.length > 0 && Math.random() < difficulty.colorRuleChance
      ? randomItem(preferences.color_palettes)
      : null;

  // Twist: chance based on difficulty level, filtered to medium-compatible twists
  const compatibleTwists = getTwistsForMedium(medium);
  const twist = Math.random() < difficulty.twistChance && compatibleTwists.length > 0
    ? randomItem(compatibleTwists).text
    : null;

  // Assemble prompt text with skill-aligned templates
  const prompt_text = assemblePromptText(medium, subject, color_rule, twist, difficulty);

  return {
    source,
    medium,
    subject,
    color_rule,
    twist,
    prompt_text,
  };
}

/**
 * Get today's daily prompt (idempotent)
 * Returns the same prompt for the entire day
 * Creates new prompt if none exists for today
 */
export async function getTodayPrompt(userId: string): Promise<Prompt> {
  const today = getTodayDateKey();

  // Try to get existing daily prompt for today
  const { data: existingPrompt, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('user_id', userId)
    .eq('date_key', today)
    .eq('source', 'daily')
    .single();

  // Return existing prompt if found
  if (existingPrompt && !error) {
    return existingPrompt as Prompt;
  }

  // If error is not "no rows", throw it
  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  // No existing prompt - generate new one
  // Fetch user preferences
  const preferences = await getPreferences(userId);
  if (!preferences) {
    throw new Error('User preferences not found. Please complete onboarding.');
  }

  // Generate prompt data
  const promptData = await generatePrompt(userId, preferences, 'daily');

  // Upsert to database (handles race conditions)
  const { data: newPrompt, error: upsertError } = await supabase
    .from('prompts')
    .upsert(
      {
        user_id: userId,
        date_key: today,
        ...promptData,
      },
      { onConflict: 'user_id,date_key,source' }
    )
    .select()
    .single();

  if (upsertError) throw upsertError;
  if (!newPrompt) throw new Error('Failed to create prompt');

  return newPrompt as Prompt;
}

/**
 * Create manual prompt (on-demand)
 * Users can create unlimited manual prompts per day
 * Each call generates a fresh prompt
 */
export async function createManualPrompt(userId: string): Promise<Prompt> {
  const today = getTodayDateKey();

  // Fetch user preferences
  const preferences = await getPreferences(userId);
  if (!preferences) {
    throw new Error('User preferences not found. Please complete onboarding.');
  }

  // Generate prompt data
  const promptData = await generatePrompt(userId, preferences, 'manual');

  // Insert new manual prompt (not upsert - allows multiple per day)
  const { data: newPrompt, error } = await supabase
    .from('prompts')
    .insert({
      user_id: userId,
      date_key: today,
      ...promptData,
    })
    .select()
    .single();

  if (error) throw error;
  if (!newPrompt) throw new Error('Failed to create manual prompt');

  return newPrompt as Prompt;
}

/**
 * Get paginated prompt history with completion status
 * Returns prompts ordered by creation date (newest first)
 * @param userId - User ID to filter by
 * @param limit - Number of prompts to return (default 20)
 * @param offset - Offset for pagination (default 0)
 * @returns Object with prompts array and total count
 */
export async function getPromptHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ prompts: PromptWithStatus[]; total: number }> {
  const { data, error, count } = await supabase
    .from('prompts')
    .select('*, responses:responses(count)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Transform results to add response_count and is_completed
  const prompts: PromptWithStatus[] = (data || []).map((p: any) => {
    const response_count = p.responses?.[0]?.count || 0;
    const is_completed = response_count > 0;

    // Remove the raw responses property
    const { responses, ...promptData } = p;

    return {
      ...promptData,
      response_count,
      is_completed,
    } as PromptWithStatus;
  });

  return {
    prompts,
    total: count || 0,
  };
}

/**
 * Get a single prompt by ID with completion status
 * @param userId - User ID to filter by
 * @param promptId - Prompt ID to fetch
 * @returns Prompt with status or null if not found
 */
export async function getPromptById(
  userId: string,
  promptId: string
): Promise<PromptWithStatus | null> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*, responses:responses(count)')
    .eq('user_id', userId)
    .eq('id', promptId)
    .single();

  // Return null if not found
  if (error && error.code === 'PGRST116') {
    return null;
  }

  // Throw on other errors
  if (error) throw error;

  // Transform result
  const response_count = data.responses?.[0]?.count || 0;
  const is_completed = response_count > 0;

  const { responses, ...promptData } = data;

  return {
    ...promptData,
    response_count,
    is_completed,
  } as PromptWithStatus;
}

/**
 * Reset prompt history for a user (DANGER ZONE)
 * Deletes all prompts and responses for the user
 * Cannot be undone
 *
 * @param userId - User ID to delete history for
 * @returns Success status for both operations
 */
export async function resetPromptHistory(userId: string): Promise<{
  promptsDeleted: boolean;
  responsesDeleted: boolean;
}> {
  // Delete responses first (child records - may have FK to prompts)
  const { error: responsesError } = await supabase
    .from('responses')
    .delete()
    .eq('user_id', userId);

  if (responsesError) throw responsesError;

  // Then delete prompts (parent records)
  const { error: promptsError } = await supabase
    .from('prompts')
    .delete()
    .eq('user_id', userId);

  if (promptsError) throw promptsError;

  return {
    promptsDeleted: true,
    responsesDeleted: true,
  };
}

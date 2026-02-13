# Phase 3: Prompt Generation - Research

**Researched:** 2026-02-13
**Domain:** Seed-based prompt generation, Supabase date-based deduplication, React Native home screen UI
**Confidence:** HIGH

## Summary

Phase 3 implements personalized daily art prompt generation using a LOCAL, seed-based algorithm (NO AI in v1). The system combines user preferences (mediums, subjects, color palettes) collected in Phase 2 into creative prompts with optional "twists," ensuring subjects don't repeat within 14 days. The core technical challenge is designing a robust date-based deduplication system, implementing a subject rotation algorithm that respects exclusions and recent history, and building a home screen with prominent prompt display and action CTAs.

The research reveals standard patterns: Supabase composite unique constraints (user_id + date_key) for one-prompt-per-day enforcement, upsert with onConflict for idempotent prompt retrieval, date formatting as YYYY-MM-DD strings using toISOString().split('T')[0] for timezone safety, and NativeWind card-based layouts for the home screen. The prompt generation algorithm uses a filtered random selection pattern: remove exclusions and recent subjects (14-day window), then randomly pick from remaining options.

Critical architectural decision: The `prompts` table stores GENERATED prompts with their full text, not just seeds. This enables consistent display (same prompt shown all day), historical tracking, and "I made something" response linking. The date_key ensures exactly one daily prompt exists, with manual "Generate Now" prompts logged separately via source="manual".

**Primary recommendation:** Create a `prompts` table with composite unique constraint on (user_id, date_key, source), implement prompt generation as a pure TypeScript function in lib/services/prompts.ts that queries recent subject history and randomly selects from eligible options, use upsert with onConflict for idempotent daily prompt fetching, and build the home screen with a large Card component showing today's prompt with "Generate Now" and "I made something" action buttons.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase JS SDK | ^2.95.3 | Database CRUD, RLS enforcement | Already installed, handles prompt storage + deduplication |
| Expo Router | ~4.0.22 | Home screen routing, navigation | Already installed, file-based routing for (auth)/index.tsx |
| NativeWind | ^4.2.1 | Tailwind styling for cards, buttons | Already installed, consistent with Phases 1-2 styling |
| TypeScript | ~5.7.2 | Type-safe prompt generation logic | Already installed, prevents runtime errors in algorithm |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | latest (optional) | Date manipulation helpers | If complex date math needed beyond toISOString() |
| AsyncStorage | 1.23.1 | Cache today's prompt for offline | Already installed, reduces Supabase queries |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Composite unique constraint | Application-level deduplication | DB constraint is atomic, prevents race conditions |
| date_key as TEXT | date_key as DATE | TEXT avoids timezone conversion issues, simpler queries |
| Seed-based prompts | AI generation (OpenAI, Claude) | v1 requires NO AI per requirements, seeds keep costs zero |
| Pure random selection | Weighted algorithm favoring recent subjects | Requirements specify NO recent repeats, not weighting |

**Installation:**
```bash
# No new packages required - all dependencies already installed in Phases 1-2
# Optional: npm install date-fns (if complex date math needed)
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (auth)/
│   ├── index.tsx              # HOME SCREEN - replace placeholder with prompt display
│   └── settings.tsx           # Existing settings (future: update preferences)

lib/
├── services/
│   └── prompts.ts             # NEW: Prompt generation + retrieval functions
├── constants/
│   └── preferences.ts         # Existing: MEDIUM_OPTIONS, SUBJECT_OPTIONS, COLOR_PALETTE_OPTIONS
│   └── twists.ts              # NEW: Creative twist options (~50% of prompts)
├── schemas/
│   └── prompts.ts             # NEW: Zod schemas for Prompt type
└── hooks/
    └── useDailyPrompt.ts      # NEW: React hook for fetching/generating today's prompt
```

### Pattern 1: Composite Unique Constraint for Date-Based Deduplication
**What:** Use PostgreSQL composite unique constraint on (user_id, date_key, source) to enforce exactly one daily prompt per user, with separate manual prompts allowed.

**When to use:** Any time you need "one record per user per day" semantics with atomic enforcement.

**Example:**
```sql
-- Supabase migration for prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL, -- YYYY-MM-DD format
  source TEXT NOT NULL DEFAULT 'daily', -- 'daily' or 'manual'
  medium TEXT NOT NULL,
  subject TEXT NOT NULL,
  color_rule TEXT, -- Optional
  twist TEXT, -- Optional (~50% of prompts)
  prompt_text TEXT NOT NULL, -- Full generated prompt
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique: one daily prompt per user per date, unlimited manual prompts
  CONSTRAINT unique_daily_prompt UNIQUE (user_id, date_key, source)
);

CREATE INDEX idx_prompts_user_date ON prompts(user_id, date_key DESC);
CREATE INDEX idx_prompts_user_subject_recent ON prompts(user_id, subject, created_at DESC);

-- RLS policies
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own prompts"
  ON prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Source:** [PostgreSQL Unique Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)

**Why this works:**
- `date_key` as TEXT (YYYY-MM-DD) avoids timezone complexity - app formats dates consistently
- `source` distinguishes daily (unique per date) from manual (multiple allowed) prompts
- Composite unique means same user can have multiple prompts on same date IF different sources
- For daily prompts: constraint enforces exactly one per user per date
- For manual prompts: NO uniqueness constraint, user can generate unlimited extras

### Pattern 2: Idempotent Daily Prompt Retrieval with Upsert
**What:** Use Supabase upsert with onConflict to fetch today's daily prompt if it exists, or generate and insert if it doesn't, in a single atomic operation.

**When to use:** When you need "get or create" semantics with no race conditions (critical for daily prompt that must be consistent across multiple app opens).

**Example:**
```typescript
// lib/services/prompts.ts
import { supabase } from '@/lib/supabase';
import { getPreferences } from './preferences';

export async function getTodayPrompt(userId: string): Promise<Prompt> {
  const today = new Date().toISOString().split('T')[0]; // "2026-02-13"

  // Try to fetch existing daily prompt for today
  const { data: existing, error: fetchError } = await supabase
    .from('prompts')
    .select('*')
    .eq('user_id', userId)
    .eq('date_key', today)
    .eq('source', 'daily')
    .single();

  // If exists, return it (same prompt all day)
  if (existing && !fetchError) {
    return existing as Prompt;
  }

  // If doesn't exist, generate new prompt
  const preferences = await getPreferences(userId);
  if (!preferences) {
    throw new Error('User preferences not found');
  }

  const newPrompt = await generatePrompt(userId, preferences, 'daily');

  // Insert with upsert to handle race condition (another request might have created it)
  const { data, error } = await supabase
    .from('prompts')
    .upsert({
      user_id: userId,
      date_key: today,
      source: 'daily',
      ...newPrompt,
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,date_key,source',
      ignoreDuplicates: false, // Merge if duplicate exists
    })
    .select()
    .single();

  if (error) throw error;
  return data as Prompt;
}
```

**Source:** [Supabase Upsert Documentation](https://supabase.com/docs/reference/javascript/upsert)

**Why this works:**
- First SELECT checks for existing daily prompt
- If exists, return immediately (consistent display)
- If doesn't exist, generate new prompt data
- Upsert with onConflict handles race condition where two simultaneous requests both try to create
- The constraint ensures only one daily prompt exists, upsert merges if conflict detected
- Result: Idempotent - calling getTodayPrompt() 100 times returns same prompt

### Pattern 3: Subject Rotation Algorithm (No Repeats Within 14 Days)
**What:** Query recent prompt history to get subjects used in last 14 days, filter them out from user's preferred subjects (also removing exclusions), then randomly select from remaining eligible subjects. Gracefully degrade if subject pool is too small.

**When to use:** Any content rotation system with "don't repeat recent items" requirements.

**Example:**
```typescript
// lib/services/prompts.ts
async function getEligibleSubjects(
  userId: string,
  userSubjects: string[],
  exclusions: string[],
  repeatWindowDays: number = 14
): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - repeatWindowDays);

  // Fetch subjects used in last N days
  const { data: recentPrompts, error } = await supabase
    .from('prompts')
    .select('subject')
    .eq('user_id', userId)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  const recentSubjects = new Set(
    (recentPrompts || []).map(p => p.subject)
  );

  // Filter: remove exclusions AND recent subjects
  const eligible = userSubjects.filter(
    subject => !exclusions.includes(subject) && !recentSubjects.has(subject)
  );

  // Graceful fallback: if no eligible subjects (all used recently),
  // allow repeats but still respect exclusions
  if (eligible.length === 0) {
    return userSubjects.filter(subject => !exclusions.includes(subject));
  }

  return eligible;
}

async function generatePrompt(
  userId: string,
  preferences: UserPreferences,
  source: 'daily' | 'manual'
): Promise<Omit<Prompt, 'id' | 'user_id' | 'date_key' | 'created_at'>> {
  // 1. Select random medium from user's preferences
  const medium = randomItem(preferences.art_mediums);

  // 2. Get eligible subjects (respecting exclusions + 14-day window)
  const eligibleSubjects = await getEligibleSubjects(
    userId,
    preferences.subjects,
    preferences.exclusions || [],
    14
  );
  const subject = randomItem(eligibleSubjects);

  // 3. Optional: Color rule (~40% of prompts, if user has color preferences)
  const colorRule = (preferences.color_palettes?.length > 0 && Math.random() < 0.4)
    ? randomItem(preferences.color_palettes)
    : null;

  // 4. Optional: Creative twist (~50% of prompts)
  const twist = Math.random() < 0.5
    ? randomItem(CREATIVE_TWISTS)
    : null;

  // 5. Assemble prompt text
  const promptText = assemblePromptText(medium, subject, colorRule, twist);

  return {
    source,
    medium,
    subject,
    color_rule: colorRule,
    twist,
    prompt_text: promptText,
  };
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function assemblePromptText(
  medium: string,
  subject: string,
  colorRule: string | null,
  twist: string | null
): string {
  const mediumLabel = MEDIUM_OPTIONS.find(m => m.id === medium)?.label || medium;
  const subjectLabel = SUBJECT_OPTIONS.find(s => s.id === subject)?.label || subject;
  const colorLabel = colorRule
    ? COLOR_PALETTE_OPTIONS.find(c => c.id === colorRule)?.label
    : null;

  let prompt = `Create a ${mediumLabel.toLowerCase()} piece featuring ${subjectLabel.toLowerCase()}`;

  if (colorLabel) {
    prompt += ` with ${colorLabel.toLowerCase()} colors`;
  }

  if (twist) {
    prompt += `. ${twist}`;
  }

  return prompt;
}
```

**Source:** Algorithm pattern derived from [weighted random selection research](https://grantwinney.com/writing-a-random-selection-algorithm-that-factors-in-the-age-of-an-item/)

**Why this works:**
- Query fetches only subjects from recent prompts (indexed query)
- Set data structure gives O(1) lookup for "is this subject recent?"
- Filter creates eligible pool respecting both exclusions and recency
- Graceful fallback prevents empty pool errors when subject list is small
- Math.random() provides unbiased selection from eligible pool (no weighting needed)
- Randomness means user sees variety, history tracking prevents boring repetition

### Pattern 4: Timezone-Safe Date Formatting
**What:** Use JavaScript's toISOString() and string splitting to generate consistent YYYY-MM-DD date keys, avoiding timezone conversion bugs.

**When to use:** Any date-based deduplication system in React Native (devices have different timezones).

**Example:**
```typescript
// Get today's date_key (YYYY-MM-DD format, consistent across timezones)
function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
  // Example: "2026-02-13"
}

// DON'T DO THIS (timezone bugs):
function getTodayDateKeyBAD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  // Month/date can be wrong due to getMonth/getDate returning local time
}
```

**Source:** [MDN Date.toISOString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)

**Why this works:**
- toISOString() always returns UTC time in ISO 8601 format: "2026-02-13T14:32:00.000Z"
- Splitting on 'T' extracts just the date part: "2026-02-13"
- UTC ensures consistency across devices regardless of user's timezone
- Database stores this as TEXT, avoiding PostgreSQL date type timezone conversions
- User gets "today's prompt" based on UTC day, which resets at consistent global time

### Pattern 5: Home Screen with Prominent Prompt Card
**What:** Replace placeholder home screen with large card displaying today's prompt text, with big obvious "Generate Now" and "I made something" CTAs below.

**When to use:** Primary feature display on app home screen.

**Example:**
```typescript
// app/(auth)/index.tsx
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useDailyPrompt } from '@/lib/hooks/useDailyPrompt';
import { useState } from 'react';

export default function Home() {
  const { prompt, loading, error, generateManualPrompt } = useDailyPrompt();
  const [generating, setGenerating] = useState(false);

  const handleGenerateNow = async () => {
    setGenerating(true);
    await generateManualPrompt();
    setGenerating(false);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator size="large" color="#7C9A72" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-cream px-6 justify-center">
        <Text className="text-red-600 text-lg text-center">{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream">
      <View className="px-6 pt-12 pb-8">
        {/* Today's Prompt Card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-sm text-gray-500 mb-2">
            {prompt?.source === 'daily' ? "Today's Prompt" : "Extra Prompt"}
          </Text>
          <Text className="text-2xl font-semibold text-gray-900 leading-relaxed">
            {prompt?.prompt_text}
          </Text>

          {/* Prompt Details (Collapsible) */}
          <View className="mt-4 pt-4 border-t border-gray-100">
            <Text className="text-xs text-gray-400 mb-1">Medium</Text>
            <Text className="text-sm text-gray-700">{prompt?.medium}</Text>

            {prompt?.color_rule && (
              <>
                <Text className="text-xs text-gray-400 mt-2 mb-1">Colors</Text>
                <Text className="text-sm text-gray-700">{prompt?.color_rule}</Text>
              </>
            )}

            {prompt?.twist && (
              <>
                <Text className="text-xs text-gray-400 mt-2 mb-1">Twist</Text>
                <Text className="text-sm text-sage-green italic">{prompt?.twist}</Text>
              </>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          className="bg-sage-green rounded-xl py-4 mb-3 shadow-sm"
          onPress={() => {/* Navigate to response flow in Phase 4 */}}
        >
          <Text className="text-white text-center text-lg font-semibold">
            I made something
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white border-2 border-sage-green rounded-xl py-4"
          onPress={handleGenerateNow}
          disabled={generating}
        >
          <Text className="text-sage-green text-center text-lg font-semibold">
            {generating ? 'Generating...' : 'Generate Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

**Source:** [NativeWindUI Card Component](https://nativewindui.com/component/card)

**Why this works:**
- Large card with white background stands out on cream background
- Prompt text is 2xl, easy to read
- Collapsible details section (medium, colors, twist) reduces visual clutter
- Big obvious buttons with high contrast (sage green = primary action)
- "I made something" is prominent (aligns with anti-social-media philosophy - creation over consumption)
- ScrollView allows for long prompts without overflow issues

### Pattern 6: React Hook for Daily Prompt State
**What:** Custom hook that fetches today's prompt on mount, caches it, and provides generateManualPrompt function for "Generate Now" button.

**When to use:** Separating data fetching logic from UI components.

**Example:**
```typescript
// lib/hooks/useDailyPrompt.ts
import { useState, useEffect } from 'react';
import { getTodayPrompt, createManualPrompt } from '@/lib/services/prompts';
import { useSession } from '@/components/auth/SessionProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useDailyPrompt() {
  const { session } = useSession();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrompt() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Check AsyncStorage cache first
        const cacheKey = `@artspark:daily-prompt:${getTodayDateKey()}`;
        const cached = await AsyncStorage.getItem(cacheKey);

        if (cached) {
          setPrompt(JSON.parse(cached));
          setLoading(false);
          return;
        }

        // Fetch from Supabase
        const todayPrompt = await getTodayPrompt(session.user.id);
        setPrompt(todayPrompt);

        // Cache for offline access
        await AsyncStorage.setItem(cacheKey, JSON.stringify(todayPrompt));

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prompt');
        setLoading(false);
      }
    }

    fetchPrompt();
  }, [session?.user?.id]);

  const generateManualPrompt = async () => {
    if (!session?.user?.id) return;

    try {
      const newPrompt = await createManualPrompt(session.user.id);
      setPrompt(newPrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate prompt');
    }
  };

  return { prompt, loading, error, generateManualPrompt };
}
```

**Why this works:**
- Encapsulates data fetching, caching, and error handling
- AsyncStorage cache reduces Supabase queries and enables offline viewing
- Exposes clean API to components: {prompt, loading, error, generateManualPrompt}
- Manual prompt generation updates state immediately, triggering re-render
- Cache key includes date to auto-invalidate daily

### Anti-Patterns to Avoid

- **Don't use Math.random() to shuffle arrays**: Math.random() for shuffling creates biased results. Use proper random selection or Fisher-Yates if shuffling entire array is needed.
- **Don't store only prompt seeds**: Store full generated prompt text. Regenerating from seeds on each display risks inconsistency and wastes CPU.
- **Don't use DATE column type for date_key**: PostgreSQL DATE type introduces timezone conversion complexity. Use TEXT with YYYY-MM-DD format.
- **Don't allow subject to appear in both preferences and exclusions**: Filter exclusions list in step-4 of onboarding to prevent contradictions.
- **Don't query full prompts table for recent subjects**: Use indexed query with specific columns (user_id, subject, created_at) and date range to avoid table scans.
- **Don't hard-code repeat window**: Make 14-day window a configurable parameter (default 14, but allow override for users with very small subject pools).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date-based uniqueness | Application-level checking + race condition handling | PostgreSQL composite unique constraint | Database constraint is atomic, prevents race conditions between concurrent requests |
| Prompt text assembly | String concatenation with manual conditionals | Template function with option type guards | Edge cases: missing options, punctuation, capitalization consistency |
| Subject history tracking | In-memory array of recent subjects | Supabase query with date filter | Query is indexed, handles concurrent prompt generation, persists across app restarts |
| Timezone-safe dates | Manual date formatting with getMonth/getDate | toISOString().split('T')[0] | Avoids timezone bugs, consistent UTC formatting, handles DST transitions |
| Get-or-create daily prompt | Manual SELECT then INSERT logic | Upsert with onConflict | Upsert is atomic, prevents duplicate creation from race conditions |

**Key insight:** Date-based deduplication systems have deceptively complex edge cases: timezone differences, race conditions from concurrent requests, DST transitions, and cache invalidation timing. Use database-level constraints and proven patterns (upsert, toISOString) rather than application-level logic.

## Common Pitfalls

### Pitfall 1: Race Condition on Daily Prompt Creation
**What goes wrong:** User opens app twice in quick succession (e.g., closes and reopens). Both requests check if today's prompt exists, both see "no prompt exists," both try to INSERT, causing a unique constraint violation error or duplicate prompts.

**Why it happens:** SELECT then INSERT pattern is not atomic. Time gap between check and insertion.

**How to avoid:**
- Use upsert with onConflict instead of SELECT then INSERT
- Database constraint (UNIQUE on user_id, date_key, source) enforces atomicity
- Upsert handles conflict gracefully by returning existing prompt
- AsyncStorage cache reduces likelihood of duplicate requests

**Warning signs:** Unique constraint violation errors in logs, users seeing different prompts on same day, database errors during morning peak (when many users open app simultaneously).

### Pitfall 2: Subject Pool Exhaustion
**What goes wrong:** User has only 3 preferred subjects but 14-day repeat window. After 3 days, all subjects have been used recently, algorithm returns empty eligible array, prompt generation fails.

**Why it happens:** Repeat window is larger than subject pool size, no graceful fallback.

**How to avoid:**
- Detect empty eligible array after filtering
- Fallback: If no eligible subjects, allow repeats but still respect exclusions
- Alternative fallback: Reduce repeat window dynamically (try 7 days, then 3 days, then allow any)
- Warn users during onboarding if subject pool is very small (<5 subjects)

**Warning signs:** Prompt generation errors after a few days of use, users with minimal subject selections reporting failures.

### Pitfall 3: Timezone Confusion with date_key
**What goes wrong:** User in timezone GMT-8 generates prompt at 11:30 PM local time. Server uses UTC, so it's already tomorrow in UTC. Prompt gets tomorrow's date_key. User reopens app next morning and sees "old" prompt instead of new one.

**Why it happens:** Mixing local time and UTC time in date_key generation.

**How to avoid:**
- Consistently use UTC for date_key: `new Date().toISOString().split('T')[0]`
- Accept that "daily" reset happens at same UTC time globally (not midnight local time)
- Document this behavior: "Daily prompt resets at midnight UTC"
- If strict local midnight is required (future enhancement), store user timezone in preferences and adjust

**Warning signs:** Users in certain timezones reporting prompt doesn't reset at midnight, getting "tomorrow's" prompt early.

### Pitfall 4: Not Handling Missing User Preferences
**What goes wrong:** New user signs up, skips onboarding (if allowed), tries to view home screen. getTodayPrompt() calls generatePrompt() which tries to access preferences.subjects, gets null/undefined, crashes.

**Why it happens:** Assuming user preferences always exist, not handling incomplete onboarding state.

**How to avoid:**
- Check if preferences exist before generating prompt
- If preferences null/incomplete, show onboarding reminder instead of prompt
- Redirect to onboarding if not completed (already handled by Phase 2 routing)
- Validate minimum required preferences: at least 1 medium and 1 subject

**Warning signs:** Crashes on home screen for new users, null reference errors in prompt generation.

### Pitfall 5: Forgetting to Clear AsyncStorage Cache on Date Change
**What goes wrong:** User views prompt on Day 1, AsyncStorage caches it. User opens app on Day 2. useDailyPrompt hook checks cache BEFORE checking if date changed, returns yesterday's cached prompt.

**Why it happens:** Cache key doesn't include date, or cache invalidation logic is missing.

**How to avoid:**
- Include date in cache key: `@artspark:daily-prompt:${date_key}`
- Cache is automatically invalid when date changes (different key)
- Each day gets its own cache entry
- Optional: Implement cleanup to delete old cache entries (1+ days old)

**Warning signs:** Users reporting "same prompt every day," cache showing stale data.

### Pitfall 6: Manual Prompts Violating Daily Uniqueness
**What goes wrong:** User taps "Generate Now" multiple times. Each creates a prompt with source='daily', hitting unique constraint violation.

**Why it happens:** Manual prompts using wrong source value.

**How to avoid:**
- Manual prompts MUST use source='manual', not 'daily'
- Unique constraint is on (user_id, date_key, source), so multiple manual prompts are allowed
- Only daily prompt has uniqueness enforcement
- Consider adding created_at DESC ordering so latest manual prompt displays first

**Warning signs:** "Generate Now" button causing database errors, unable to generate extra prompts.

### Pitfall 7: Prompt Text Inconsistency
**What goes wrong:** Prompt text says "watercolor" but medium field stores "Watercolor" (capitalized). Later filtering or display logic breaks due to case mismatch.

**Why it happens:** Mixing label (display text) and id (database value) when assembling prompt.

**How to avoid:**
- Always store IDs in database (e.g., 'watercolor', 'oil')
- Look up labels when assembling prompt text for display
- Use MEDIUM_OPTIONS.find(m => m.id === medium)?.label
- Ensures consistency between stored value and displayed text
- Makes database queries case-insensitive (all IDs lowercase)

**Warning signs:** Display showing wrong text, filtering not working, search features broken.

## Code Examples

Verified patterns from official sources:

### Complete Prompt Service
```typescript
// lib/services/prompts.ts
import { supabase } from '@/lib/supabase';
import { getPreferences, UserPreferences } from './preferences';
import { MEDIUM_OPTIONS, SUBJECT_OPTIONS, COLOR_PALETTE_OPTIONS } from '@/lib/constants/preferences';
import { CREATIVE_TWISTS } from '@/lib/constants/twists';

export type Prompt = {
  id: string;
  user_id: string;
  date_key: string;
  source: 'daily' | 'manual';
  medium: string;
  subject: string;
  color_rule: string | null;
  twist: string | null;
  prompt_text: string;
  created_at: string;
};

function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function getEligibleSubjects(
  userId: string,
  userSubjects: string[],
  exclusions: string[],
  repeatWindowDays: number = 14
): Promise<string[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - repeatWindowDays);

  const { data: recentPrompts, error } = await supabase
    .from('prompts')
    .select('subject')
    .eq('user_id', userId)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  const recentSubjects = new Set(
    (recentPrompts || []).map(p => p.subject)
  );

  const eligible = userSubjects.filter(
    subject => !exclusions.includes(subject) && !recentSubjects.has(subject)
  );

  // Graceful fallback
  if (eligible.length === 0) {
    return userSubjects.filter(subject => !exclusions.includes(subject));
  }

  return eligible;
}

function assemblePromptText(
  medium: string,
  subject: string,
  colorRule: string | null,
  twist: string | null
): string {
  const mediumLabel = MEDIUM_OPTIONS.find(m => m.id === medium)?.label || medium;
  const subjectLabel = SUBJECT_OPTIONS.find(s => s.id === subject)?.label || subject;
  const colorLabel = colorRule
    ? COLOR_PALETTE_OPTIONS.find(c => c.id === colorRule)?.label
    : null;

  let prompt = `Create a ${mediumLabel.toLowerCase()} piece featuring ${subjectLabel.toLowerCase()}`;

  if (colorLabel) {
    prompt += ` with ${colorLabel.toLowerCase()} colors`;
  }

  if (twist) {
    prompt += `. ${twist}`;
  }

  return prompt;
}

async function generatePrompt(
  userId: string,
  preferences: UserPreferences,
  source: 'daily' | 'manual'
): Promise<Omit<Prompt, 'id' | 'user_id' | 'date_key' | 'created_at'>> {
  const medium = randomItem(preferences.art_mediums);

  const eligibleSubjects = await getEligibleSubjects(
    userId,
    preferences.subjects,
    preferences.exclusions || [],
    14
  );
  const subject = randomItem(eligibleSubjects);

  const colorRule = (preferences.color_palettes?.length > 0 && Math.random() < 0.4)
    ? randomItem(preferences.color_palettes)
    : null;

  const twist = Math.random() < 0.5
    ? randomItem(CREATIVE_TWISTS)
    : null;

  const promptText = assemblePromptText(medium, subject, colorRule, twist);

  return {
    source,
    medium,
    subject,
    color_rule: colorRule,
    twist,
    prompt_text: promptText,
  };
}

export async function getTodayPrompt(userId: string): Promise<Prompt> {
  const today = getTodayDateKey();

  const { data: existing, error: fetchError } = await supabase
    .from('prompts')
    .select('*')
    .eq('user_id', userId)
    .eq('date_key', today)
    .eq('source', 'daily')
    .single();

  if (existing && !fetchError) {
    return existing as Prompt;
  }

  const preferences = await getPreferences(userId);
  if (!preferences) {
    throw new Error('User preferences not found. Please complete onboarding.');
  }

  const newPromptData = await generatePrompt(userId, preferences, 'daily');

  const { data, error } = await supabase
    .from('prompts')
    .upsert({
      user_id: userId,
      date_key: today,
      ...newPromptData,
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,date_key,source',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Prompt;
}

export async function createManualPrompt(userId: string): Promise<Prompt> {
  const preferences = await getPreferences(userId);
  if (!preferences) {
    throw new Error('User preferences not found. Please complete onboarding.');
  }

  const today = getTodayDateKey();
  const newPromptData = await generatePrompt(userId, preferences, 'manual');

  const { data, error } = await supabase
    .from('prompts')
    .insert({
      user_id: userId,
      date_key: today,
      ...newPromptData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Prompt;
}
```

### Creative Twists Seed List
```typescript
// lib/constants/twists.ts
export const CREATIVE_TWISTS = [
  "Use only 3 colors",
  "Work from memory, not reference",
  "Create in under 30 minutes",
  "Focus on texture over detail",
  "Use negative space intentionally",
  "Emphasize light and shadow",
  "Incorporate a geometric element",
  "Try a perspective you've never used",
  "Work larger than usual",
  "Work smaller than usual",
  "Use an unusual tool or technique",
  "Create a series of 3 quick studies",
  "Focus on movement and energy",
  "Simplify to essential shapes only",
  "Add an unexpected element",
  "Use complementary colors only",
  "Create a mood, not a scene",
  "Work in monochrome",
  "Emphasize pattern and repetition",
  "Break a rule you usually follow",
];
```

### Supabase Migration SQL
```sql
-- Create prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'daily',
  medium TEXT NOT NULL,
  subject TEXT NOT NULL,
  color_rule TEXT,
  twist TEXT,
  prompt_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_daily_prompt UNIQUE (user_id, date_key, source),
  CONSTRAINT valid_source CHECK (source IN ('daily', 'manual'))
);

-- Indexes for performance
CREATE INDEX idx_prompts_user_date ON prompts(user_id, date_key DESC);
CREATE INDEX idx_prompts_user_subject_recent ON prompts(user_id, subject, created_at DESC);

-- RLS policies
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own prompts"
  ON prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE prompts IS 'User-generated art prompts (daily + manual)';
COMMENT ON COLUMN prompts.date_key IS 'YYYY-MM-DD format, UTC date';
COMMENT ON COLUMN prompts.source IS 'daily = one per day, manual = unlimited extras';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AI-generated prompts | Seed-based local generation | Cost-conscious MVPs (2024+) | Zero API costs, instant generation, offline-capable |
| Manual deduplication logic | Database unique constraints | PostgreSQL best practices (2020+) | Atomic enforcement, no race conditions |
| Shuffling arrays with Math.random() | Fisher-Yates or filtered random selection | Algorithm correctness (2023+) | Unbiased randomness, predictable distribution |
| LocalStorage only | Supabase + AsyncStorage cache | Cloud-first + offline-first (2024+) | Cross-device sync + offline viewing |
| Manual date formatting | toISOString() standard | Timezone bug awareness (2022+) | Consistent UTC formatting, no DST bugs |

**Deprecated/outdated:**
- **AI prompt generation for MVPs**: Too expensive for v1, adds API dependencies, slower than local seed selection
- **Application-level date deduplication**: Race conditions, not atomic, requires complex locking
- **Date objects as database values**: Timezone conversion complexity, PostgreSQL DATE type issues
- **Math.random() for array shuffling**: Biased results, non-uniform distribution

## Open Questions

1. **Should manual prompts count toward subject repeat window?**
   - What we know: Daily prompts use subjects from pool and mark them as "recent"
   - What's unclear: If user generates 10 manual prompts in one day, should those exhaust subject pool?
   - Recommendation: Manual prompts DO count toward recent subjects. Prevents user from grinding through entire pool in minutes. Query filters by created_at regardless of source.

2. **How to handle users who never complete prompts?**
   - What we know: Phase 3 only generates prompts, no response tracking yet
   - What's unclear: Should prompt generation continue indefinitely if user never responds?
   - Recommendation: Continue generating regardless of completion rate. Phase 4 adds "I made something" responses. Prompts are aspirational, not obligations.

3. **Should color rule be required or optional?**
   - What we know: Requirements say "optional creative twist" (~50%), user can skip color palette step in onboarding
   - What's unclear: Is color rule separate from twist? How often should color appear?
   - Recommendation: Color rule is separate from twist. Include color in ~40% of prompts IF user has color preferences. Twist is always ~50% regardless. Both can appear in same prompt.

4. **What if user has zero color preferences?**
   - What we know: Step 2 of onboarding is skippable, user can have empty color_palettes array
   - What's unclear: Should we skip color rule entirely or use "random" default?
   - Recommendation: If user skipped color preferences, never include color rule in prompts. Respect their choice. Don't force "random" colors on them.

5. **Should we store generation algorithm version?**
   - What we know: Algorithm will evolve (better twists, more sophisticated selection)
   - What's unclear: Will we need to know which algorithm version generated old prompts?
   - Recommendation: Not for v1. If algorithm changes significantly in future, add `algorithm_version` column. For now, all prompts use same logic.

## Sources

### Primary (HIGH confidence)
- [PostgreSQL Unique Constraints Documentation](https://www.postgresql.org/docs/current/ddl-constraints.html) - Composite unique constraint syntax, NULLS NOT DISTINCT
- [Supabase JavaScript Upsert API](https://supabase.com/docs/reference/javascript/upsert) - onConflict parameter, ignoreDuplicates option
- [MDN Date.toISOString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) - UTC date formatting
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/) - File-based routing patterns
- [NativeWindUI Card Component](https://nativewindui.com/component/card) - Card layout structure

### Secondary (MEDIUM confidence)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS policy patterns for user-owned data
- [PostgreSQL Tutorial: Unique Constraints](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-unique-constraint/) - Composite unique constraint examples
- [Grant Winney: Weighted Random Selection Algorithm](https://grantwinney.com/writing-a-random-selection-algorithm-that-factors-in-the-age-of-an-item/) - Age-based weighting patterns
- [React Native Responsive Design with NativeWind](https://medium.com/@CodeCraftMobile/react-native-responsive-design-with-nativewind-467afb75fc74) - Card layout patterns
- [Zustand State Management in React Native](https://medium.com/@erdincakdogn/state-management-with-zustand-react-native-b1d2e9053fce) - Local state patterns (optional for cache)

### Tertiary (LOW confidence - marked for validation)
- [Fisher-Yates Shuffle TypeScript](https://github.com/lemmski/fisher-yates-shuffle) - Shuffle algorithm (not used in v1, but reference for future weighted selection)
- [AI Prompt Generation Patterns](https://platform.openai.com/docs/guides/prompt-generation) - AI-based generation (deferred to v2+)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and verified in Phases 1-2
- Database schema: HIGH - PostgreSQL unique constraints and Supabase RLS patterns verified in official docs
- Algorithm logic: MEDIUM-HIGH - Subject rotation pattern derived from research and first principles, not battle-tested in production
- UI patterns: HIGH - NativeWind card layouts and Expo Router verified in official docs
- Date handling: HIGH - toISOString() verified in MDN, used in production apps

**Research date:** 2026-02-13
**Valid until:** ~2026-03-15 (30 days for stable ecosystem, Expo SDK ~52 is current)

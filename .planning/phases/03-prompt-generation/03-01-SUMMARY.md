---
phase: 03-prompt-generation
plan: 01
subsystem: prompt-generation
tags: [core-engine, algorithm, database-service]

dependency-graph:
  requires:
    - lib/supabase.ts (Supabase client)
    - lib/services/preferences.ts (user preferences retrieval)
    - lib/constants/preferences.ts (display label lookup)
  provides:
    - lib/services/prompts.ts (getTodayPrompt, createManualPrompt)
    - lib/schemas/prompts.ts (Prompt type, promptSchema)
    - lib/constants/twists.ts (CREATIVE_TWISTS array)
  affects:
    - Phase 4: Home screen will consume getTodayPrompt
    - Phase 5: History feature will query prompts table

tech-stack:
  added:
    - Zod schema validation for Prompt type
    - Partial unique index for daily prompt deduplication
  patterns:
    - Date-based deduplication (date_key in UTC YYYY-MM-DD)
    - 14-day subject rotation with graceful fallback
    - Probabilistic feature inclusion (~50% twist, ~40% color)
    - Upsert pattern for idempotent daily prompts
    - Insert pattern for unlimited manual prompts

key-files:
  created:
    - lib/constants/twists.ts
    - lib/schemas/prompts.ts
    - lib/services/prompts.ts
  modified: []

decisions:
  - decision: "Partial unique index instead of table constraint"
    rationale: "Allows unlimited manual prompts while enforcing single daily prompt per user per date"
    alternative: "Table-level UNIQUE constraint would block multiple manual prompts"
  - decision: "14-day subject rotation window"
    rationale: "Balances variety with preference pool size - prevents recent repeats without exhausting small subject lists"
    alternative: "Longer window could exhaust small preference pools; shorter provides less variety"
  - decision: "Graceful fallback when all subjects recently used"
    rationale: "Allows repeats when necessary (small subject pool) but always respects exclusions"
    alternative: "Hard error would break app for users with limited subject preferences"
  - decision: "~50% twist probability, ~40% color rule probability"
    rationale: "Balances creative challenge with accessibility - not every prompt needs constraints"
    alternative: "100% twist rate could feel overwhelming; 0% would be too predictable"
  - decision: "Label lookup from OPTIONS constants at runtime"
    rationale: "Single source of truth - changes to preference labels automatically update prompt text"
    alternative: "Storing labels in prompts table would cause inconsistency after label updates"

metrics:
  duration: 2
  tasks_completed: 2
  files_created: 3
  commits: 2
  completed_date: "2026-02-13"
---

# Phase 03 Plan 01: Prompt Generation Engine Summary

**One-liner:** Complete prompt generation service with 14-day subject rotation, exclusion filtering, creative twist randomization (~50%), and date-based deduplication using partial unique indexes.

## What Was Built

Created the core prompt generation engine that powers the entire app - the algorithm that transforms user preferences into personalized daily art prompts with automatic subject rotation and creative variety.

### Files Created

1. **lib/constants/twists.ts**
   - Exported CREATIVE_TWISTS array with 20 creative constraint strings
   - Used for ~50% of prompts to add variety and challenge
   - Examples: "Use only 3 colors", "Work from memory, not reference", "Create in under 30 minutes"

2. **lib/schemas/prompts.ts**
   - Defined Prompt TypeScript type (10 fields matching database schema)
   - Created Zod schema (promptSchema) for runtime validation
   - Documented SQL migration with partial unique index: `CREATE UNIQUE INDEX unique_daily_prompt ON prompts(user_id, date_key) WHERE source = 'daily'`
   - Partial index enforces single daily prompt while allowing unlimited manual prompts

3. **lib/services/prompts.ts**
   - **Exported Functions:**
     - `getTodayPrompt(userId)`: Idempotent daily prompt retrieval (same prompt all day via upsert)
     - `createManualPrompt(userId)`: On-demand prompt generation (unlimited per day via insert)

   - **Internal Helpers:**
     - `getEligibleSubjects()`: 14-day rotation algorithm with graceful fallback when pool exhausted
     - `assemblePromptText()`: Converts preference IDs to readable sentence using label lookup
     - `generatePrompt()`: Orchestrates random medium, subject, color rule (~40%), twist (~50%) selection
     - `getTodayDateKey()`: UTC YYYY-MM-DD format for date_key consistency
     - `randomItem()`: Generic random selection utility

### How It Works

**Daily Prompt Flow:**
1. User opens app → `getTodayPrompt(userId)` called
2. Check database for existing prompt with (user_id, date_key, source='daily')
3. If exists: return it (same prompt all day)
4. If not: fetch preferences → generate prompt → upsert to database → return

**Subject Rotation Algorithm:**
1. Query prompts created in last 14 days
2. Build set of recently used subjects
3. Filter user's subjects: remove exclusions AND recent subjects
4. **Graceful fallback:** If all subjects recently used, allow repeats but still respect exclusions
5. Pick random subject from eligible pool

**Prompt Assembly:**
- Base: "Create a [medium] piece featuring [subject]"
- Optional color: " with [color palette] colors" (~40% probability when user has color prefs)
- Optional twist: ". [creative twist]" (~50% probability)
- Example: "Create a watercolor piece featuring botanicals with earthy colors. Use only 3 colors."

**Database Strategy:**
- Daily prompts: Use upsert with `onConflict: 'user_id,date_key,source'` for idempotency
- Manual prompts: Use insert (no conflict - unlimited per day)
- Partial unique index prevents duplicate daily prompts but allows manual prompts

## Integration Points

**Imports:**
- `lib/supabase.ts` → Supabase client for prompts table operations
- `lib/services/preferences.ts` → getPreferences() for user preference data
- `lib/constants/preferences.ts` → MEDIUM_OPTIONS, SUBJECT_OPTIONS, COLOR_PALETTE_OPTIONS for label lookup
- `lib/constants/twists.ts` → CREATIVE_TWISTS for random twist selection

**Exports:**
- Re-exports Prompt type for convenience
- Provides getTodayPrompt and createManualPrompt as public API

**Database Schema:**
- Prompts table with 10 columns (id, user_id, date_key, source, medium, subject, color_rule, twist, prompt_text, created_at)
- Partial unique index on (user_id, date_key) WHERE source = 'daily'
- Two indexes for performance: user_date (DESC) and user_subject_recent (DESC)
- RLS policies: users can only read/insert own prompts

## Deviations from Plan

None - plan executed exactly as written.

## Task Completion Details

| Task | Name                                      | Commit  | Files                                                 |
| ---- | ----------------------------------------- | ------- | ----------------------------------------------------- |
| 1    | Create types, schema, and twist constants | 833722b | lib/constants/twists.ts, lib/schemas/prompts.ts       |
| 2    | Build complete prompt generation service  | 7fc5598 | lib/services/prompts.ts                               |

## Verification Results

All verification criteria met:

- ✅ `npx tsc --noEmit` passes (no new errors introduced)
- ✅ Three new files exist: lib/constants/twists.ts, lib/schemas/prompts.ts, lib/services/prompts.ts
- ✅ CREATIVE_TWISTS has exactly 20 entries
- ✅ Prompt type matches database schema (10 fields)
- ✅ getTodayPrompt and createManualPrompt exported from prompts service
- ✅ Service imports getPreferences from preferences service (real integration)
- ✅ SQL migration documented in JSDoc comments with partial unique index
- ✅ getEligibleSubjects filters exclusions AND recent subjects (14-day window)
- ✅ Graceful fallback when all subjects recently used
- ✅ assemblePromptText produces readable sentence from preference IDs
- ✅ ~50% twist probability, ~40% color rule probability implemented
- ✅ Daily prompt uses upsert, manual prompt uses insert

## Success Criteria Validation

- ✅ Prompt service compiles and exports getTodayPrompt + createManualPrompt
- ✅ getEligibleSubjects filters exclusions AND recent subjects (14-day window)
- ✅ Graceful fallback when all subjects are recently used (allow repeats, still respect exclusions)
- ✅ assemblePromptText produces readable sentence from preference IDs
- ✅ ~50% twist probability, ~40% color rule probability (when user has color prefs)
- ✅ Daily prompt uses upsert for idempotent retrieval, manual prompt uses insert
- ✅ SQL migration documented for prompts table with partial unique index

## Next Steps

**Phase 03 Plan 02:** Build React Native UI components that consume this service (PromptCard, home screen integration)

**Required before production:**
- Run SQL migration in Supabase to create prompts table (documented in lib/schemas/prompts.ts)
- Test with small subject pools to verify graceful fallback behavior
- Test race condition handling (multiple simultaneous getTodayPrompt calls)

## Self-Check: PASSED

**Created files verified:**
```
FOUND: lib/constants/twists.ts
FOUND: lib/schemas/prompts.ts
FOUND: lib/services/prompts.ts
```

**Commits verified:**
```
FOUND: 833722b
FOUND: 7fc5598
```

**File counts:**
- CREATIVE_TWISTS entries: 20
- Prompt type fields: 10
- Exported functions: 2 (getTodayPrompt, createManualPrompt)
- Internal helpers: 5 (getTodayDateKey, randomItem, getEligibleSubjects, assemblePromptText, generatePrompt)

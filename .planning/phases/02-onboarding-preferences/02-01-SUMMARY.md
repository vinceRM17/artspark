---
phase: 02-onboarding-preferences
plan: 01
subsystem: onboarding
tags: [data-layer, ui-components, preferences, validation]
dependency_graph:
  requires:
    - 01-01-foundation-setup
    - 01-02-auth-session
  provides:
    - onboarding-schemas
    - preferences-service
    - onboarding-status-hook
    - onboarding-ui-components
  affects:
    - 02-02-onboarding-steps
    - 02-03-onboarding-flow
tech_stack:
  added:
    - zod: "^4.x"
    - react-hook-form: "^7.x"
    - "@hookform/resolvers": "^3.x"
  patterns:
    - "Zod schema validation for form data"
    - "Supabase upsert pattern for preferences"
    - "Controlled component pattern for UI"
    - "NativeWind v4 styling with artistic color palette"
key_files:
  created:
    - lib/constants/preferences.ts
    - lib/schemas/onboarding.ts
    - lib/services/preferences.ts
    - lib/hooks/useOnboardingStatus.ts
    - components/onboarding/OnboardingLayout.tsx
    - components/onboarding/ProgressIndicator.tsx
    - components/onboarding/PreferenceChip.tsx
    - components/onboarding/ChipGrid.tsx
  modified:
    - nativewind-env.d.ts
    - package.json
    - package-lock.json
decisions:
  - decision: "Use Zod for runtime and compile-time validation of onboarding data"
    rationale: "Type-safe validation with inference, better error messages than manual checks"
    alternatives: "Yup, manual validation"
  - decision: "Upsert pattern with onConflict: 'user_id' for preferences"
    rationale: "Handles both first-time onboarding and preference updates with single call"
    alternatives: "Separate insert/update logic"
  - decision: "Controlled components for ChipGrid/PreferenceChip"
    rationale: "Parent manages state, components are pure presentation - easier to test and reuse"
    alternatives: "Internal state management"
  - decision: "Cream (#FFF8F0) and sage green (#7C9A72) as primary artistic colors"
    rationale: "Warm, plant-inspired, calm - aligns with creative/mindful app philosophy"
    alternatives: "Cool blues, vibrant colors"
  - decision: "__DEV__ bypass for onboarding status in development"
    rationale: "Developers can skip onboarding during iteration without DB setup"
    alternatives: "Environment variable, always require onboarding"
metrics:
  duration_minutes: 3
  completed_date: "2026-02-13"
  tasks_completed: 2
  files_created: 11
  commits: 2
---

# Phase 2 Plan 01: Onboarding Data Layer & UI Components Summary

Zod schemas, Supabase preferences service, onboarding status hook, and reusable artistic UI components for multi-step onboarding flow.

## Objective

Build the data layer (schemas, services, hooks) and reusable UI components for the onboarding flow. This establishes the foundation that all 5 onboarding steps will use -- validated data shapes, Supabase persistence, onboarding status detection, and artistic chip-based multi-select components.

## Tasks Completed

### Task 1: Create schemas, services, hooks, and preference constants
**Commit:** `839a42a`
**Files:** `lib/constants/preferences.ts`, `lib/schemas/onboarding.ts`, `lib/services/preferences.ts`, `lib/hooks/useOnboardingStatus.ts`

**What was built:**
- **Preference constants** with 12 medium options, 8 color palette options, 12 subject options
- **Zod schemas** for all 5 onboarding steps:
  - Step 1 (mediums): min 1 required
  - Step 2 (color palettes): optional
  - Step 3 (subjects): min 1 required
  - Step 4 (exclusions): optional
  - Step 5 (notification time): hour/minute validation
  - Combined `completeOnboardingSchema` with TypeScript type inference
- **Preferences service** with three functions:
  - `savePreferences()`: Upsert with `onConflict: 'user_id'`
  - `getPreferences()`: Gracefully handles "no rows" case
  - `markOnboardingComplete()`: Sets completion flag
  - SQL migration documented in file comments for `user_preferences` table
- **useOnboardingStatus hook**: Checks Supabase for completion flag with `__DEV__` bypass support
- **Dependencies installed**: `react-hook-form`, `zod`, `@hookform/resolvers`
- **Type fix**: Added `__DEV__` global declaration to `nativewind-env.d.ts`

**Key implementation details:**
- Preferences service uses `.upsert()` with `onConflict: 'user_id'` to handle both first onboarding and updates
- Hook returns `{ onboardingComplete: boolean | null, loading: boolean }`
- PGRST116 "no rows" error handled gracefully (returns null, not error)
- SQL migration includes RLS policies for user-scoped access
- Dev bypass: AsyncStorage key `@artspark:dev-skip-onboarding` set to 'true' skips check in `__DEV__`

### Task 2: Build reusable onboarding UI components
**Commit:** `28ad43b`
**Files:** `components/onboarding/OnboardingLayout.tsx`, `components/onboarding/ProgressIndicator.tsx`, `components/onboarding/PreferenceChip.tsx`, `components/onboarding/ChipGrid.tsx`

**What was built:**
- **OnboardingLayout**: Full-screen wrapper with progress, title, scrollable content, and fixed bottom action buttons
  - Props: `children`, `step`, `totalSteps`, `title`, `subtitle?`, `onNext`, `onSkip?`, `nextLabel?`, `nextDisabled?`, `showSkip?`
  - SafeAreaView with cream background (#FFF8F0)
  - Large sage green "Next" button, disabled state grays out
  - Optional skip text button below main action
- **ProgressIndicator**: Dot-based step tracker
  - Active step: sage green (#7C9A72)
  - Completed steps: lighter green (#A8C5A0)
  - Upcoming steps: light gray
  - Shows "Step X of Y" text below dots
- **PreferenceChip**: Tappable pill component
  - Selected: sage green background, white text
  - Unselected: cream background with gray border
  - 44px min height for accessibility (Apple HIG)
  - `TouchableOpacity` with controlled selection state
- **ChipGrid**: Multi-select grid wrapper
  - Renders array of PreferenceChip components
  - Parent manages selected state via `selectedIds` array
  - `onToggle(id)` callback for selection changes
  - Flex-wrap with gap spacing

**Design system:**
- Primary colors: Cream (#FFF8F0), Sage Green (#7C9A72)
- Secondary: Light Green (#A8C5A0), Gray tones for inactive states
- Typography: Bold 2xl titles, base body text
- Spacing: Generous padding (px-6, py-4), rounded-xl buttons
- Accessibility: 44px min tap targets, good contrast ratios

**Component patterns:**
- All use controlled component pattern (parent manages state)
- NativeWind v4 className styling throughout
- ScrollView for long content lists
- SafeAreaView for device-safe layouts

## Verification Results

All verification criteria met:
- All 8 files exist and are tracked in git
- TypeScript compilation successful (existing app errors unrelated to new code)
- Exports verified:
  - `lib/schemas/onboarding.ts`: step1-5 schemas, completeOnboardingSchema, OnboardingData type
  - `lib/services/preferences.ts`: savePreferences, getPreferences, markOnboardingComplete, UserPreferences type
  - `lib/hooks/useOnboardingStatus.ts`: useOnboardingStatus function
  - `lib/constants/preferences.ts`: MEDIUM_OPTIONS, COLOR_PALETTE_OPTIONS, SUBJECT_OPTIONS
  - All UI components export default functions
- Schemas enforce min(1) on mediums and subjects, optional on colors and exclusions
- Preferences service uses Supabase upsert with onConflict pattern
- SQL migration documented in preferences.ts
- OnboardingLayout provides consistent wrapper with warm artistic styling
- ChipGrid + PreferenceChip provide multi-select interaction

## Deviations from Plan

**1. [Rule 2 - Missing Critical] Added `__DEV__` global type declaration**
- **Found during:** Task 1 type checking
- **Issue:** TypeScript didn't recognize React Native's `__DEV__` global
- **Fix:** Added `declare const __DEV__: boolean;` to `nativewind-env.d.ts`
- **Files modified:** `nativewind-env.d.ts`
- **Commit:** 839a42a
- **Rationale:** Critical for compilation, no impact on runtime behavior

No other deviations. Plan executed exactly as specified.

## Success Criteria

All criteria met:
- [x] All data layer files (schemas, services, hooks, constants) exist and compile
- [x] All UI component files exist and compile
- [x] Schemas enforce min(1) on mediums and subjects, optional on colors and exclusions
- [x] Preferences service uses Supabase upsert pattern with onConflict: 'user_id'
- [x] SQL migration for user_preferences table documented in preferences.ts comments
- [x] OnboardingLayout provides consistent step wrapper with warm artistic styling
- [x] ChipGrid + PreferenceChip provide multi-select interaction pattern
- [x] useOnboardingStatus has __DEV__ bypass

## Next Steps

**Immediate (Plan 02-02):**
- Create Supabase `user_preferences` table using SQL migration from preferences.ts
- Build 5 onboarding step screens using the data layer and UI components
- Wire up form handling with react-hook-form and Zod validation

**Dependencies unlocked:**
- 02-02-PLAN.md can now use all schemas, services, hooks, and UI components
- 02-03-PLAN.md can build routing and completion flow on top of this foundation

## Self-Check: PASSED

**Created files verification:**
```
lib/constants/preferences.ts: FOUND
lib/schemas/onboarding.ts: FOUND
lib/services/preferences.ts: FOUND
lib/hooks/useOnboardingStatus.ts: FOUND
components/onboarding/OnboardingLayout.tsx: FOUND
components/onboarding/ProgressIndicator.tsx: FOUND
components/onboarding/PreferenceChip.tsx: FOUND
components/onboarding/ChipGrid.tsx: FOUND
```

**Commits verification:**
```
839a42a: FOUND (Task 1: data layer)
28ad43b: FOUND (Task 2: UI components)
```

All files created and commits exist. No missing artifacts.

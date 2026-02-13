# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Every day, an artist opens the app and sees one clear, personalized prompt that sparks them to create — and over time builds a personal creative history they can look back on.
**Current focus:** Phase 2 - Onboarding & Preferences

## Current Position

Phase: 2 of 6 (Onboarding & Preferences)
Plan: 2 of 3 in current phase (02-01, 02-02 complete)
Status: Active - executing phase 02 plans
Last activity: 2026-02-13 — Plan 02-02 executed

Progress: [███░░░░░░░] 25% (2/6 phases started, 1 complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 38 min
- Total execution time: 2.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01    | 2     | 146m  | 73m      |
| 02    | 2     | 5m    | 2.5m     |

**Recent Trend:**
- Last 5 plans: 01-01 (144m), 01-02 (2m), 02-01 (3m), 02-02 (2m)
- Trend: Foundation work established, subsequent plans executing rapidly

*Updated after each plan completion*
| Phase 02 P01 | 3 | 2 tasks | 11 files |
| Phase 02-onboarding-preferences P02 | 2 | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Expo (React Native) over Flutter/native — TypeScript ecosystem, fast cross-platform, strong notification support
- [Init]: Supabase over Firebase — Postgres better for relational data (prompts→responses), built-in auth + storage, simpler RLS
- [Init]: Local seed-based prompts over AI — No API costs, no latency, fully offline-capable prompt logic, easy to curate
- [Init]: Share outward only (no internal community) — Anti-social-media philosophy, reduces scope massively
- [Init]: Daily local notifications (not remote) — Simpler to implement, no server-side scheduling needed for MVP
- [01-01]: NativeWind v4 over v5 — v4 stable, v5 in preview; following plan specification
- [01-01]: AsyncStorage for Supabase sessions — Official recommendation for RN; sessions are encrypted JWTs
- [01-01]: Manual Expo setup vs create-expo-app — Directory name with spaces blocked automated setup
- [01-02]: SessionProvider manages auth state via Supabase onAuthStateChange listener — Official Supabase pattern for React
- [01-02]: useStorageState abstracts SecureStore (native) and localStorage (web) — Expo Router official authentication pattern
- [01-02]: signInWithOtp used instead of deprecated signIn method — Supabase v2 best practice
- [02-01]: Zod for validation — Type-safe validation with inference, better error messages than manual checks
- [02-01]: Upsert pattern with onConflict: 'user_id' — Handles both first-time onboarding and preference updates with single call
- [02-01]: Controlled components for ChipGrid/PreferenceChip — Parent manages state, components are pure presentation
- [02-01]: Cream (#FFF8F0) and sage green (#7C9A72) as primary artistic colors — Warm, plant-inspired, calm aesthetic
- [02-01]: __DEV__ bypass for onboarding status — Developers can skip onboarding during iteration without DB setup
- [02-02]: AsyncStorage for cross-step state persistence — Simple data sharing between onboarding steps without global state library
- [02-02]: Filter step 4 exclusions to remove step 3 subjects — Prevents logical contradiction in preference selections

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1:**
- Supabase email deliverability in production — Must configure custom SMTP (Resend/SendGrid) before launch to avoid magic links being filtered as spam

**Phase 3:**
- Seed-based randomization algorithm needs research — Date-to-seed strategy, Fisher-Yates shuffle with exclusions, handling large preference datasets

**Phase 6:**
- Android notification reliability on production builds — Known issues with background task persistence on Android 12+, requires production testing

## Session Continuity

Last session: 2026-02-13 (plan 02-02 execution)
Stopped at: Plan 02-02 complete - onboarding steps 1-4 built with preference collection flow
Resume file: .planning/phases/02-onboarding-preferences/02-02-SUMMARY.md

---
*Created: 2026-02-12*
*Last updated: 2026-02-13 04:42*

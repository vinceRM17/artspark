# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Every day, an artist opens the app and sees one clear, personalized prompt that sparks them to create — and over time builds a personal creative history they can look back on.
**Current focus:** Phase 5 - History + Tracking

## Current Position

Phase: 5 of 6 (History + Tracking)
Plan: 0 of TBD in current phase
Status: Planning phase 05
Last activity: 2026-02-13 — Phase 04 complete

Progress: [██████░░░░] 67% (4/6 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 22 min
- Total execution time: 2.6 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01    | 2     | 146m  | 73m      |
| 02    | 2     | 5m    | 2.5m     |
| 03    | 2     | 4m    | 2m       |
| 04    | 2     | 6m    | 3m       |

**Recent Trend:**
- Last 5 plans: 02-02 (2m), 03-01 (2m), 03-02 (2m), 04-01 (3m), 04-02 (3m)
- Trend: Consistent 2-3 min execution - Phase 4 response capture complete

*Updated after each plan completion*
| Phase 02 P01 | 3 | 2 tasks | 11 files |
| Phase 02-onboarding-preferences P02 | 2 | 2 tasks | 5 files |
| Phase 03 P01 | 2 | 2 tasks | 3 files |
| Phase 03 P02 | 2 | 3 tasks | 2 files |
| Phase 04-response-capture P01 | 3 | 2 tasks | 7 files |
| Phase 04-response-capture P02 | 3 | 2 tasks | 5 files |

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
- [03-01]: Partial unique index instead of table constraint — Allows unlimited manual prompts while enforcing single daily prompt per user per date
- [03-01]: 14-day subject rotation window — Balances variety with preference pool size, prevents recent repeats without exhausting small subject lists
- [03-01]: Graceful fallback when all subjects recently used — Allows repeats when necessary but always respects exclusions
- [03-01]: ~50% twist probability, ~40% color rule probability — Balances creative challenge with accessibility
- [03-01]: Label lookup from OPTIONS constants at runtime — Single source of truth for preference labels
- [04-01]: react-native-compressor over expo-image-manipulator — Better performance and more reliable compression quality control
- [04-01]: ArrayBuffer upload pattern via base64-arraybuffer — React Native requires base64 to ArrayBuffer conversion for Supabase Storage uploads
- [04-01]: Offline queue stores URIs not base64 — Storing base64 in AsyncStorage causes performance degradation; queue stores metadata only
- [04-01]: Pre-generate response UUID before upload — Ensures consistent Storage file naming (userId/responseId_index_timestamp.ext)
- [04-02]: useImagePicker enforces MAX_IMAGES (3) via picker selectionLimit and state slicing — Prevents exceeding limit at both selection and state levels
- [04-02]: Permission requests before picker launch — Satisfies iOS requirement to request permissions before accessing camera or library
- [04-02]: useResponseUpload auto-processes queue on connectivity restore — useEffect watches isConnected and triggers processQueue automatically
- [04-02]: Share uses local URI not Supabase URL — Native share sheet uses local image URI to avoid download delay

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1:**
- Supabase email deliverability in production — Must configure custom SMTP (Resend/SendGrid) before launch to avoid magic links being filtered as spam

**Phase 3:**
- Seed-based randomization algorithm needs research — Date-to-seed strategy, Fisher-Yates shuffle with exclusions, handling large preference datasets

**Phase 4:**
- Supabase Storage bucket and RLS setup required — User must create 'responses' bucket and run Storage RLS policies before image uploads work

**Phase 6:**
- Android notification reliability on production builds — Known issues with background task persistence on Android 12+, requires production testing

## Session Continuity

Last session: 2026-02-13 (Phase 4 complete - 2 plans executed)
Stopped at: Completed 04-02-PLAN.md - response capture UI with hooks, respond screen, and home navigation
Resume file: .planning/phases/04-response-capture/04-02-SUMMARY.md

---
*Created: 2026-02-12*
*Last updated: 2026-02-13 05:56*

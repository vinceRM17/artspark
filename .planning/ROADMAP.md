# Roadmap: ArtSpark

## Overview

This roadmap delivers a daily art inspiration mobile app from foundation to launch. We build auth and preferences first to enable personalized prompts, then implement the core prompt generation engine with non-repeat logic, add photo upload responses with offline support, create history tracking, and complete the experience with daily notifications and settings. Each phase delivers a coherent, verifiable capability that moves us toward the core value: artists opening the app daily to find one clear, personalized prompt that sparks creation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation + Auth** - Expo project setup with Supabase authentication (completed 2026-02-12)
- [x] **Phase 2: Onboarding + Preferences** - User preference collection and storage (completed 2026-02-13)
- [x] **Phase 3: Prompt Generation** - Core daily prompt engine with personalization (completed 2026-02-13)
- [x] **Phase 4: Response Capture** - Photo upload with offline support (completed 2026-02-13)
- [x] **Phase 5: History + Tracking** - Past prompts and completion tracking (completed 2026-02-13)
- [ ] **Phase 6: Notifications + Settings** - Daily reminders and preference editing

## Phase Details

### Phase 1: Foundation + Auth
**Goal**: Users can securely sign up, log in, and maintain sessions across app restarts
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. User can sign up with email magic link and receive the link in their inbox
  2. User can log in via magic link and session persists across app restarts
  3. User can log out from Settings and session is cleared
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Initialize Expo project and configure Supabase backend
- [x] 01-02-PLAN.md — Implement session management with SessionProvider
- [x] 01-03-PLAN.md — Build authentication UI and protected routes

### Phase 2: Onboarding + Preferences
**Goal**: New users complete preference survey that personalizes their prompt experience
**Depends on**: Phase 1
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05
**Success Criteria** (what must be TRUE):
  1. User completes onboarding survey selecting mediums, colors, subjects, exclusions, and notification time
  2. User preferences are saved to Supabase and persist across sessions
  3. User can skip optional preference sections (like color palettes) during onboarding
  4. User sees clear value explanation before notification permission request
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Build data layer (schemas, services, hooks) and reusable onboarding UI components
- [x] 02-02-PLAN.md — Build onboarding steps 1-4 (mediums, colors, subjects, exclusions)
- [x] 02-03-PLAN.md — Build step 5 (notifications), save to Supabase, integrate routing

### Phase 3: Prompt Generation
**Goal**: Users receive one personalized daily prompt that respects their preferences and doesn't repeat recent subjects
**Depends on**: Phase 2
**Requirements**: PGEN-01, PGEN-02, PGEN-03, PGEN-04, PGEN-05, PGEN-06, PGEN-07, HOME-01, HOME-02, HOME-03, UX-01, UX-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. User sees today's personalized prompt on home screen (big, obvious card)
  2. Prompt combines user's preferred medium, subject, and color rule with optional creative twist
  3. User's excluded subjects never appear in prompts
  4. Same subject does not repeat within 14 days (or configured window)
  5. Opening app multiple times on same day shows same daily prompt (date_key deduplication works)
  6. User can tap "Generate Now" to get an extra on-demand prompt
  7. Home screen has clear "I made something" button to respond to prompt
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md — Build prompt generation service layer (types, constants, algorithm)
- [ ] 03-02-PLAN.md — Build home screen with daily prompt display and action buttons

### Phase 4: Response Capture
**Goal**: Users can upload photos of their artwork in response to prompts, with images stored reliably and working offline
**Depends on**: Phase 3
**Requirements**: RESP-01, RESP-02, RESP-03, RESP-04, RESP-05, RESP-06
**Success Criteria** (what must be TRUE):
  1. User can create a response linked to a prompt by uploading 1-3 photos from camera or library
  2. Images are compressed before upload and do not cause memory issues or app freezes
  3. User can add notes and optional tags to their response
  4. User can share their artwork outward via native share sheet (Instagram, Facebook, Pinterest, etc.)
  5. Responses created while offline are queued and upload automatically when connectivity returns
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Build data layer: response schema, upload constants, image upload/response/offline queue services
- [x] 04-02-PLAN.md — Build hooks (image picker, network status, upload) + response creation screen + share + wire home screen

### Phase 5: History + Tracking
**Goal**: Users can browse past prompts and see their creative progress over time
**Depends on**: Phase 4
**Requirements**: HIST-01, HIST-02, HIST-03
**Success Criteria** (what must be TRUE):
  1. User can view scrollable list of past prompts with completed/not completed status
  2. User can tap a prompt to see detail view with full text and linked responses with photos
  3. Prompts are automatically marked as completed when user adds a response
  4. History list loads quickly and paginates smoothly (no performance issues with 100+ prompts)
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Build data layer: PromptWithStatus type, history/detail service queries, usePromptHistory hook with pagination and caching
- [x] 05-02-PLAN.md — Build history list screen, prompt detail screen, wire navigation routes, and cache invalidation on response creation

### Phase 6: Notifications + Settings
**Goal**: Users receive daily reminders at their chosen time and can adjust preferences as needed
**Depends on**: Phase 5
**Requirements**: NOTF-01, NOTF-02, NOTF-03, NOTF-04, SETT-01, SETT-02, SETT-03, SETT-04
**Success Criteria** (what must be TRUE):
  1. User receives daily local notification at configured time
  2. Changing notification time in Settings immediately reschedules the notification
  3. User can edit all preferences (mediums, colors, subjects, exclusions) from Settings
  4. User sees "Pro (coming soon)" placeholder toggle in Settings for future subscription
  5. User can reset prompt history with confirmation dialog (danger action)
  6. Notifications work reliably in production builds on both iOS and Android
**Plans**: 2 plans

Plans:
- [ ] 06-01-PLAN.md -- Service layer extensions (notifications, push token, history reset) and settings UI components
- [ ] 06-02-PLAN.md -- Complete settings screen assembly with all sections and human verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Auth | 3/3 | Complete | 2026-02-12 |
| 2. Onboarding + Preferences | 3/3 | Complete | 2026-02-13 |
| 3. Prompt Generation | 2/2 | Complete | 2026-02-13 |
| 4. Response Capture | 2/2 | Complete | 2026-02-13 |
| 5. History + Tracking | 2/2 | Complete | 2026-02-13 |
| 6. Notifications + Settings | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-12*
*Last updated: 2026-02-14*

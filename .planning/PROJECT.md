# ArtSpark

## What This Is

ArtSpark is a daily art inspiration generator mobile app that creates personalized prompts based on an artist's preferred mediums, color palettes, and subject matter. It sends daily notifications, avoids repeating recent subjects, and lets users save and share their response artwork. Built as a personal creative tool — not a social media platform — with a clean, StoryGraph-inspired feel.

## Core Value

Every day, an artist opens the app and sees one clear, personalized prompt that sparks them to create — and over time builds a personal creative history they can look back on.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Preference-based onboarding survey (mediums, colors, subjects, exclusions, notification time)
- [ ] Daily prompt generation with non-repeat logic (configurable repeat window)
- [ ] One daily prompt per user, with "Generate now" option for extras
- [ ] Photo upload responses (1–3 images per response, camera or library)
- [ ] Response notes and optional tags
- [ ] History view with completion status
- [ ] Prompt detail view with linked responses
- [ ] Share artwork outward via native share sheet (multi-platform: Instagram, Facebook, Pinterest, etc.)
- [ ] Daily local push notifications at user-configured time
- [ ] Edit preferences in Settings
- [ ] "Pro (coming soon)" placeholder toggle in Settings
- [ ] Email-based auth (magic link or OTP)
- [ ] Clean, minimal UI with big buttons and few taps — accessible font sizes and contrast

### Out of Scope

- In-app social community / feed — deliberately anti-social-media; share outward only
- Payment / billing in v1 — placeholder only, implement when trivial or post-MVP
- AI-powered prompt generation — use local seed-based generation for MVP
- Web version — mobile-first via Expo (React Native) cross-platform
- Internal messaging or commenting between users
- Advanced analytics or streak tracking — simple completion history is enough for v1

## Context

- Target users: broad range of artists — hobbyists, practicing artists, and students who want daily creative nudges
- Community strategy: build user base through marketing/social, not from an existing group
- UX inspiration: StoryGraph — clean card layouts, onboarding survey that personalizes experience, progress/history tracking, personal tool first
- Prompt generation uses curated seed lists (mediums, subjects, color rules, twists) — no AI dependency
- Data model: profiles, preferences, prompts (with date_key dedup), responses (with image URLs), storage bucket for uploaded images
- One prompt per day per user (date_key based), extras logged as "manual" source

## Constraints

- **Platform**: Expo (React Native) — cross-platform iOS + Android from single codebase
- **Language**: TypeScript throughout
- **Backend**: Supabase (Auth + Postgres + Storage) — fastest path to auth + DB + file storage with minimal glue
- **Notifications**: Expo Push Notifications (local scheduling for MVP)
- **UX**: Extremely simple, big-button, few-tap design — non-technical artists must feel comfortable immediately
- **Styling**: StoryGraph-like — clean, readable, minimal steps, collapsible "details" sections rather than clutter

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Expo (React Native) over Flutter/native | TypeScript ecosystem, fast cross-platform, strong notification support | — Pending |
| Supabase over Firebase | Postgres > Firestore for relational data (prompts→responses), built-in auth + storage, simpler RLS | — Pending |
| Local seed-based prompts over AI | No API costs, no latency, fully offline-capable prompt logic, easy to curate | — Pending |
| No payments in v1 | Reduces complexity, placeholder Pro toggle preserves upgrade path | — Pending |
| Share outward only (no internal community) | Anti-social-media philosophy, reduces scope massively, native share sheet covers multi-platform | — Pending |
| Daily local notifications (not remote) | Simpler to implement, no server-side scheduling needed for MVP | — Pending |

---
*Last updated: 2026-02-12 after initialization*

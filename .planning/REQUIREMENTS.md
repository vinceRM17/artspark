# Requirements: ArtSpark

**Defined:** 2026-02-12
**Core Value:** Every day, an artist opens the app and sees one clear, personalized prompt that sparks them to create — and over time builds a personal creative history.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can sign up and log in via email magic link (passwordless)
- [ ] **AUTH-02**: User session persists across app restarts without re-authentication
- [ ] **AUTH-03**: User can log out from Settings

### Onboarding

- [ ] **ONBD-01**: User can select preferred art mediums from a multi-select list (watercolor, gouache, acrylic, oil, pencil, ink, digital, collage, paper art, etc.)
- [ ] **ONBD-02**: User can optionally select color palette preferences (earthy, vibrant, monochrome, pastels, complementary, warm/cool, "random ok")
- [ ] **ONBD-03**: User can select preferred subjects from a multi-select list (animals, landscapes, people/portraits, still life, abstract, urban, botanicals, fantasy, etc.)
- [ ] **ONBD-04**: User can exclude specific subjects they never want to see
- [ ] **ONBD-05**: User can set preferred daily notification time during onboarding

### Prompt Generation

- [ ] **PGEN-01**: App generates one personalized daily prompt combining medium + color rule + subject + optional twist
- [ ] **PGEN-02**: Prompt generation respects user's preferred mediums, colors, and subjects
- [ ] **PGEN-03**: Prompt generation excludes user's excluded subjects
- [ ] **PGEN-04**: Same subject does not repeat within configurable repeat window (default 14 days, graceful fallback for small subject sets)
- [ ] **PGEN-05**: Only one daily prompt per user per date (date_key deduplication); if already exists, show existing
- [ ] **PGEN-06**: User can tap "Generate Now" to get an extra prompt on demand (logged as "manual" source)
- [ ] **PGEN-07**: ~50% of prompts include a creative "twist" element for variety

### Home Screen

- [ ] **HOME-01**: Home screen prominently displays today's prompt card (big, obvious)
- [ ] **HOME-02**: Home screen has "Generate Now" button for extra prompts
- [ ] **HOME-03**: Home screen has "I made something" button to add a response

### Responses

- [ ] **RESP-01**: User can create a response linked to a prompt
- [ ] **RESP-02**: User can upload 1–3 images per response (from camera or photo library)
- [ ] **RESP-03**: Images are compressed before upload to prevent memory/performance issues
- [ ] **RESP-04**: User can add notes text to a response
- [ ] **RESP-05**: User can add optional tags to a response
- [ ] **RESP-06**: User can share artwork outward via native share sheet (Instagram, Facebook, Pinterest, etc.)

### History

- [ ] **HIST-01**: User can view scrollable list of past prompts with completed/not completed status
- [ ] **HIST-02**: User can tap a prompt to see detail view with full text, linked responses, and photos
- [ ] **HIST-03**: Prompts are marked as completed when user adds a response

### Notifications

- [ ] **NOTF-01**: App requests notification permission with clear explanation
- [ ] **NOTF-02**: Daily local notification fires at user's configured time
- [ ] **NOTF-03**: Changing notification time in Settings reschedules the notification
- [ ] **NOTF-04**: App stores Expo push token for future remote notification capability

### Settings

- [ ] **SETT-01**: User can edit all preferences (mediums, colors, subjects, exclusions) from Settings
- [ ] **SETT-02**: User can enable/disable and change notification time
- [ ] **SETT-03**: Settings shows "Pro (coming soon)" placeholder toggle for future subscription (~$25/yr)
- [ ] **SETT-04**: User can reset prompt history with confirmation dialog (danger action)

### UX & Accessibility

- [ ] **UX-01**: UI uses clean, minimal card layouts (StoryGraph-inspired)
- [ ] **UX-02**: Big, obvious buttons with minimal taps to complete any action
- [ ] **UX-03**: Collapsible "details" sections rather than cluttering primary views
- [ ] **UX-04**: Accessible font sizes and sufficient color contrast

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-04**: User can sign in with Google OAuth
- **AUTH-05**: User can sign in with Apple (iOS requirement for apps with social login)

### Content

- **CONT-01**: AI-powered prompt generation for more creative/varied prompts
- **CONT-02**: User can skip/refresh daily prompt (1x per day)
- **CONT-03**: Calendar view of prompt history with completion indicators

### Social

- **SOCL-01**: User can view public gallery of community artwork (opt-in)
- **SOCL-02**: User can follow favorite artists' responses

### Monetization

- **MONET-01**: Pro subscription unlocked via in-app purchase (~$25/yr)
- **MONET-02**: Pro features: unlimited "Generate Now", AI prompts, advanced filters

### Platform

- **PLAT-01**: Offline-first with background sync when connectivity returns
- **PLAT-02**: Cloud sync across multiple devices
- **PLAT-03**: Export personal gallery as PDF/image collection

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| In-app social feed / community | Deliberately anti-social-media; share outward only |
| Likes, followers, comments | Social pressure contradicts personal creative tool philosophy |
| Real-time chat or messaging | Not a communication platform |
| Payment/billing in v1 | Placeholder only; implement when trivial or post-MVP |
| AI prompt generation in v1 | Local seed-based keeps it simple, free, offline-capable |
| Web version | Mobile-first; web can come later |
| Streak tracking / gamification | Non-punitive completion tracking only; streaks create anxiety |
| Advanced analytics | Simple history is enough for v1 |
| Content moderation | No user-generated public content in v1 |
| Multi-language support | English only for MVP |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| — | — | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 0
- Unmapped: 30

---
*Requirements defined: 2026-02-12*
*Last updated: 2026-02-12 after initial definition*

# Pitfalls Research

**Domain:** Daily art inspiration mobile app (Expo + Supabase)
**Researched:** 2026-02-12
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: Supabase RLS Not Enabled on Tables

**What goes wrong:**
Database tables remain completely public with no access controls. User data from one account is visible to all other users. This is the #1 security vulnerability in Supabase apps. In January 2025, 170+ apps built with Lovable were found to have exposed databases because developers didn't enable RLS, and 83% of exposed Supabase databases involve RLS misconfigurations.

**Why it happens:**
RLS is disabled by default when you create tables in Supabase. Developers assume authentication alone protects data, or they enable RLS but forget to create policies, which blocks all access (even authenticated users).

**How to avoid:**
1. Enable RLS immediately after creating each table: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY`
2. Create at least one policy after enabling RLS (start simple: `user_id = auth.uid()`)
3. Add indexes on user_id columns for performance
4. Test from the client SDK, not the SQL editor (which uses service role and bypasses RLS)

**Warning signs:**
- Tables in Supabase dashboard show "RLS disabled" badge
- SQL queries in the editor return all data regardless of user context
- No policies listed under "Authentication > Policies" for a table
- Users reporting they can see other users' data in production

**Phase to address:**
Phase 1 (Database setup) - RLS enablement and basic policies must be in place before any user-facing features.

---

### Pitfall 2: Image Upload Memory Explosion

**What goes wrong:**
App freezes or crashes when users upload photos. JavaScript thread locks up for 10-30 seconds. Memory usage spikes to 200+ MB for a single 15MB photo because the entire image is loaded into memory, processed, and converted to base64 for upload.

**Why it happens:**
Expo ImagePicker loads full-resolution images (4000x3000+ pixels) into memory. Apps then convert to base64 for upload without compression. React Native runs on a single JavaScript thread, so synchronous image processing blocks all UI updates.

**How to avoid:**
1. Configure ImagePicker with quality and size constraints:
   ```typescript
   {
     mediaTypes: ImagePicker.MediaTypeOptions.Images,
     allowsEditing: true,
     quality: 0.7,  // 70% quality
     allowsMultipleSelection: true,
     selectionLimit: 3
   }
   ```
2. Avoid base64 - upload directly as FormData with blob/file URIs
3. Implement chunked uploads for files >2MB (500KB segments, checkpoint-based resumable transfers)
4. Use react-native-image-resizer or expo-image-manipulator to resize before upload
5. Show loading indicator during upload - never block the UI thread

**Warning signs:**
- ImagePicker returns files >5MB without compression applied
- App becomes unresponsive when selecting photos
- Memory warnings in development console
- Android users reporting "app not responding" dialogs
- Upload progress never shows (blocked thread prevents UI update)

**Phase to address:**
Phase 1 (Photo upload feature) - Compression and size limits must be implemented from day one, not added later as performance fix.

---

### Pitfall 3: Local Notification Scheduling Breaks in Background

**What goes wrong:**
Notifications work perfectly in development but fail in production. Notifications are accurate when app is foregrounded but never fire (or fire at wrong times) when app is backgrounded or killed. Android users report notifications arriving hours late or never arriving.

**Why it happens:**
Platform differences in background task handling. Android 12+ has strict battery optimization that kills background tasks. iOS requires explicit permission and proper notification configuration. Development builds run with different power management than production. Local notifications scheduled while app is killed require RECEIVE_BOOT_COMPLETED permission on Android to reschedule after device restart.

**How to avoid:**
1. Request permissions early with explicit user education:
   ```typescript
   const { status } = await Notifications.requestPermissionsAsync();
   if (status !== 'granted') {
     // Show explanation, don't fail silently
   }
   ```
2. Configure Android notification channels in app.json:
   ```json
   "android": {
     "adaptiveIcon": { ... },
     "permissions": ["RECEIVE_BOOT_COMPLETED"],
     "useNextNotificationsApi": true
   }
   ```
3. Use `setNotificationChannelAsync()` to create channels with proper priority
4. Test on real devices in production builds, not just development builds
5. Register `NotificationResponseReceivedListener` at module top-level (before app mounts)
6. Store notification schedule in local storage, reschedule on app launch if needed

**Warning signs:**
- Notifications work in Expo Go but not in production APK/IPA
- Foreground notifications work, background notifications don't
- Inconsistent delivery times (±30 min variance)
- Android users report no notifications after device reboot
- No error messages, notifications just silently fail

**Phase to address:**
Phase 1 (Daily notifications) - Must be tested in production builds on real devices before launch. This cannot be verified in development builds alone.

---

### Pitfall 4: Supabase Storage Upload Without Proper RLS Policies

**What goes wrong:**
Users can't upload images even though they're authenticated. Upload returns "new row violates row-level security policy" error. Or worse: uploads succeed but anyone can access/delete anyone else's images via direct URL.

**Why it happens:**
Storage buckets have separate RLS policies from database tables. Developers configure database RLS but forget Storage RLS. Service role key bypasses RLS during development, hiding the issue until production. RLS policies on storage.objects table must explicitly allow INSERT for uploads.

**How to avoid:**
1. Enable RLS on storage buckets in Supabase dashboard under Storage > Policies
2. Create explicit INSERT policy for authenticated uploads:
   ```sql
   CREATE POLICY "Users can upload own images"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'art-responses' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```
3. Create SELECT policy for viewing (decide: own images only or public read):
   ```sql
   CREATE POLICY "Anyone can view images"
   ON storage.objects
   FOR SELECT
   TO public
   USING ( bucket_id = 'art-responses' );
   ```
4. Never use service role key in client code - only use anon key
5. Test uploads from client SDK with real user authentication

**Warning signs:**
- Uploads work in development with service role but fail with anon key
- Error: "new row violates row-level security policy" on upload
- Storage bucket shows "RLS disabled" in dashboard
- Images uploaded successfully but return 403 when accessing URLs
- Users can delete other users' images

**Phase to address:**
Phase 1 (Photo upload) - Storage RLS must be configured before photo upload feature is released. Test with anon key, not service role.

---

### Pitfall 5: Prompt Deduplication Logic Fails at Boundaries

**What goes wrong:**
Users see the same prompt twice within the repeat_window_days period. Deduplication works for 28 days, then same prompts reappear on day 29 and 30. Edge case: user changes timezone or travels, prompt appears "tomorrow" but is actually same day in new timezone, breaks deduplication by date_key.

**Why it happens:**
Naive deduplication checks if prompt was used in last N days but doesn't handle wraparound (when checking goes past start of user's history). Date-based keys use local device time, not UTC, so timezone changes create new date_keys for same calendar day. Seed-based randomization without history awareness will eventually regenerate same sequence.

**How to avoid:**
1. Store prompt history in database with UTC timestamps, not date strings:
   ```sql
   CREATE TABLE user_prompt_history (
     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id uuid REFERENCES auth.users NOT NULL,
     prompt_id text NOT NULL,
     shown_at timestamptz NOT NULL DEFAULT now(),
     date_key text NOT NULL -- For quick lookups: YYYY-MM-DD in UTC
   );
   CREATE INDEX idx_user_prompts ON user_prompt_history(user_id, shown_at DESC);
   ```
2. Query for duplicates using timestamp range, not date count:
   ```sql
   SELECT prompt_id FROM user_prompt_history
   WHERE user_id = $1
   AND shown_at > now() - interval '30 days'
   ```
3. Use Fisher-Yates shuffle on filtered array (prompts not in recent history)
4. Generate date_key from UTC time on server, not local device time
5. Add uniqueness constraint to prevent same prompt twice on same date:
   ```sql
   CREATE UNIQUE INDEX idx_one_prompt_per_day
   ON user_prompt_history(user_id, date_key);
   ```

**Warning signs:**
- Same prompt appears twice within configured repeat window
- Duplicate prompts appear after user travels between timezones
- Prompts repeat in same sequence after 30-60 days
- Query takes >200ms (missing index on user_id + shown_at)
- Deduplication works in local testing but fails in production

**Phase to address:**
Phase 1 (Prompt generation) - Deduplication logic must be tested across timezone changes and with full repeat_window_days history before launch.

---

### Pitfall 6: Supabase Auth Email Deliverability Failures in Production

**What goes wrong:**
Magic link emails work in development but never arrive in production. Emails land in spam folder. Email links are single-use but get scanned by enterprise email scanners, so link is consumed before user clicks it. Some users never receive emails at all (suppression lists).

**Why it happens:**
Supabase's default SMTP server is for development only, not production use. No DKIM/DMARC/SPF configuration causes spam filtering. Email provider suppression lists block delivery after bounces. Link tracking in custom SMTP rewrites/breaks Supabase auth URLs. Enterprise email scanners follow links to check for phishing, consuming single-use tokens.

**How to avoid:**
1. Configure custom SMTP provider for production (Resend, SendGrid, AWS SES):
   - Navigate to Authentication > Email Templates in Supabase dashboard
   - Add your SMTP credentials under Settings > Auth > SMTP Settings
2. Set up DKIM, DMARC, SPF records for your sending domain
3. Use separate subdomain for auth emails (auth.example.com vs marketing.example.com)
4. Disable link tracking in your SMTP service (breaks Supabase auth URLs)
5. For enterprise users, implement fallback OTP code (6-digit) in addition to magic link
6. Monitor bounce rates and suppression list in your email provider
7. Add clear "Didn't receive email?" flow with resend option

**Warning signs:**
- Emails arrive in development but not production
- Magic link emails land in spam folder
- Error: "Link expired" when user clicks link immediately after receiving
- Email bounce rate >5%
- Users report "no email received" after 5+ minutes
- SMTP logs show "delivered" but user mailbox is empty

**Phase to address:**
Phase 0 (Pre-launch) - Custom SMTP must be configured before public launch. Cannot rely on Supabase's development SMTP in production.

---

### Pitfall 7: New Architecture Breaking Changes in Expo SDK 55+

**What goes wrong:**
App builds successfully but crashes on launch after upgrading to Expo SDK 55. Third-party libraries that worked in SDK 54 throw "Native module not found" errors. Performance is worse after upgrade, not better. Animated GIFs from ImagePicker stop animating (return static PNG instead).

**Why it happens:**
Expo SDK 55+ runs entirely on React Native's New Architecture (always enabled, cannot be disabled). Many community libraries haven't migrated to new architecture yet. Old bridge-based modules fail at runtime. Libraries must now provide TurboModules/Fabric components instead of legacy native modules.

**How to avoid:**
1. Check library New Architecture compatibility before upgrading SDK:
   - Visit https://reactnative.directory and filter by "New Architecture"
   - Check library GitHub issues for "new architecture" compatibility status
2. Run `npx expo-doctor` after upgrade to identify incompatible dependencies
3. Test critical paths (photo upload, notifications, storage) in development build after upgrade
4. For unsupported libraries, check for maintained alternatives or wait for updates
5. Don't upgrade SDK mid-development - pin to specific SDK version until next major milestone
6. Test on both iOS and Android - New Architecture has platform-specific gotchas

**Warning signs:**
- "Tried to access property X on the NativeModule" errors
- App crashes on module initialization (before React tree renders)
- Third-party library changelog shows "not yet compatible with new architecture"
- Performance regressions after upgrade (slower startup, janky animations)
- Features that worked in SDK 54 fail in SDK 55+

**Phase to address:**
Phase 0 (Initial setup) - Pin to stable Expo SDK version. Don't upgrade mid-development. Schedule SDK upgrades for between major milestones, never during active feature development.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using AsyncStorage for prompt history | Simple API, no database setup | Slow queries (O(n) scan), data loss on app reinstall, no server sync | Never - use Supabase from day 1 |
| Skipping image compression | Faster initial development | App becomes unusable with real photos (30s freezes, crashes) | Never - 10 lines of config prevents disaster |
| Testing only in Expo Go | No build time, instant refresh | Production issues invisible until launch (notifications, deep links fail) | Only for UI prototyping. Must test in development builds before launch. |
| No error boundaries around image upload | Less code upfront | Single upload error crashes entire app | Never - photo upload is core feature, must be isolated |
| Using service role key in client | Bypasses RLS during development | Security vulnerability, impossible to add RLS later without rewrite | Never - use anon key from day 1, even in development |
| Seeded random without history | Simple algorithm, deterministic | Repeats prompts predictably after N days | Only for initial prototype. Must add database history before beta. |
| Local-only notification schedule | Works offline, simple logic | Lost on app reinstall, no cross-device sync | Acceptable if multi-device not in roadmap. Verify in product requirements. |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase auth | Using service role key in React Native client | Use anon key + RLS policies. Service role only in server functions (if any). |
| Supabase Storage | Uploading images to public bucket without checking public access | Create private bucket by default. Use signed URLs if needed for time-limited access. |
| Expo Notifications | Assuming development behavior matches production | Test in production build on real device. Development has different permissions and power management. |
| Expo ImagePicker | Not setting quality parameter, getting 20MB images | Always set quality: 0.7 and allowsEditing: true to enable built-in compression. |
| Supabase Realtime | Not unsubscribing when component unmounts | Store subscription ref, call .unsubscribe() in cleanup. Prevents memory leaks and double subscriptions. |
| Supabase timestamps | Using JavaScript Date.now() directly | Use .toISOString() and store as timestamptz. Database is UTC, convert on client. |
| Expo build | Mixing environment variables in app.json and .env | Use app.config.js for dynamic config. Variables in app.json are baked into build, can't change post-build. |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all user's prompt history on app launch | Slow initial load, high memory | Paginate history queries. Load last 30 days, fetch more on scroll. | >100 prompts (~3 months daily use) |
| No image caching strategy | Redownloading same images on each view | Use expo-image with built-in caching, or react-native-fast-image (30x faster than default Image). | >50 images in history |
| Fetching full-resolution images for thumbnails | Slow gallery scroll, memory spikes | Store multiple sizes in Supabase Storage (thumbnail, medium, full). Fetch thumbnail for list views. | >20 images in gallery |
| Sequential image uploads (await in loop) | 3 images take 30+ seconds to upload | Upload in parallel with Promise.all(). Show progress for each. | >1 image per upload |
| Synchronous prompt randomization on UI thread | UI freezes during selection | Move to async function, show loading state. Use Web Worker for heavy computation (if >1000 prompts). | >500 prompts in database |
| No database indexes on user_id | Queries slow down over time | Add indexes immediately: `CREATE INDEX idx_user_id ON user_prompt_history(user_id)` | >10,000 total records across all users |
| Pulling all user data on login | Slow app startup, wasted bandwidth | Lazy load. Fetch user preferences on login, load history/images on-demand. | User with >50 entries |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Supabase service role key in React Native code | Complete database access to anyone who decompiles app | Never include service role in client. Use anon key + RLS policies only. |
| Public Storage bucket with user photos | User photos accessible by anyone with URL | Use private buckets. Generate signed URLs for sharing (time-limited). Verify bucket privacy settings. |
| No RLS policy on prompt_history table | Users can see other users' prompts and response photos | Enable RLS + policy: `user_id = auth.uid()` for SELECT, INSERT, UPDATE, DELETE. |
| Storing user preferences in AsyncStorage only | Data accessible to anyone with device access, lost on reinstall | Store in Supabase user metadata. Sync to AsyncStorage for offline access only. |
| No rate limiting on prompt generation | User can spam database, generate costs | Add RLS policy: max 1 prompt per day per user. Use database constraints. |
| Allowing users to upload 100MB files | Storage costs explode, DoS attack vector | Enforce max file size client-side (2MB) and in Storage bucket rules (5MB hard limit). |
| No validation on image file types | Users can upload executables disguised as images | Use ImagePicker.mediaTypes to filter. Validate MIME type on upload. Reject non-image files. |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Notification at same time every day (9 AM) | Annoying for night owls, missed by early birds | Let users choose notification time in onboarding. Default to 9 AM local time but make it obvious how to change. |
| No skip/dismiss option for daily prompt | Users feel pressured, guilt from "broken streak" | Add "Skip today" button. No penalties. Track engagement, not streaks (unless user opts into streak mode). |
| Photo upload with no progress indicator | User thinks app is frozen, tries again (duplicate upload) | Show upload progress bar. Disable button during upload. Show success confirmation. |
| No offline support for viewing history | App blank screen when offline | Cache last 30 days of history in local storage. Show "You're offline" message with cached content. |
| Onboarding survey with 10+ questions | 77% of users drop off in first 3 days. Long surveys increase early churn. | Ask 2-3 critical questions max. Make questions skippable. Use progressive disclosure (collect more preferences later in "Settings"). |
| No way to see prompt before uploading photo | Users take photo, then realize prompt doesn't fit | Show prompt prominently above camera/gallery button. Add "Change prompt" option if user doesn't like it. |
| Forcing account creation before seeing app value | Users drop off at signup friction | Let users browse example prompts/public gallery before signup. Require auth only for personalized prompts and uploads. |
| No explanation of notification permission request | Users deny permission by default (untrusted app) | Show value proposition before requesting permission: "Get daily art inspiration at your preferred time." Explain benefit, then request. |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Photo upload:** Often missing error handling for network failures - verify retry logic and user feedback for failed uploads
- [ ] **Local notifications:** Often missing production testing - verify notifications fire correctly in production builds on backgrounded/killed app
- [ ] **Supabase RLS:** Often missing Storage policies - verify RLS enabled on both database tables AND storage buckets
- [ ] **Prompt deduplication:** Often missing timezone handling - verify date_key uses UTC, test with device timezone changes
- [ ] **Image compression:** Often missing quality settings - verify ImagePicker has quality parameter, check actual output file sizes
- [ ] **Auth flow:** Often missing email deliverability config - verify custom SMTP configured, not using Supabase default
- [ ] **History view:** Often missing pagination - verify queries limit to 30-50 records, not fetching entire history
- [ ] **Error boundaries:** Often missing around upload/network - verify image upload wrapped in error boundary with user-friendly message
- [ ] **Offline detection:** Often missing network status checks - verify app shows offline message, doesn't just fail silently
- [ ] **Onboarding skip:** Often missing skip buttons - verify users can skip intro screens and preference questions
- [ ] **Database indexes:** Often missing on user_id columns - verify indexes exist: `\d+ table_name` in Supabase SQL editor
- [ ] **Privacy policy link:** Often broken/missing - verify link in app settings and App Store metadata, must be live before submission

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| RLS not enabled, data exposed | HIGH | 1. Enable RLS immediately. 2. Create restrictive policies. 3. Audit logs for unauthorized access. 4. Notify affected users if data breach confirmed. 5. Add RLS verification to deployment checklist. |
| Images not compressed, app performance terrible | MEDIUM | 1. Add compression to upload flow immediately. 2. Create migration script to resize existing images in Storage. 3. Update RLS policies if bucket changes. 4. Communicate fix to affected users. |
| Notifications not working in production | MEDIUM | 1. Configure notification channels/permissions in app.json. 2. Submit new build to app stores. 3. Communicate to users that update is required. 4. Consider fallback: in-app reminders if push fails. |
| Prompt deduplication broken, users see repeats | LOW | 1. Fix date_key logic to use UTC. 2. Add uniqueness constraint. 3. Backfill date_key for existing records. 4. No user action required if fixed quickly. |
| Email deliverability failing | HIGH | 1. Configure custom SMTP immediately. 2. Set up DKIM/DMARC/SPF. 3. Implement OTP fallback for users who can't receive emails. 4. Communicate alternative auth method to blocked users. |
| AsyncStorage data loss on reinstall | HIGH | 1. Migrate to Supabase for prompt history (backend change). 2. Accept that past data is unrecoverable. 3. Communicate to users that history is now cloud-synced. 4. Add migration code for existing local data. |
| Service role key leaked in client | CRITICAL | 1. Rotate service role key immediately in Supabase dashboard. 2. Audit database for unauthorized changes. 3. Submit new build with anon key only. 4. Add secret scanning to CI/CD. 5. Notify users if data breach confirmed. |
| Storage bucket public, user photos exposed | CRITICAL | 1. Make bucket private immediately. 2. Audit access logs for unauthorized downloads. 3. Notify affected users of exposure. 4. Implement signed URLs for legitimate access. 5. Add privacy audit to launch checklist. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Supabase RLS not enabled | Phase 0 (Database setup) | Run `SELECT tablename FROM pg_tables WHERE rowsecurity = false` - should return empty for user tables. Test client queries with anon key. |
| Image upload memory explosion | Phase 1 (Photo upload) | Test with 15MB photo from iPhone. Monitor memory usage in Xcode Instruments/Android Profiler. Upload should complete in <5s with <50MB RAM. |
| Notification scheduling broken | Phase 1 (Notifications) | Test in production build on real device. Background app, wait 24h. Notification must fire at scheduled time. |
| Storage RLS missing | Phase 1 (Photo upload) | Attempt to upload from client with anon key. Should succeed. Try to access another user's image URL. Should fail with 403. |
| Prompt deduplication fails | Phase 1 (Prompt generation) | Change device timezone, generate prompt. Verify date_key is same as before timezone change. Check no duplicates in 30-day window. |
| Email deliverability failures | Phase 0 (Pre-launch) | Send magic link to Gmail, Outlook, corporate email. All should arrive in <60s in inbox (not spam). |
| New Architecture breaking changes | Phase 0 (Initial setup) | Run `npx expo-doctor`. All checks should pass. Test photo upload, notifications in development build. |
| AsyncStorage performance | Phase 1 (History view) | Query history with 100+ records. Should return in <200ms. Use Supabase, not AsyncStorage for source of truth. |
| No image compression | Phase 1 (Photo upload) | Select photo, check uploaded file size in Storage. Should be <500KB for typical photo, never >2MB. |
| Onboarding too long | Phase 1 (Onboarding) | Track analytics: % of users who complete onboarding. Should be >80%. If <60%, reduce questions. |
| No error boundaries | Phase 1 (Before beta) | Simulate network failure during upload. App should show error message, not crash. Error boundary catches and displays fallback. |
| Missing database indexes | Phase 1 (Before beta) | Run EXPLAIN ANALYZE on user queries. Should use index scan, not sequential scan. Query time <50ms for typical data. |

---

## Sources

### Expo + React Native
- [React Native's New Architecture - Expo Documentation](https://docs.expo.dev/guides/new-architecture/)
- [25 React Native Best Practices for High Performance Apps 2026](https://www.esparkinfo.com/blog/react-native-best-practices/)
- [Troubleshooting Expo: Common Issues and Solutions](https://www.mindfulchase.com/explore/troubleshooting-tips/mobile-frameworks/troubleshooting-expo-common-issues-and-solutions.html)
- [React Native Optimization: Fixing Slow Apps | 2026](https://bitskingdom.com/blog/react-native-performance-optimization-fix-slow-apps/)
- [When Your React Native File Uploads Turn Your App Into a Frozen Potato](https://medium.com/@mohantaankit2002/when-your-react-native-file-uploads-turn-your-app-into-a-frozen-potato-898b8e1054e4)

### Supabase Integration
- [Avoid Common Supabase Gotchas in React Native](https://www.prosperasoft.com/blog/database/supabase/supabase-react-native-gotchas/)
- [Supabase Row Level Security (RLS): Complete Guide (2026)](https://designrevision.com/blog/supabase-row-level-security)
- [Fixing Row-Level Security (RLS) Misconfigurations in Supabase: Common Pitfalls](https://prosperasoft.com/blog/database/supabase/supabase-rls-issues/)
- [Best Practices for Supabase | Security, Scaling & Maintainability](https://www.leanware.co/insights/supabase-best-practices)
- [Supabase Auth Magic Link Issues](https://www.restack.io/docs/supabase-knowledge-supabase-magic-link-troubleshooting)
- [How do I maximize deliverability for Supabase Auth emails? - Resend](https://resend.com/docs/knowledge-base/how-do-i-maximize-deliverability-for-supabase-auth-emails)

### Image Upload & Performance
- [React Native Background Upload: Complete Guide with Latest Features and Best Practices 2026](https://copyprogramming.com/howto/react-native-background-upload)
- [Supercharge Your App's Image Performance with react-native-fast-image](https://medium.com/@harshitkishor2/supercharge-your-apps-image-performance-with-react-native-fast-image-3e9e1a74c141)
- [ImagePicker - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [How to Persist State with AsyncStorage and MMKV in React Native](https://oneuptime.com/blog/post/2026-01-15-react-native-asyncstorage-mmkv/view)

### Notifications
- [Notifications - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Making Expo Notifications Actually Work (Even on Android 12+ and iOS)](https://medium.com/@gligor99/making-expo-notifications-actually-work-even-on-android-12-and-ios-206ff632a845)
- [Mastering Local Notifications in Expo: A React Native Guide](https://kitemetric.com/blogs/mastering-local-notifications-in-expo-for-react-native-apps)

### User Retention & Onboarding
- [App Push Notification Best Practices for 2026](https://appbot.co/blog/app-push-notifications-2026-best-practices/)
- [Mobile App Onboarding: best practices, guidelines, examples](https://userguiding.com/blog/mobile-app-onboarding)
- [6 most common app onboarding mistakes to avoid](https://decode.agency/article/app-onboarding-mistakes/)
- [100+ User Onboarding Statistics You Need to Know in 2026](https://userguiding.com/blog/user-onboarding-statistics)

### App Store Compliance
- [App stores best practices - Expo Documentation](https://docs.expo.dev/distribution/app-stores/)
- [From Build to App Store: Deploying React Native Apps with EAS in 2026](https://reactnativerelay.com/article/from-build-to-app-store-complete-guide-deploying-react-native-apps-eas-2026)
- [Mobile App Consent for iOS: A Deep Dive (2025)](https://secureprivacy.ai/blog/mobile-app-consent-ios-2025)
- [Legal Frameworks for React Native Development - Navigating App Store Compliance](https://moldstud.com/blog/legal-frameworks-for-react-native-development-navigating-app-store-compliance)

### Algorithms & Data
- [JavaScript Non-Repeating Random Numbers: Complete Guide with Best Practices 2026](https://copyprogramming.com/howto/generating-non-repeating-random-numbers-in-js)
- [Supabase Database configuration](https://supabase.com/docs/guides/database/postgres/configuration)
- [Fix Supabase 'Timestamp Without Timezone' Errors Fast](https://openillumi.com/en/en-supabase-timestamp-without-timezone-insert/)

---

*Pitfalls research for: ArtSpark - Daily Art Inspiration Mobile App*
*Researched: 2026-02-12*
*Confidence: MEDIUM-HIGH (verified with official docs + current web sources)*

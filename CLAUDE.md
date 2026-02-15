# ArtSpark - Project Context

## What is this?
Daily art inspiration app built with Expo/React Native + Supabase. Personalized prompts, progress tracking, and creative challenges for artists of all levels.

## Tech Stack
- Expo SDK 54, React Native 0.81, TypeScript
- Supabase (auth, DB, storage)
- NativeWind (Tailwind for RN)
- Expo Router (file-based routing)

## Key Directories
- `app/` — screens and layouts (Expo Router)
- `app/(auth)/(tabs)/` — main tab screens (Home, Gallery, Challenges, Settings)
- `lib/` — services, hooks, constants
- `components/` — shared UI components

## Web Demo
- Live at https://vincerm17.github.io/artspark/
- Auth and onboarding are bypassed on `Platform.OS === 'web'` (see `app/index.tsx` and `app/(auth)/_layout.tsx`)
- Uses mock prompt generator instead of Supabase when no session
- To redeploy: `npx expo export --platform web --clear && touch dist/.nojekyll && cp dist/index.html dist/404.html && npx gh-pages -d dist --dotfiles`

## Next Steps (as of 2026-02-15)

### When TestFlight is approved:
1. Run `eas build --platform ios --profile preview` to build
2. Submit with `eas submit --platform ios`
3. Remove the web auth bypass in `app/index.tsx` and `app/(auth)/_layout.tsx` (the `Platform.OS === 'web'` checks) if the demo is no longer needed
4. Remove the `isDemo` fallback in `lib/hooks/useDailyPrompt.ts`

### Cleanup:
- The `experiments.baseUrl` in `app.json` is only needed for GitHub Pages — won't affect native builds but can be removed if web demo is retired

## Recent Session Summary (2026-02-15)
- Added Weekends Only frequency + weekly day picker for prompts
- Standardized "Gallery" terminology (was mixed with "Portfolio")
- Fixed reference image relevance for mythological subjects
- Added session-level prompt rotation to prevent repeats
- Added "Saved Prompts" link to home screen
- Deployed web demo to GitHub Pages with auth bypass

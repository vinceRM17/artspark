# Technology Stack

**Project:** ArtSpark - Daily Art Inspiration Mobile App
**Researched:** 2026-02-12
**Confidence:** MEDIUM-HIGH

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Expo | SDK 55+ | Cross-platform mobile framework | New Architecture enabled by default, file-based routing with Expo Router, OTA updates, best-in-class DX for React Native |
| React Native | 0.83.1+ | Native mobile runtime | Ships with Expo SDK 55, New Architecture mandatory (83% adoption on SDK 54), superior performance |
| TypeScript | 5.x | Type-safe JavaScript | Essential for catching bugs at compile time, strict mode recommended from day one |
| Expo Router | Latest | File-based navigation | Built on React Navigation, enables automatic deep linking, type safety, web support, becoming standard for new Expo projects |

**Confidence:** HIGH - Official Expo docs and recent SDK 55 release notes confirm this stack is the 2026 standard.

### Backend & Data
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | Latest (supabase-js v2.95+) | Backend-as-a-Service | Auth, Postgres, Storage in one service; excellent Expo integration; official React Native quickstart guides |
| @supabase/supabase-js | 2.95+ | Supabase client library | Official JavaScript client with React Native fetch polyfills, session persistence, realtime subscriptions |
| Expo SecureStore | Latest | Secure credential storage | Platform-native secure storage for auth tokens; required for Supabase session persistence on mobile |
| react-native-mmkv | Latest | High-performance key-value storage | 30x faster than AsyncStorage for user preferences, prompt history, non-sensitive data |

**Confidence:** HIGH - Supabase official docs show current React Native support; MMKV benchmarks verified across multiple sources.

### UI & Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| NativeWind | v4 | Tailwind CSS for React Native | Compile-time optimization, best performance for styling React Native, v4 uses jsxImportSource transform |
| Tailwind CSS | 3.x | Utility-first CSS framework | Industry standard for rapid UI development, pairs with NativeWind for mobile |
| React Native Reanimated | Latest | Animations | Required by NativeWind v4, provides native-quality animations, runs on UI thread |
| React Native Safe Area Context | Latest | Safe area handling | Required by NativeWind v4, handles notches/home indicators across devices |

**Confidence:** HIGH - NativeWind v4 official docs confirm setup; Expo SDK 54+ includes optimized support.

**Note:** NativeWind v5 is in preview (cleaner setup), but v4 is production-ready for 2026.

### State Management & Forms
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | Latest | Client-side state management | Lightweight (no providers), 40% adoption in 2026, best balance of simplicity and power for shared state |
| React Hook Form | 7.x | Form state management | Minimizes re-renders, excellent performance, standard for React forms |
| Zod | 3.x | Schema validation | TypeScript-first validation, integrates with React Hook Form via @hookform/resolvers/zod |
| TanStack Query (React Query) | 5.x | Server state management | Caching, background updates, optimistic UI for Supabase data fetching |

**Confidence:** MEDIUM-HIGH - Zustand growth verified (30%+ YoY), React Hook Form + Zod pattern confirmed across multiple sources.

**Strategy:** Use Context for environment state (theme, user), Zustand for shared UI state (onboarding progress), TanStack Query for server data (Supabase queries).

### Native Features
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| expo-notifications | Latest | Local push notifications | Daily prompt reminders without backend, Expo Go support for local notifications |
| expo-image-picker | Latest | Camera & gallery access | Official Expo package, handles permissions, works with Supabase Storage uploads |
| expo-sharing | Latest | Native share sheet | System share UI for sharing art responses (iOS/Android), integrates with social apps |
| date-fns | 4.0+ | Date manipulation | v4 includes @date-fns/tz with React Native Hermes support, avoids day.js timezone bugs |

**Confidence:** HIGH - Official Expo docs for native modules; date-fns v4 explicitly supports React Native Hermes.

### Development & Testing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Jest | 30+ | Testing framework | Ships with Expo, improved TS support in v30, React Native standard |
| jest-expo | Latest | Expo Jest preset | Official preset for testing Expo apps, handles Expo SDK mocks |
| @testing-library/react-native | Latest | Component testing | Replaces deprecated react-test-renderer, React 19+ compatible |
| EAS Build | Latest | Cloud build service | Managed credentials, CI/CD integration, internal distribution (TestFlight alternative) |
| EAS Update | Latest | OTA updates | Deploy bug fixes and content updates without app store review |

**Confidence:** HIGH - Official Expo docs confirm EAS as mature 2026 deployment solution.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Navigation | Expo Router | React Navigation 7 | Expo Router is superset of React Navigation with file-based routing, auto deep linking, better web support. React Nav 7 for complex custom nav only. |
| Styling | NativeWind v4 | React Native Paper / gluestack-ui | NativeWind matches web patterns (Tailwind), better for developers familiar with web. UI libraries add bundle size for generic components we don't need. |
| State Management | Zustand | Redux Toolkit / Context only | Redux is overkill for this app scope. Context causes unnecessary re-renders. Zustand hits sweet spot. |
| Date Library | date-fns | day.js | day.js has known timezone bugs on React Native iOS with Hermes. date-fns v4 explicitly supports RN. |
| Storage | MMKV | AsyncStorage | AsyncStorage is 30x slower. MMKV uses JSI (New Architecture), critical for prompt history performance. |
| Backend | Supabase | Firebase / Custom API | Supabase gives Postgres (relational data), better auth, open source. Firebase costs scale unpredictably. Custom API is unnecessary overhead. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Expo SDK 54 or earlier | SDK 55+ drops Legacy Architecture support. New Architecture is mandatory and significantly faster. | Expo SDK 55+ |
| AsyncStorage for frequent reads | Benchmarks show 6,883ms vs MMKV's 40ms for 1,000 operations. Unacceptable for prompt history. | react-native-mmkv |
| day.js | Known timezone parsing bugs on React Native iOS with Hermes. Inconsistent results documented in GitHub issues. | date-fns v4 |
| react-test-renderer | Deprecated, does not support React 19+. | @testing-library/react-native |
| Bare React Native CLI | Expo provides superior DX with EAS, OTA updates, managed workflow. No reason to eject for this app. | Expo managed workflow |
| Moment.js | Deprecated since 2020, large bundle size. | date-fns or day.js (but date-fns for RN) |

## Stack Patterns by Variant

**If building web version later:**
- Use Expo Router (already supports web)
- NativeWind compiles to web-compatible CSS
- Supabase client works on web without changes
- Universal app with single codebase

**If adding AI features later:**
- Supabase Edge Functions for AI API calls
- TanStack Query for streaming AI responses
- Expo's secure storage for API keys

**If scaling to 10K+ users:**
- Supabase scales automatically (Postgres, managed infra)
- MMKV handles large local datasets efficiently
- EAS Update for instant bug fixes without app store

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Expo SDK 55 | React Native 0.83.1, React 19.2.0 | New Architecture only, no legacy support |
| NativeWind v4 | Tailwind CSS 3.x, React Native Reanimated 3+, Safe Area Context 4+ | All peer dependencies required |
| @supabase/supabase-js 2.95+ | Expo SecureStore, AsyncStorage | Requires storage adapter for session persistence |
| TanStack Query 5.x | React 19+ | Major version bump for React 19 compat |
| Jest 30 | TypeScript 5.x, React 19+ | jest-expo preset handles Expo SDK mocks |

## Installation

```bash
# Initialize Expo project (creates with SDK 55 by default)
npx create-expo-app@latest artspark --template blank-typescript

# Core dependencies (Expo manages versions automatically)
npx expo install expo-router react-native-safe-area-context react-native-screens

# Supabase
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-secure-store expo-url-polyfill

# Storage
npm install react-native-mmkv

# UI & Styling
npm install nativewind tailwindcss react-native-reanimated
npx tailwindcss init

# State & Forms
npm install zustand react-hook-form zod @hookform/resolvers/zod @tanstack/react-query

# Native features
npx expo install expo-notifications expo-image-picker expo-sharing

# Date utilities
npm install date-fns @date-fns/tz

# Dev dependencies
npm install -D jest-expo @testing-library/react-native @testing-library/jest-native @types/jest
```

## Configuration Notes

### TypeScript Strict Mode
Enable from day one in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### NativeWind v4 Setup
Requires three config files:
1. `babel.config.js` - Add jsxImportSource: "nativewind" to babel-preset-expo
2. `metro.config.js` - Use withNativeWind(config, { input: './global.css' })
3. `nativewind-env.d.ts` - TypeScript triple-slash directive for types

### Supabase Session Persistence
Use Expo SecureStore on mobile, AsyncStorage on web:
```typescript
const storage = Platform.OS === 'web' ? AsyncStorage : SecureStore
```

## Sources

### Official Documentation (HIGH confidence)
- [Expo SDK 55 Release](https://expo.dev/changelog/sdk-55-beta) - New Architecture mandatory
- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54) - Final legacy architecture support
- [Expo Router Introduction](https://docs.expo.dev/router/introduction/) - File-based routing
- [Supabase Expo React Native Guide](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native) - Official integration
- [Supabase Auth with React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native) - Session storage patterns
- [Expo Using Supabase Guide](https://docs.expo.dev/guides/using-supabase/) - Storage adapter setup
- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/) - Local notifications
- [Expo ImagePicker Docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) - Camera & gallery
- [Expo Sharing Docs](https://docs.expo.dev/versions/latest/sdk/sharing/) - Native share sheet
- [NativeWind v4 Installation](https://www.nativewind.dev/docs/getting-started/installation) - Setup guide
- [EAS Build Introduction](https://docs.expo.dev/build/introduction/) - Cloud builds

### Library-Specific Resources (MEDIUM-HIGH confidence)
- [date-fns v4 Release](https://github.com/date-fns/date-fns) - React Native Hermes support via @date-fns/tz
- [react-native-mmkv GitHub](https://github.com/mrousavy/react-native-mmkv) - Performance benchmarks (30x faster)
- [Zustand GitHub](https://github.com/pmndrs/zustand) - Lightweight state management
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) - Version 2.95+ releases

### Ecosystem Research (MEDIUM confidence, verified across multiple sources)
- [Best React Native UI Libraries 2026](https://blog.logrocket.com/best-react-native-ui-component-libraries/) - LogRocket
- [React Native Best Practices 2026](https://www.esparkinfo.com/blog/react-native-best-practices) - eSpark Info
- [Expo Router vs React Navigation Comparison](https://nativelaunch.dev/articles/compare/expo-router-vs-react-navigation) - NativeLaunch
- [MMKV vs AsyncStorage Performance](https://reactnativeexpert.com/blog/mmkv-vs-asyncstorage-in-react-native/) - React Native Expert
- [State Management 2026 Patterns](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) - Nucamp
- [React Native TypeScript Strict Mode](https://oneuptime.com/blog/post/2026-01-15-react-native-strict-typescript/view) - OneUptime
- [EAS Build 2026 Deployment Guide](https://reactnativerelay.com/article/from-build-to-app-store-complete-guide-deploying-react-native-apps-eas-2026) - React Native Relay

### Benchmarks & Comparisons (MEDIUM confidence)
- [Storage Performance Comparison (French)](https://www.kienso.fr/stockage-sur-mobile-expo-secure-storage-vs-mmkv-vs-asyncstorage/) - Kienso (MMKV: 40ms, AsyncStorage: 6,883ms, SecureStore: 29,183ms for 1,000 ops)
- [Zustand Growth Stats](https://medium.com/@sparklewebhelp/redux-vs-zustand-vs-context-api-in-2026-7f90a2dc3439) - 40% project adoption, 30%+ YoY growth

---
*Stack research for: ArtSpark Daily Art Inspiration Mobile App*
*Researched: 2026-02-12*
*Overall confidence: MEDIUM-HIGH (official docs verified for core stack, ecosystem patterns confirmed across multiple 2026 sources)*

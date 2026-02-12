# Architecture Research

**Domain:** Daily Art Inspiration Mobile App (Expo + Supabase)
**Researched:** 2026-02-12
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Screens │  │  Modal  │  │ Camera  │  │  Share  │        │
│  │ (Routes)│  │  Flows  │  │  Flow   │  │  Sheet  │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│                   FEATURE MODULES LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Onboarding│  │  Prompts │  │ Responses│  │ History  │    │
│  │ (Survey) │  │(Generator)  │ (Upload) │  │  (View)  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │              │             │          │
├───────┴─────────────┴──────────────┴─────────────┴──────────┤
│                    STATE MANAGEMENT LAYER                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Zustand Stores (Client State)             │    │
│  │  • Preferences Store  • Prompt Generator Store      │    │
│  │  • Upload Queue Store • Notification Settings Store │    │
│  └────────────────────────┬────────────────────────────┘    │
│                           │                                 │
│  ┌────────────────────────┴────────────────────────────┐    │
│  │        React Context (Auth Session, Theme)          │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                 │
├───────────────────────────┴──────────────────────────────────┤
│                      SERVICE LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Supabase  │  │AsyncStore│  │  Image   │  │Notifica- │    │
│  │  Client  │  │  (Cache) │  │ Processor│  │  tions   │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │              │             │          │
├───────┴─────────────┴──────────────┴─────────────┴──────────┤
│                    BACKEND SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │Postgres  │  │  Auth    │  │ Storage  │                   │
│  │   DB     │  │ (Magic   │  │ (Images) │                   │
│  │  (RLS)   │  │  Link)   │  │ Buckets  │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Screens (Routes)** | File-based navigation routes via Expo Router | Each file in `app/` directory represents a route |
| **Feature Modules** | Self-contained business logic units | Folders with components, hooks, services per feature |
| **State Management** | Client-side global state + auth session | Zustand for app state, Context for auth/theme |
| **Supabase Client** | Backend communication, auth, storage | Singleton initialized with platform-specific storage |
| **AsyncStorage Cache** | Offline-first local persistence | Key-value store for prompts, preferences, queue |
| **Image Processor** | Photo handling, compression, upload | Expo ImagePicker + ArrayBuffer conversion for Supabase |
| **Notifications** | Daily reminder scheduling | expo-notifications with DailyTriggerInput |

## Recommended Project Structure

```
src/
├── app/                        # Expo Router file-based routing
│   ├── (tabs)/                 # Tab navigation group (parentheses = route group, not in URL)
│   │   ├── _layout.tsx         # Tab navigator definition
│   │   ├── index.tsx           # Today's prompt screen (default tab)
│   │   ├── history.tsx         # Response history tab
│   │   └── settings.tsx        # Settings tab
│   ├── (auth)/                 # Auth flow route group
│   │   ├── _layout.tsx         # Auth layout (no tabs)
│   │   ├── login.tsx           # Magic link / OTP entry
│   │   └── verify.tsx          # OTP verification
│   ├── onboarding/             # Survey flow
│   │   ├── _layout.tsx         # Stepper layout
│   │   ├── step-1.tsx          # Mediums & colors
│   │   ├── step-2.tsx          # Subjects & exclusions
│   │   ├── step-3.tsx          # Notification time
│   │   └── complete.tsx        # Confirmation
│   ├── prompt/
│   │   └── [id].tsx            # Dynamic route: individual prompt detail
│   ├── camera.tsx              # Camera modal (full screen)
│   └── _layout.tsx             # Root layout (auth context, splash screen)
│
├── features/                   # Feature-based modules (all related code grouped)
│   ├── onboarding/
│   │   ├── components/         # Survey question cards, progress stepper
│   │   ├── hooks/              # useOnboardingFlow, useSurveyValidation
│   │   ├── store/              # Zustand store for survey state
│   │   └── types.ts            # PreferenceTypes, SurveyStep
│   ├── prompts/
│   │   ├── components/         # PromptCard, PromptDetail
│   │   ├── hooks/              # usePromptGenerator, useTodayPrompt
│   │   ├── services/           # seedGenerator.ts (date-based PRNG)
│   │   ├── store/              # promptStore.ts (Zustand)
│   │   └── types.ts            # Prompt, PromptOptions
│   ├── responses/
│   │   ├── components/         # ResponseGallery, UploadButton
│   │   ├── hooks/              # useImageUpload, useUploadQueue
│   │   ├── services/           # imageProcessor.ts, uploadService.ts
│   │   ├── store/              # uploadQueueStore.ts (offline queue)
│   │   └── types.ts            # Response, UploadStatus
│   ├── auth/
│   │   ├── components/         # MagicLinkForm, OTPInput
│   │   ├── hooks/              # useAuth, useSession
│   │   ├── context/            # AuthContext.tsx (React Context for session)
│   │   └── types.ts            # User, Session
│   └── notifications/
│       ├── hooks/              # useNotificationScheduler, usePermissions
│       ├── services/           # scheduler.ts (DailyTriggerInput setup)
│       └── types.ts            # NotificationConfig
│
├── components/                 # Shared UI components (not feature-specific)
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── Spinner.tsx
│
├── lib/                        # Shared services & utilities
│   ├── supabase/
│   │   ├── client.ts           # Initialized Supabase client
│   │   ├── storage.ts          # Platform-specific storage adapter
│   │   └── types.ts            # Database types (generated from Supabase CLI)
│   ├── storage/
│   │   ├── asyncCache.ts       # AsyncStorage wrapper with typed keys
│   │   └── secureStore.ts      # Expo SecureStore for auth tokens
│   ├── api/
│   │   ├── queries.ts          # Supabase queries (prompts, responses)
│   │   └── mutations.ts        # Supabase mutations (insert, update)
│   └── utils/
│       ├── date.ts             # Date formatting, timezone handling
│       ├── validation.ts       # Zod schemas for data validation
│       └── logger.ts           # Debug logging (dev-only)
│
├── constants/
│   ├── colors.ts               # Theme colors
│   ├── config.ts               # App config (Supabase URLs from env)
│   └── strings.ts              # UI copy text
│
└── types/                      # Global TypeScript types
    ├── database.ts             # Supabase auto-generated DB types
    ├── navigation.ts           # Expo Router param types
    └── env.d.ts                # Environment variable types
```

### Structure Rationale

- **app/ with file-based routing:** Expo Router automatically generates navigation from file structure. Route groups `(tabs)` and `(auth)` organize screens without polluting URLs.
- **features/ over layers:** Feature-based architecture keeps all code for a domain (components, hooks, services, types) co-located. Scales better than separating by technical layer (all hooks in one folder).
- **Thin routes, thick features:** Route files in `app/` are re-export layers importing screens from `features/`. Keeps routing config separate from business logic.
- **lib/ for cross-cutting:** Services used by multiple features (Supabase client, storage, API) live in `lib/` as shared infrastructure.
- **Zustand stores inside features:** Each feature owns its state. Global stores like `promptStore` live in `features/prompts/store/` not a separate `stores/` folder.

## Architectural Patterns

### Pattern 1: Offline-First with Sync Queue

**What:** Local-first data storage with background sync when online. User interactions succeed immediately against local cache, then sync to Supabase when connected.

**When to use:** Essential for mobile apps where connectivity is unreliable. ArtSpark users should be able to view prompts, upload photos, and queue responses offline.

**Trade-offs:**
- **Pros:** Instant perceived performance, works offline, better UX
- **Cons:** Sync conflicts possible, more complex state management, storage limits

**Implementation:**
```typescript
// features/responses/store/uploadQueueStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedUpload {
  id: string;
  promptId: string;
  imageUri: string;
  createdAt: string;
  status: 'pending' | 'uploading' | 'failed';
  retryCount: number;
}

interface UploadQueueStore {
  queue: QueuedUpload[];
  addToQueue: (upload: Omit<QueuedUpload, 'id' | 'status' | 'retryCount'>) => void;
  processQueue: () => Promise<void>;
  retryFailed: () => void;
}

export const useUploadQueue = create<UploadQueueStore>()(
  persist(
    (set, get) => ({
      queue: [],

      addToQueue: (upload) => {
        const queuedUpload: QueuedUpload = {
          ...upload,
          id: crypto.randomUUID(),
          status: 'pending',
          retryCount: 0,
        };
        set((state) => ({ queue: [...state.queue, queuedUpload] }));

        // Try processing immediately if online
        get().processQueue();
      },

      processQueue: async () => {
        const { isConnected } = await NetInfo.fetch();
        if (!isConnected) return;

        const pending = get().queue.filter(u => u.status === 'pending');

        for (const upload of pending) {
          set((state) => ({
            queue: state.queue.map(u =>
              u.id === upload.id ? { ...u, status: 'uploading' } : u
            ),
          }));

          try {
            await uploadToSupabase(upload);
            // Remove from queue on success
            set((state) => ({
              queue: state.queue.filter(u => u.id !== upload.id),
            }));
          } catch (error) {
            set((state) => ({
              queue: state.queue.map(u =>
                u.id === upload.id
                  ? { ...u, status: 'failed', retryCount: u.retryCount + 1 }
                  : u
              ),
            }));
          }
        }
      },

      retryFailed: () => {
        set((state) => ({
          queue: state.queue.map(u =>
            u.status === 'failed' && u.retryCount < 3
              ? { ...u, status: 'pending' }
              : u
          ),
        }));
        get().processQueue();
      },
    }),
    {
      name: 'upload-queue-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);

// Listen for connectivity changes
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    useUploadQueue.getState().processQueue();
  }
});
```

### Pattern 2: Seed-Based Deterministic Prompt Generation

**What:** Local algorithm that generates daily prompts using date as seed. Same date always produces same prompt, eliminating need for server-side generation and preventing duplicates.

**When to use:** Daily content apps where consistency matters more than true randomness. Ensures all users see the same prompt on a given date without network calls.

**Trade-offs:**
- **Pros:** Works offline, instant results, no API costs, guaranteed uniqueness per date
- **Cons:** Predictable (users could "peek ahead"), algorithm complexity for good distribution

**Implementation:**
```typescript
// features/prompts/services/seedGenerator.ts
import seedrandom from 'seedrandom';

interface PromptOptions {
  mediums: string[];
  colors: string[];
  subjects: string[];
  exclusions: string[];
}

interface GeneratedPrompt {
  dateKey: string; // YYYY-MM-DD format (deduplication key)
  medium: string;
  color: string;
  subject: string;
  text: string; // "Paint a [color] [subject] using [medium]"
  seed: string;
}

export class PromptGenerator {
  private rng: seedrandom.PRNG;

  constructor(dateKey: string) {
    // Date as seed ensures same prompt on same day
    this.rng = seedrandom(dateKey);
  }

  private selectRandom<T>(array: T[]): T {
    return array[Math.floor(this.rng() * array.length)];
  }

  generate(preferences: PromptOptions): GeneratedPrompt {
    const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Filter out exclusions
    const availableSubjects = preferences.subjects.filter(
      s => !preferences.exclusions.includes(s)
    );

    const medium = this.selectRandom(preferences.mediums);
    const color = this.selectRandom(preferences.colors);
    const subject = this.selectRandom(availableSubjects);

    return {
      dateKey,
      medium,
      color,
      subject,
      text: `Paint a ${color} ${subject} using ${medium}`,
      seed: dateKey,
    };
  }

  // Generate future prompts (for preview/testing)
  generateForDate(date: Date, preferences: PromptOptions): GeneratedPrompt {
    const dateKey = date.toISOString().split('T')[0];
    const generator = new PromptGenerator(dateKey);
    return generator.generate(preferences);
  }
}

// Usage in hook
export const useTodayPrompt = () => {
  const preferences = usePreferences();
  const [prompt, setPrompt] = useState<GeneratedPrompt | null>(null);

  useEffect(() => {
    const dateKey = new Date().toISOString().split('T')[0];
    const generator = new PromptGenerator(dateKey);
    const generated = generator.generate(preferences);
    setPrompt(generated);
  }, [preferences]);

  return prompt;
};
```

### Pattern 3: Context for Auth + Zustand for App State

**What:** React Context holds auth session (changes infrequently, needs to be accessed everywhere). Zustand holds feature state (changes frequently, needs granular subscriptions).

**When to use:** Expo + Supabase apps where session management is critical but shouldn't cause unnecessary re-renders.

**Trade-offs:**
- **Pros:** Clear separation of concerns, Context for stable global data, Zustand prevents context re-render hell
- **Cons:** Two state management patterns to learn, need discipline to not mix responsibilities

**Implementation:**
```typescript
// features/auth/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// app/_layout.tsx (root layout)
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
```

### Pattern 4: ArrayBuffer Image Upload to Supabase Storage

**What:** React Native doesn't support Blob/FormData for uploads like web. Convert images to ArrayBuffer before uploading to Supabase Storage buckets.

**When to use:** Any Expo app uploading images to Supabase Storage. Required workaround for React Native platform.

**Trade-offs:**
- **Pros:** Works reliably on iOS/Android, handles binary data correctly
- **Cons:** Extra conversion step, larger memory footprint during conversion

**Implementation:**
```typescript
// features/responses/services/uploadService.ts
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase/client';
import { decode } from 'base64-arraybuffer';

interface UploadResult {
  path: string;
  publicUrl: string;
}

export const uploadImage = async (
  imageUri: string,
  userId: string,
  promptId: string
): Promise<UploadResult> => {
  try {
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer (required for Supabase in React Native)
    const arrayBuffer = decode(base64);

    // Generate unique filename
    const ext = imageUri.split('.').pop();
    const filename = `${userId}/${promptId}/${Date.now()}.${ext}`;

    // Upload to Supabase Storage bucket
    const { data, error } = await supabase.storage
      .from('response-images')
      .upload(filename, arrayBuffer, {
        contentType: `image/${ext}`,
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('response-images')
      .getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

// features/responses/hooks/useImageUpload.ts
import { useMutation } from '@tanstack/react-query';
import { uploadImage } from '../services/uploadService';
import { useAuth } from '@/features/auth/context/AuthContext';

export const useImageUpload = (promptId: string) => {
  const { session } = useAuth();

  return useMutation({
    mutationFn: (imageUri: string) =>
      uploadImage(imageUri, session!.user.id, promptId),
    onError: (error) => {
      // Add to offline queue
      useUploadQueue.getState().addToQueue({
        promptId,
        imageUri,
        createdAt: new Date().toISOString(),
      });
    },
  });
};
```

### Pattern 5: Daily Local Notifications with DailyTriggerInput

**What:** Schedule repeating local notifications at user-specified time each day using expo-notifications. No server required.

**When to use:** Daily reminder apps, habit trackers, journaling apps. ArtSpark uses this for daily prompt reminders.

**Trade-offs:**
- **Pros:** No server costs, works offline, guaranteed delivery, respects user timezone
- **Cons:** Requires device permissions, cleared on Android reboot, can't update notification content remotely

**Implementation:**
```typescript
// features/notifications/services/scheduler.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Set notification handler (how notifications are presented)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const scheduleDaily = async (hour: number, minute: number) => {
  // Request permissions first
  if (!Device.isDevice) {
    console.warn('Notifications only work on physical devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('Notification permission denied');
  }

  // Cancel existing daily notification
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of existing) {
    if (notification.content.data?.type === 'daily-prompt') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // Schedule new daily notification
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Today's Art Prompt",
      body: 'Your daily creative challenge is ready!',
      data: { type: 'daily-prompt' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      repeats: true,
    },
  });

  return notificationId;
};

// features/notifications/hooks/useNotificationScheduler.ts
import { useMutation } from '@tanstack/react-query';
import { scheduleDaily } from '../services/scheduler';

export const useNotificationScheduler = () => {
  return useMutation({
    mutationFn: ({ hour, minute }: { hour: number; minute: number }) =>
      scheduleDaily(hour, minute),
    onSuccess: () => {
      console.log('Daily notification scheduled');
    },
  });
};
```

## Data Flow

### Request Flow: Viewing Today's Prompt

```
User opens app
    ↓
app/(tabs)/index.tsx (Today screen)
    ↓
useTodayPrompt() hook
    ↓
1. Check AsyncStorage cache (instant load)
    ↓
2. Generate local prompt using date seed
    ↓
3. Check Supabase for saved responses (if online)
    ↓
Display prompt + response gallery
```

### Request Flow: Uploading Response

```
User taps camera button
    ↓
expo-image-picker launches camera/gallery
    ↓
User selects 1-3 images
    ↓
features/responses/hooks/useImageUpload
    ↓
1. Validate file size/type
    ↓
2. Add to upload queue (AsyncStorage)
    ↓
3. If online: convert to ArrayBuffer → upload to Supabase Storage
    ↓
4. If offline: queue for later (NetInfo listener retries)
    ↓
5. Create response record in Postgres (links to prompt via date_key)
    ↓
Update UI with optimistic response
```

### State Management Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Zustand Stores                         │
│  (Granular subscriptions, no context re-renders)          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Preferences Store          Prompt Store                 │
│  • mediums                  • todayPrompt                │
│  • colors                   • promptHistory              │
│  • subjects                 • generationConfig           │
│  • exclusions               ↓                            │
│  • notificationTime         ├→ Component subscribes to   │
│                             │  specific slice only       │
│  Upload Queue Store         │                            │
│  • queue[]                  ↓                            │
│  • processQueue()           ✓ Re-renders only when       │
│  • retryFailed()              subscribed data changes    │
│                                                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                   React Context                           │
│  (Stable global data, accessed everywhere)                │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  AuthContext                                             │
│  • session (from Supabase auth state)                    │
│  • loading                                               │
│  • signOut()                                             │
│                                                           │
│  ThemeContext                                            │
│  • colorScheme (light/dark)                              │
│  • setColorScheme()                                      │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Key Data Flows

1. **Onboarding → Preferences Sync:**
   - User completes survey → Zustand preferences store → Persist to AsyncStorage + Supabase profiles table
   - Rationale: Local-first for instant access, sync to Supabase for cross-device + backup

2. **Daily Prompt Generation:**
   - App launches → Check date → Generate prompt using seedrandom(dateKey) → Cache in AsyncStorage
   - Rationale: No network required, deterministic per date, instant display

3. **Photo Upload with Offline Queue:**
   - Select images → Add to upload queue (AsyncStorage) → NetInfo checks connectivity
   - If online: ArrayBuffer conversion → Supabase Storage upload → Postgres response record
   - If offline: Queue persists → Background sync when connected
   - Rationale: Never lose user content, graceful degradation

4. **Notification Scheduling:**
   - User sets time in onboarding → expo-notifications DailyTriggerInput → OS handles delivery
   - Rationale: Native OS scheduling more reliable than background tasks

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Recommended architecture is sufficient. Supabase free tier (500MB database, 1GB storage). Local prompt generation eliminates API costs. AsyncStorage for cache. |
| 1k-10k users | Monitor Supabase Storage quota (user images accumulate). Consider image compression (expo-image-manipulator) to reduce size. Implement pagination for history view (React Query infinite scroll). Enable Supabase RLS policies for security. |
| 10k-100k users | Migrate to Supabase Pro tier ($25/month for 8GB database, 100GB storage). Add CDN (Supabase Storage has built-in CDN). Implement stale-while-revalidate caching for response galleries. Monitor Postgres connection pooling. |
| 100k+ users | Consider edge functions for image optimization (resize on upload). Implement database indexes on frequently queried columns (user_id, date_key). Shard storage buckets by date ranges. Add analytics (PostHog, Amplitude). |

### Scaling Priorities

1. **First bottleneck (10k users):** Supabase Storage quota
   - **Fix:** Compress images on upload using expo-image-manipulator (reduce to max 1MB per image, 80% quality). Saves ~70% storage.
   - **Code:**
     ```typescript
     import * as ImageManipulator from 'expo-image-manipulator';

     const compressImage = async (uri: string) => {
       const result = await ImageManipulator.manipulateAsync(
         uri,
         [{ resize: { width: 1080 } }], // Max width 1080px
         { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
       );
       return result.uri;
     };
     ```

2. **Second bottleneck (50k users):** History view query performance
   - **Fix:** Implement cursor-based pagination with React Query infinite scroll. Add composite index on (user_id, created_at).
   - **SQL:**
     ```sql
     CREATE INDEX idx_responses_user_date ON responses (user_id, created_at DESC);
     ```

3. **Third bottleneck (100k users):** Supabase Postgres connection limits
   - **Fix:** Enable Supabase connection pooling (pgBouncer built-in). Reduce connection timeout in client config.

## Anti-Patterns

### Anti-Pattern 1: Using Expo Managed Workflow with Native Modules

**What people do:** Try to use Expo managed workflow (no native code) but need custom native modules for advanced features.

**Why it's wrong:** Managed workflow doesn't support custom native code. Forces ejection to bare workflow, losing Expo's OTA updates and simplified builds.

**Do this instead:** Use Expo's development builds (EAS Build) from the start. Allows custom native code while keeping Expo SDK benefits. For ArtSpark, expo-notifications, expo-image-picker, and expo-camera all work in managed workflow, so no ejection needed.

### Anti-Pattern 2: Storing Large Data in Zustand

**What people do:** Put entire image galleries, large prompt history arrays, or full user profiles in Zustand state.

**Why it's wrong:** Zustand stores serialize to AsyncStorage on every change. Large objects cause lag, memory issues, and slow app startup.

**Do this instead:** Store only IDs/references in Zustand. Use React Query for server data (automatic caching). For local data, query AsyncStorage directly in components.

```typescript
// BAD: Storing full image data in Zustand
const useResponseStore = create((set) => ({
  responses: [], // Could be hundreds of objects with image data
  addResponse: (response) => set((state) => ({
    responses: [...state.responses, response]
  })),
}));

// GOOD: Store IDs, query details on demand
const useResponseStore = create((set) => ({
  responseIds: [], // Just IDs
  addResponseId: (id) => set((state) => ({
    responseIds: [...state.responseIds, id]
  })),
}));

const useResponseDetails = (id: string) => {
  return useQuery(['response', id], () => fetchResponseFromSupabase(id));
};
```

### Anti-Pattern 3: Not Handling Android Notification Clearing

**What people do:** Schedule daily notifications once during onboarding, assume they'll work forever.

**Why it's wrong:** Android clears all scheduled notifications when device reboots. Users won't get reminders after reboot until they re-open the app.

**Do this instead:** Use expo-task-manager with background fetch to re-schedule notifications after reboot. Alternatively, re-schedule on app foreground as fallback.

```typescript
// features/notifications/services/scheduler.ts
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const BACKGROUND_NOTIFICATION_TASK = 'background-notification-check';

// Re-schedule if needed
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const hasDailyPrompt = scheduled.some(
    n => n.content.data?.type === 'daily-prompt'
  );

  if (!hasDailyPrompt) {
    // Re-schedule daily notification
    const settings = await getNotificationSettings(); // from AsyncStorage
    await scheduleDaily(settings.hour, settings.minute);
  }

  return BackgroundFetch.BackgroundFetchResult.NewData;
});

// Register background task
export const registerBackgroundTask = async () => {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
    minimumInterval: 60 * 60 * 24, // Once per day
    stopOnTerminate: false,
    startOnBoot: true,
  });
};
```

### Anti-Pattern 4: Not Using Row-Level Security (RLS) on Supabase

**What people do:** Create public Supabase storage buckets and database tables, rely on client-side checks for security.

**Why it's wrong:** Anyone can inspect network requests, get Supabase credentials, and directly query database or download all user images. Major security vulnerability.

**Do this instead:** Enable RLS on all tables and storage buckets. Users can only access their own data even if they bypass the app.

```sql
-- Enable RLS on responses table
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Users can only read their own responses
CREATE POLICY "Users can view own responses"
  ON responses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own responses
CREATE POLICY "Users can create own responses"
  ON responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket policy (Supabase dashboard → Storage → Policies)
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'response-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Supabase Auth** | React Context with `onAuthStateChange` listener | Store session in Context, tokens in SecureStore (iOS) / EncryptedSharedPreferences (Android) |
| **Supabase Storage** | ArrayBuffer upload, public URL retrieval | RN requires ArrayBuffer (not Blob). Use `decode('base64-arraybuffer')` library |
| **Supabase Postgres** | Direct queries via JS client with RLS | Auto-generated TypeScript types via `supabase gen types typescript`. Use RLS policies for security |
| **Expo Notifications** | DailyTriggerInput for scheduling | Permission request required. Android clears on reboot (re-schedule in background task) |
| **Expo ImagePicker** | launchCameraAsync / launchImageLibraryAsync | Permissions auto-requested. allowsEditing=true for crop UI |
| **AsyncStorage** | Zustand persist middleware | Key-value store. Limit to <5MB per key. Don't store sensitive data |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Features ↔ Supabase Client** | Import from `lib/supabase/client` | Singleton client initialized with platform storage |
| **Screens ↔ Feature Hooks** | Direct hook calls | Screens import hooks from features (e.g., `useTodayPrompt`) |
| **Upload Queue ↔ NetInfo** | Event listener | NetInfo change triggers processQueue() |
| **Auth Context ↔ Zustand Stores** | Read session from context in stores | Don't duplicate session in Zustand (use context) |
| **Expo Router ↔ Features** | Routes re-export feature screens | Keeps routing thin, logic in features |

## Build Order Implications

Based on component dependencies, recommended phase build order:

### Phase 1: Foundation (Week 1)
**Build:**
- Expo project setup with TypeScript + Expo Router
- Supabase client initialization (lib/supabase/)
- Auth context + magic link flow (features/auth/)
- Root layout with splash screen

**Why first:** Foundation for all other features. Auth required before user-specific data.

**Dependencies:** None

---

### Phase 2: Onboarding (Week 1-2)
**Build:**
- Survey screens (app/onboarding/)
- Preferences store (features/onboarding/store/)
- Save to Supabase profiles table
- Notification permission + scheduling

**Why second:** Collect preferences needed for prompt generation. Sets notification time.

**Dependencies:** Auth (requires user ID for preferences save)

---

### Phase 3: Prompt Generation (Week 2)
**Build:**
- Seed-based generator (features/prompts/services/seedGenerator.ts)
- Today's prompt screen (app/(tabs)/index.tsx)
- AsyncStorage cache for prompts
- Prompt detail view (app/prompt/[id].tsx)

**Why third:** Core value proposition. Needs preferences from Phase 2.

**Dependencies:** Preferences (uses mediums, colors, subjects for generation)

---

### Phase 4: Response Upload (Week 3)
**Build:**
- Image picker integration (expo-image-picker)
- ArrayBuffer upload service (features/responses/services/uploadService.ts)
- Supabase Storage bucket setup
- Upload queue with offline support
- Response gallery component

**Why fourth:** Prompts must exist before users can respond. Upload queue complex but essential for mobile.

**Dependencies:** Prompts (responses link to prompt via date_key), Auth (user_id for storage paths)

---

### Phase 5: History & Detail (Week 3-4)
**Build:**
- History tab with response list (app/(tabs)/history.tsx)
- Pagination with React Query
- Prompt detail with linked responses
- Completion status tracking

**Why fifth:** Requires responses to display. Less critical than core prompt → upload flow.

**Dependencies:** Prompts + Responses (displays both together)

---

### Phase 6: Share & Polish (Week 4)
**Build:**
- Native share sheet integration (expo-sharing)
- Image + text sharing
- Settings tab (notification time, preferences editing)
- Onboarding skip logic (if already completed)

**Why last:** Nice-to-have features. Core app functional without sharing.

**Dependencies:** Responses (shares response images)

---

### Critical Path Dependencies

```
Auth → Preferences → Prompt Generation → Response Upload → History
  ↓         ↓              ↓                    ↓
  └─────────┴──────────────┴────────────────────┴→ Share (parallel)
```

**Parallel tracks:** Notifications can be developed alongside prompt generation (both need preferences but don't depend on each other).

## Sources

### Expo + Supabase Architecture
- [Use Supabase with Expo React Native | Supabase Docs](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)
- [Build a User Management App with Expo React Native | Supabase Docs](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [Using Supabase - Expo Documentation](https://docs.expo.dev/guides/using-supabase/)
- [Use Supabase Auth with React Native | Supabase Docs](https://supabase.com/docs/guides/auth/quickstarts/react-native)

### React Native Architecture Best Practices
- [25 React Native Best Practices for High Performance Apps 2026](https://www.esparkinfo.com/blog/react-native-best-practices)
- [2026 Paradigm Shift: Top 10 Fundamental Developments in React Native Architecture](https://instamobile.io/blog/react-native-paradigm-shift/)
- [From Zero to Production: Building a React Native App in 2026](https://medium.com/@andy.a.g/from-zero-to-production-building-a-react-native-app-in-2026-2a664a967193)

### Expo Router & Project Structure
- [How to organize Expo app folder structure for clarity and scalability](https://expo.dev/blog/expo-app-folder-structure-best-practices)
- [Project Structure | React Native / Expo Starter](https://starter.obytes.com/getting-started/project-structure/)
- [Scalable and Modular React Native Expo Folder Structure 2025](https://medium.com/@md.alishanali/scalable-and-modular-react-native-expo-folder-structure-2025-606abc0bf7d6)
- [Introduction to Expo Router - Expo Documentation](https://docs.expo.dev/router/introduction/)

### State Management Patterns
- [State Management in 2026: Redux, Context API, and Modern Patterns](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns)
- [Zustand and React Context | TkDodo's blog](https://tkdodo.eu/blog/zustand-and-react-context)
- [How to Handle State Management in React Native](https://oneuptime.com/blog/post/2026-02-02-react-native-state-management/view)

### Offline-First Architecture
- [React Native Offline First App Development Guide 2024](https://relevant.software/blog/react-native-offline-first/)
- [Building Offline-First React Native Apps](https://instamobile.io/react-native-tutorials/offline-apps-react-native/)
- [Best Practices of using Offline Storage in React Native Projects](https://medium.com/@tusharkumar27864/best-practices-of-using-offline-storage-asyncstorage-sqlite-in-react-native-projects-dae939e28570)

### Supabase Storage & Image Upload
- [React Native file upload with Supabase Storage](https://supabase.com/blog/react-native-storage)
- [How to Save Images to Supabase Storage from Expo Camera — React Native](https://medium.com/@wsvuefanatic/how-to-save-images-to-supabase-storage-from-expo-camera-react-native-1082fc9444b6)
- [How to integrate Supabase Storage with your React Native Project](https://medium.com/@wsvuefanatic/how-to-integrate-supabase-storage-with-your-react-native-project-2a2966ee712b)

### Notifications
- [Daily Reminder with Push Notifications in React Native (Expo)](https://medium.com/@ftardasti96/daily-reminder-with-push-notifications-in-react-native-expo-e69d0077a4b8)
- [Notifications - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [How To Manage Scheduled Notifications In Expo App](https://medium.com/@kurucaner/how-to-manage-scheduled-notifications-in-expo-app-local-notifications-1c419d8c2a4d)

### Image Picker
- [ImagePicker - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [React Native File & Image Picker with Expo](https://medium.com/@YAGNIK09/react-native-file-image-picker-with-expo-documentpicker-imagepicker-camera-2b3699b3db99)

### Feature-Based Architecture
- [Building Scalable React Applications with Feature-Based Architecture](https://medium.com/@harutyunabgaryann/building-scalable-react-applications-with-feature-based-architecture-41219d5549df)
- [How to Structure Large-Scale React Native Applications for Maintainability](https://oneuptime.com/blog/post/2026-01-15-structure-react-native-applications/view)
- [Feature oriented React Native app structure](https://zubko.io/blog/feature-oriented-rn-app/)

---
*Architecture research for: ArtSpark - Daily Art Inspiration Mobile App*
*Researched: 2026-02-12*

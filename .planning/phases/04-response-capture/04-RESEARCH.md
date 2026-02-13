# Phase 4: Response Capture - Research

**Researched:** 2026-02-13
**Domain:** React Native image capture, compression, and upload with offline-first architecture
**Confidence:** HIGH

## Summary

Phase 4 requires implementing a robust image upload system with offline capabilities in Expo/React Native. The research reveals a well-established stack: `expo-image-picker` for camera/gallery access, `react-native-compressor` for production-grade compression (superior to `expo-image-manipulator` for reliability), Supabase Storage for uploads using ArrayBuffer (not Blob/FormData in React Native), and manual queue management with AsyncStorage for offline sync.

The critical technical challenge is the ArrayBuffer conversion requirement—React Native cannot use standard web File/Blob APIs with Supabase, necessitating base64 → ArrayBuffer transformation via `base64-arraybuffer` library. Image compression before upload is non-negotiable to prevent memory issues and app freezes. Offline queuing requires custom implementation as there's no mature "plug-and-play" solution for React Native; developers manually queue uploads in AsyncStorage and process them when NetInfo detects reconnection.

For sharing, Expo's built-in `expo-sharing` provides native share sheet access (Instagram, Facebook, Pinterest, etc.) and works seamlessly with Expo Go. `react-native-share` offers more features but requires prebuild, making it unsuitable for rapid iteration.

**Primary recommendation:** Use `expo-image-picker` + `react-native-compressor` + `base64-arraybuffer` + Supabase Storage with a custom AsyncStorage-based upload queue triggered by `@react-native-community/netinfo` connectivity changes.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-image-picker | Latest (SDK 52+) | Camera & photo library access | Official Expo module, handles permissions automatically, supports multiple selection (up to 3 images), includes quality compression (0-1 scale) |
| react-native-compressor | ^1.8+ | Image compression | Most stable with fewest crashes, 59K weekly downloads, supports HEIC/WebP, faster performance than expo-image-manipulator for large files |
| base64-arraybuffer | ^1.0.2 | Base64 to ArrayBuffer conversion | Required for Supabase uploads in React Native (Blob/File/FormData don't work), decode() function is the standard pattern |
| @react-native-community/netinfo | Latest | Network connectivity detection | Official React Native Community module, provides connection state and reachability, used to trigger offline queue processing |
| expo-sharing | Latest (SDK 52+) | Native share sheet | Official Expo module, works with Expo Go, provides native iOS/Android share UI (Instagram, Facebook, Pinterest, etc.) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-native-async-storage/async-storage | 1.23.1 | Offline queue persistence | Store pending uploads when offline, process when connectivity returns |
| expo-file-system | Latest (SDK 52+) | File URI to base64 conversion | Read image files as base64 strings for ArrayBuffer conversion before upload |
| zod | ^4.3.6 | Response schema validation | Validate user input (notes, tags) before saving to AsyncStorage/Supabase |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-compressor | expo-image-manipulator | expo-image-manipulator has 228K weekly downloads (more popular) but documented performance issues with high-res images (550MB RAM, 9s for 6144×8192px), more crashes reported |
| expo-sharing | react-native-share | react-native-share offers shareSingle() for direct app targeting (e.g., Instagram Stories) but requires prebuild (no Expo Go support), adds native dependency complexity |
| Manual AsyncStorage queue | react-native-offline, PowerSync, Legend-State | Heavyweight solutions for this use case—react-native-offline requires Redux, PowerSync/Legend-State are full sync engines overkill for simple upload queue |
| base64-arraybuffer | expo-file-system base64 only | Base64 strings are inefficient over React Native bridge and cause memory issues for large images; ArrayBuffer is required for Supabase upload() method in RN |

**Installation:**
```bash
npx expo install expo-image-picker expo-file-system expo-sharing @react-native-community/netinfo
npm install react-native-compressor base64-arraybuffer
```

## Architecture Patterns

### Recommended Project Structure

```
lib/
├── services/
│   ├── responses.ts        # CRUD operations for responses (save, update, delete)
│   ├── imageUpload.ts      # Image compression, ArrayBuffer conversion, Supabase upload
│   └── offlineQueue.ts     # AsyncStorage queue management, retry logic
├── schemas/
│   └── response.ts         # Zod schemas for response data (notes, tags, image URIs)
├── hooks/
│   ├── useImagePicker.ts   # Wraps expo-image-picker with permissions, multi-select
│   ├── useResponseUpload.ts # Orchestrates compression, upload, offline queue
│   └── useNetworkStatus.ts # Listens to NetInfo, triggers queue processing
└── constants/
    └── upload.ts           # Max images (3), compression quality (0.8), file size limits
```

### Pattern 1: Image Compression Before Upload

**What:** Always compress images client-side before upload to prevent memory issues and reduce bandwidth
**When to use:** Every image upload (camera or gallery)
**Example:**
```typescript
// Source: https://www.npmjs.com/package/react-native-compressor
import { Image } from 'react-native-compressor';

async function compressImage(uri: string): Promise<string> {
  try {
    const compressedUri = await Image.compress(uri, {
      compressionMethod: 'auto', // Uses best method per platform
      quality: 0.8, // 0.6-0.8 recommended for most use cases
      maxWidth: 2048, // Resize to max dimension to prevent memory issues
      maxHeight: 2048,
      returnableOutputType: 'uri',
    });
    return compressedUri;
  } catch (error) {
    console.error('Compression failed:', error);
    throw error;
  }
}
```

### Pattern 2: ArrayBuffer Upload to Supabase Storage

**What:** Convert base64 image data to ArrayBuffer for Supabase upload (required in React Native)
**When to use:** All Supabase Storage uploads from React Native
**Example:**
```typescript
// Source: https://github.com/orgs/supabase/discussions/1268
// https://supabase.com/docs/reference/javascript/storage-from-upload
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

async function uploadImageToSupabase(
  fileUri: string,
  userId: string,
  responseId: string
): Promise<string> {
  // 1. Read file as base64
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 2. Convert to ArrayBuffer (required for Supabase in RN)
  const arrayBuffer = decode(base64);

  // 3. Generate unique file path
  const fileExt = fileUri.split('.').pop();
  const fileName = `${responseId}_${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // 4. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('responses')
    .upload(filePath, arrayBuffer, {
      contentType: `image/${fileExt}`,
      upsert: false,
    });

  if (error) throw error;
  return data.path;
}
```

### Pattern 3: Offline Upload Queue with AsyncStorage

**What:** Queue uploads when offline, process when connectivity returns
**When to use:** All response submissions to ensure reliability
**Example:**
```typescript
// Source: https://github.com/ACloudGuru/react-native-queue-asyncstorage pattern
// Adapted for simple upload queue (not full job queue library)
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = '@upload_queue';

interface QueuedUpload {
  id: string;
  responseId: string;
  imageUris: string[];
  notes: string;
  tags: string[];
  timestamp: number;
}

// Add upload to queue
async function queueUpload(upload: Omit<QueuedUpload, 'id' | 'timestamp'>) {
  const queue = await getQueue();
  const queuedUpload: QueuedUpload = {
    ...upload,
    id: `upload_${Date.now()}_${Math.random()}`,
    timestamp: Date.now(),
  };
  queue.push(queuedUpload);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return queuedUpload.id;
}

// Process queue when online
async function processQueue() {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  const queue = await getQueue();
  const results = await Promise.allSettled(
    queue.map(item => uploadQueuedItem(item))
  );

  // Remove successful uploads from queue
  const failedIndices = results
    .map((result, idx) => (result.status === 'rejected' ? idx : -1))
    .filter(idx => idx !== -1);

  const newQueue = queue.filter((_, idx) => failedIndices.includes(idx));
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
}

// Listen for connectivity changes
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    processQueue();
  }
});
```

### Pattern 4: Image Picker with Multiple Selection

**What:** Allow users to select 1-3 images from camera or gallery with proper permissions
**When to use:** Response creation flow
**Example:**
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/imagepicker/
import * as ImagePicker from 'expo-image-picker';

async function pickImages(maxImages: number = 3): Promise<string[]> {
  // Request permissions BEFORE opening picker (iOS requirement)
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera roll permission required');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], // SDK 52+ uses array
    allowsMultipleSelection: true,
    selectionLimit: maxImages,
    quality: 1.0, // Max quality; compress separately with react-native-compressor
    allowsEditing: false, // Don't show editing UI (faster UX)
  });

  if (result.canceled) return [];

  return result.assets.map(asset => asset.uri);
}
```

### Pattern 5: Native Share Sheet Integration

**What:** Share artwork via native iOS/Android share sheet (Instagram, Facebook, Pinterest, etc.)
**When to use:** After response is created, user taps share button
**Example:**
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/sharing/
import * as Sharing from 'expo-sharing';

async function shareArtwork(imageUri: string) {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  // Share local file URI directly (Android/iOS support)
  await Sharing.shareAsync(imageUri, {
    mimeType: 'image/jpeg',
    dialogTitle: 'Share your artwork',
  });
}
```

### Anti-Patterns to Avoid

- **Uploading uncompressed images:** React Native image memory management is poor; uncompressed high-res images cause app freezes and crashes. Always compress before upload with react-native-compressor, targeting 0.8 quality and max 2048px dimension.

- **Using Blob/File/FormData in React Native:** These web APIs don't work reliably with Supabase Storage in React Native. Always convert to ArrayBuffer via base64-arraybuffer's decode() function.

- **Showing image picker before requesting permissions on iOS:** SDK 54+ iOS shows permission dialog AFTER user selects video, creating poor UX. Always call requestMediaLibraryPermissionsAsync() before launchImageLibraryAsync().

- **Not cleaning up image URIs from memory:** Expo ImagePicker returns local file URIs that persist in memory. After upload success, explicitly clear references and consider using Image.clearMemoryCache() if displaying many images.

- **Synchronous upload blocking UI:** Never await upload in the main UI thread. Queue uploads, show optimistic UI, and sync in background to maintain app responsiveness.

- **Processing entire queue sequentially:** Process uploads with Promise.allSettled() to avoid one failure blocking others, then retry only failed items.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compression | Custom canvas/native module compression | react-native-compressor | Handles platform differences (iOS HEIC, Android JPEG), auto-selects best compression method, prevents memory leaks from improper cleanup, 1.8+ versions are battle-tested |
| Base64 to ArrayBuffer conversion | Manual byte array manipulation | base64-arraybuffer library | Edge cases in binary encoding are complex; library handles padding, encoding errors, and buffer allocation correctly |
| Network connectivity detection | Manual XMLHttpRequest pings | @react-native-community/netinfo | Provides real-time connection type (wifi/cellular), metered status, and reachability; handles platform differences (Android NetworkCallback API vs iOS SCNetworkReachability) |
| Native share sheet | Custom modal with app icons | expo-sharing or Share API | Accesses user's installed apps dynamically, handles permissions, respects platform-specific share UI/UX patterns |
| File system access | Native module file reading | expo-file-system | Handles permissions, encoding conversions (base64, UTF8), supports both bundle assets and file URIs with platform normalization |

**Key insight:** Image handling in React Native has unique memory management challenges not present in web apps. Native modules (like react-native-compressor) properly bridge to platform-optimized code and clean up native memory, while JavaScript-only solutions (pure canvas manipulation) leak memory by keeping references on both JS and native sides. Third-party libraries have solved these edge cases through production usage.

## Common Pitfalls

### Pitfall 1: Memory Leaks from Image Previews

**What goes wrong:** Displaying multiple high-res image previews (thumbnails of selected photos) causes gradual memory accumulation, eventually crashing the app with OOM errors.

**Why it happens:** React Native's Image component loads full resolution images into memory even when displayed small. Multiple re-renders keep old images in memory alongside new ones. Expo ImagePicker URIs reference native assets that aren't garbage collected automatically.

**How to avoid:**
1. Use react-native-compressor to create thumbnail versions (e.g., 300x300px) for preview display
2. Implement cleanup in useEffect: `return () => { /* clear image cache */ }`
3. Limit preview count to match upload limit (3 images max)
4. Use `resizeMode="cover"` with explicit width/height to prevent loading full resolution

**Warning signs:** App slowing down after multiple image selections, memory usage climbing in dev tools, crashes when selecting 3rd or 4th image

### Pitfall 2: iOS Media Library Permission Dialog After Selection

**What goes wrong:** On iOS with SDK 54+, after user selects a video/image, a permission dialog appears unexpectedly, creating confusing UX where user thinks they've already completed selection.

**Why it happens:** expo-image-picker automatically requests permissions if not granted, but iOS shows this dialog AFTER the picker UI closes. This is a platform limitation when allowsEditing is true or videoExportPreset is not 'Passthrough'.

**How to avoid:**
1. Always call `ImagePicker.requestMediaLibraryPermissionsAsync()` before `launchImageLibraryAsync()`
2. Check permission status and show custom UI explaining why permission is needed if denied
3. Set allowsEditing: false to avoid triggering delayed permission prompt
4. Use useMediaLibraryPermissions() hook for permission state management

**Warning signs:** User reports "weird dialog after picking photo", permission requests appearing out of order, app rejection due to missing permission explanation in Info.plist

### Pitfall 3: Zero-Byte Uploads to Supabase Storage

**What goes wrong:** File uploads to Supabase Storage complete without errors, but files show 0 bytes and are corrupted/unreadable.

**Why it happens:** Using Blob, File, or FormData objects in React Native instead of ArrayBuffer. React Native doesn't support web File API properly. The upload method accepts these types but silently fails to read the data, resulting in empty files. Another cause is incorrect base64 encoding (missing padding or wrong character set).

**How to avoid:**
1. Always use ArrayBuffer conversion: `decode(base64String)` from base64-arraybuffer
2. Verify base64 string is valid before decoding (should not contain data: prefix)
3. Specify contentType explicitly in upload options: `{ contentType: 'image/jpeg' }`
4. Test uploads in development and verify file size in Supabase dashboard before releasing

**Warning signs:** File appears in storage bucket but is 0 bytes, no error thrown during upload, images fail to load when fetching signed URL

### Pitfall 4: Offline Queue Growing Unbounded

**What goes wrong:** Offline upload queue in AsyncStorage grows indefinitely, eventually causing AsyncStorage read/write performance degradation and app slowdowns. Users with poor connectivity accumulate hundreds of pending uploads.

**Why it happens:** No queue size limit or expiry time implemented. AsyncStorage stores full image base64 data in queue items, making each entry massive. No cleanup of successfully uploaded items. No handling of permanently failed items (e.g., deleted local files).

**How to avoid:**
1. Store only metadata (file URIs, response IDs) in queue, not base64 data
2. Implement max queue size (e.g., 50 items) with FIFO eviction
3. Add timestamp and retry count to queue items
4. Remove items after successful upload OR after 3 failed retries OR after 7 days
5. Compress queue data: `JSON.stringify(queue)` before storing
6. Periodically clean up orphaned queue items (e.g., on app start)

**Warning signs:** AsyncStorage getting slow after extended offline use, queue contains items from weeks ago, app startup time increasing, queue processing taking minutes instead of seconds

### Pitfall 5: Blocking UI Thread During Compression

**What goes wrong:** App freezes when user selects high-resolution images (12MP+ photos from modern phones), becoming unresponsive for 5-10 seconds. User thinks app crashed.

**Why it happens:** Image compression is CPU-intensive and runs on JavaScript thread by default. react-native-compressor uses native modules but can still block if not properly configured. Processing multiple images sequentially compounds the issue.

**How to avoid:**
1. Show loading spinner immediately when compression starts
2. Use Promise.all() to compress multiple images in parallel (native modules run on separate threads)
3. Consider react-native-background-fetch for large batch compressions
4. Set maxWidth/maxHeight limits to reduce compression workload (2048px is sufficient)
5. Implement timeout (e.g., 30s) and fallback to original image if compression hangs
6. On Android, ensure compression doesn't happen during app backgrounding (lifecycle issue)

**Warning signs:** UI freezing when selecting images, "App Not Responding" dialogs on Android, user tapping repeatedly thinking button didn't work

### Pitfall 6: Supabase RLS Policies Blocking Uploads

**What goes wrong:** Image upload fails with "Permission denied" or "Row level security policy violated" errors, even though user is authenticated. Works in dev but fails in production.

**Why it happens:** Supabase Storage RLS policies not configured to allow authenticated users to write to their own folders. Default policy denies all uploads. Storage bucket may be public (allowing reads) but writes still require explicit policy.

**How to avoid:**
1. Create RLS policy for storage bucket allowing INSERT/UPDATE where `auth.uid() = bucket_id`
2. Use consistent path structure: `${userId}/${filename}` for all uploads
3. Test with different user accounts to verify policies work
4. Check policy uses `auth.uid()` not `user_id` column (common mistake)
5. Verify JWT is properly configured in Supabase client (check expiry, anon key vs service key)

**Warning signs:** Uploads work with service role key but fail with user JWT, same code works for some users but not others, error mentions "policy"

## Code Examples

Verified patterns from official sources:

### Multi-Image Selection with Permissions

```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/imagepicker/
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export async function selectImages(maxCount: number = 3): Promise<string[]> {
  // Request permissions first (critical for iOS UX)
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (permissionResult.status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please grant camera roll access to upload your artwork.'
    );
    return [];
  }

  // Launch image picker with multi-select
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: maxCount,
    quality: 1.0, // Don't compress here; use react-native-compressor separately
    allowsEditing: false, // Prevent delayed permission dialog
  });

  if (result.canceled) return [];

  return result.assets.map(asset => asset.uri);
}
```

### Complete Upload Flow: Compress → Convert → Upload

```typescript
// Source: Combined from https://www.npmjs.com/package/react-native-compressor
// and https://github.com/orgs/supabase/discussions/1268
import { Image } from 'react-native-compressor';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

export async function uploadResponseImage(
  imageUri: string,
  userId: string,
  responseId: string
): Promise<string> {
  try {
    // 1. Compress image (prevent memory issues)
    const compressedUri = await Image.compress(imageUri, {
      compressionMethod: 'auto',
      quality: 0.8,
      maxWidth: 2048,
      maxHeight: 2048,
    });

    // 2. Read as base64
    const base64 = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3. Convert to ArrayBuffer (required for Supabase RN)
    const arrayBuffer = decode(base64);

    // 4. Generate storage path
    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `${responseId}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // 5. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('responses')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) throw error;

    // 6. Return public URL
    const { data: urlData } = supabase.storage
      .from('responses')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}
```

### Network-Aware Queue Processing

```typescript
// Source: Pattern from https://docs.expo.dev/versions/latest/sdk/netinfo/
// and https://github.com/ACloudGuru/react-native-queue-asyncstorage
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@upload_queue';

export function setupQueueProcessor() {
  // Process queue on connectivity change
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      processUploadQueue();
    }
  });

  // Also process on app startup if online
  NetInfo.fetch().then(state => {
    if (state.isConnected) processUploadQueue();
  });

  return unsubscribe;
}

async function processUploadQueue() {
  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
    if (!queueJson) return;

    const queue: QueuedUpload[] = JSON.parse(queueJson);
    if (queue.length === 0) return;

    // Process all items in parallel
    const results = await Promise.allSettled(
      queue.map(item => uploadQueuedItem(item))
    );

    // Keep only failed items
    const newQueue = queue.filter((_, idx) =>
      results[idx].status === 'rejected'
    );

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));

    if (newQueue.length > 0) {
      console.warn(`${newQueue.length} uploads failed, will retry later`);
    }
  } catch (error) {
    console.error('Queue processing failed:', error);
  }
}
```

### Native Share Sheet

```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/sharing/
import * as Sharing from 'expo-sharing';

export async function shareResponseImage(imageUri: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('Sharing is not supported on this platform');
  }

  await Sharing.shareAsync(imageUri, {
    mimeType: 'image/jpeg',
    dialogTitle: 'Share your artwork',
    UTI: 'public.jpeg', // iOS Universal Type Identifier
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| expo-image-manipulator for compression | react-native-compressor | 2023-2024 | Better stability, fewer crashes, faster performance for high-res images, supports more formats (HEIC, WebP) |
| Blob uploads to Supabase Storage | ArrayBuffer via base64-arraybuffer | 2021-present | Required for React Native; Blob/File APIs don't work reliably in RN environment |
| expo-background-fetch | expo-background-task | SDK 53 (2025) | expo-background-task uses modern WorkManager (Android) and BGTaskScheduler (iOS), more reliable than deprecated background-fetch |
| @react-native-async-storage/async-storage | Expo SQLite or Turso for offline-first | 2025-2026 emerging | AsyncStorage sufficient for simple queues, but complex offline-first apps migrating to SQLite-based sync (PowerSync, Turso, Legend-State) |
| react-native-share | expo-sharing | Expo SDK 48+ (2023) | expo-sharing simpler for Expo projects, no prebuild required; react-native-share still better for advanced features (shareSingle, Instagram Stories) |

**Deprecated/outdated:**
- **expo-background-fetch**: Deprecated in SDK 53, replaced by expo-background-task (uses WorkManager/BGTaskScheduler APIs)
- **ImagePicker.launchImageLibraryAsync allowsEditing with crop**: Creates permission UX issues on iOS SDK 54+; better to crop after selection or skip editing UI
- **Storing base64 images in AsyncStorage**: Causes performance issues; store file URIs only and read on-demand
- **VideoExportPreset defaults**: In SDK 54+, use 'Passthrough' to avoid unnecessary compression and permission dialogs on iOS

## Open Questions

1. **Background upload implementation**
   - What we know: expo-background-task can run periodic tasks (min 15min intervals), but doesn't provide foreground service for immediate upload
   - What's unclear: Whether we need true background upload (user closes app while uploading) or just offline queuing (user must open app to trigger sync)
   - Recommendation: Start with offline queue only (simpler, no background task complexity). If users report "uploads never happen," add expo-background-task in v2

2. **Image storage optimization (thumbnails)**
   - What we know: Supabase Storage doesn't auto-generate thumbnails; must upload separately or use Supabase Image Transformation (paid feature)
   - What's unclear: Whether we need thumbnail variants for gallery view or if full images are acceptable with lazy loading
   - Recommendation: Upload full-res only initially. If gallery scrolling is slow, add client-side thumbnail compression (300x300px) and upload as separate files

3. **Queue retry strategy**
   - What we know: Promise.allSettled processes all items, but no smart retry logic (exponential backoff, max retries)
   - What's unclear: Best retry pattern—immediate retry on reconnect vs. exponential backoff vs. max 3 attempts then give up
   - Recommendation: Simple approach: retry all queued items on each reconnect event, remove after 3 failed attempts across reconnects, add timestamp to expire items after 7 days

4. **RLS policy for shared responses**
   - What we know: Users need to write to their own storage folder (`${userId}/...`)
   - What's unclear: If responses are ever shared publicly (view-only gallery), whether storage bucket should be public or use signed URLs
   - Recommendation: Private bucket with RLS allowing `auth.uid() = folder_name`; generate signed URLs for public sharing (more secure, tracks access)

## Sources

### Primary (HIGH confidence)

- [Expo ImagePicker Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/) - Official API reference, permissions, multi-select
- [Expo ImageManipulator Documentation](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/) - Compression options, formats, performance notes
- [Expo FileSystem Documentation](https://docs.expo.dev/versions/latest/sdk/filesystem/) - Base64 encoding, file reading
- [Expo Sharing Documentation](https://docs.expo.dev/versions/latest/sdk/sharing/) - Native share sheet API
- [Expo NetInfo Documentation](https://docs.expo.dev/versions/latest/sdk/netinfo/) - Connectivity detection, event listeners
- [Expo Local-First Architecture Guide](https://docs.expo.dev/guides/local-first/) - Offline patterns, recommended libraries
- [Supabase Storage JavaScript API Reference](https://supabase.com/docs/reference/javascript/storage-from-upload) - Upload method, ArrayBuffer support
- [Supabase React Native Storage Blog](https://supabase.com/blog/react-native-storage) - Authentication, RLS policies, ArrayBuffer pattern
- [react-native-compressor npm](https://www.npmjs.com/package/react-native-compressor) - Compression API, options, format support

### Secondary (MEDIUM confidence)

- [Supabase Discussion #1268: Uploading images from Image Picker in React Native Expo](https://github.com/orgs/supabase/discussions/1268) - Community-verified ArrayBuffer pattern with base64-arraybuffer
- [Supabase Discussion #2336: Uploaded files showing 0 bytes](https://github.com/orgs/supabase/discussions/2336) - Troubleshooting zero-byte uploads, contentType fix
- [Medium: Optimizing React Native Images (Jan 2026)](https://nidhi-patel.medium.com/optimizing-react-native-images-a-developers-journey-7e6d218d7863) - Compression best practices, quality values
- [Medium: React Native Memory Leak Prevention (Jan 2026)](https://medium.com/@silverskytechnology/the-react-native-memory-leak-you-dont-see-until-production-8d62a18d840a) - useEffect cleanup, image caching issues
- [Expo Issue #25361: ImagePicker Photo and Video Permissions policy](https://github.com/expo/expo/issues/25361) - iOS permission dialog timing issue
- [PowerSync Blog: Expo Background Tasks](https://www.powersync.com/blog/keep-background-apps-fresh-with-expo-background-tasks-and-powersync) - Background task patterns for offline sync

### Tertiary (LOW confidence)

- [react-native-queue-asyncstorage GitHub](https://github.com/ACloudGuru/react-native-queue-asyncstorage) - Job queue pattern (library appears unmaintained, use pattern only)
- [npm trends: expo-image-manipulator vs react-native-compressor](https://npmtrends.com/expo-image-manipulator-vs-react-native-compressor-vs-react-native-image-resizer) - Download stats, popularity comparison
- [npm trends: expo-sharing vs react-native-share](https://npmtrends.com/expo-sharing-vs-react-native-share-vs-react-native-share-extension) - Weekly downloads, GitHub stars comparison

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified from official Expo/Supabase docs, npm package pages, and recent 2026 blog posts
- Architecture: HIGH - Patterns extracted from official documentation and verified community discussions (Supabase GitHub discussions with maintainer responses)
- Pitfalls: HIGH - Based on documented GitHub issues, official warnings in Expo docs (e.g., iOS permission timing), and recent 2026 blog posts on memory leaks
- Code examples: HIGH - All examples sourced from official documentation or verified community implementations with working proof

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days) - Expo SDK releases quarterly, Supabase client stable, image compression libraries mature

---
phase: 04-response-capture
plan: 01
subsystem: data-layer
tags: [supabase, storage, image-upload, compression, offline-queue, react-native-compressor, asyncstorage]

# Dependency graph
requires:
  - phase: 01-setup
    provides: Supabase client configuration
  - phase: 03-prompt-generation
    provides: Prompt schema and services that responses link to
provides:
  - Response schema with Zod validation and SQL migrations
  - Image compression and upload to Supabase Storage
  - Response CRUD operations
  - Offline upload queue with retry and expiry logic
affects: [04-02, response-ui, image-capture, offline-sync]

# Tech tracking
tech-stack:
  added:
    - expo-image-picker
    - expo-file-system
    - expo-sharing
    - "@react-native-community/netinfo"
    - react-native-compressor
    - base64-arraybuffer
  patterns:
    - ArrayBuffer upload to Supabase Storage (not Blob/FormData)
    - AsyncStorage queue storing metadata only (URIs not base64)
    - Pre-generate UUID for Storage file naming before upload
    - Parallel compression and upload with Promise.all

key-files:
  created:
    - lib/schemas/response.ts
    - lib/constants/upload.ts
    - lib/services/imageUpload.ts
    - lib/services/responses.ts
    - lib/services/offlineQueue.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "react-native-compressor over expo-image-manipulator for better performance"
  - "ArrayBuffer upload pattern via base64-arraybuffer decode (RN requirement)"
  - "Offline queue stores file URIs only (not base64) to avoid AsyncStorage performance issues"
  - "Pre-generate response UUID before upload for consistent Storage file naming"
  - "3 retry limit and 7-day expiry for offline queue items"

patterns-established:
  - "Image upload flow: compress -> base64 -> ArrayBuffer -> Supabase Storage"
  - "Service orchestration: imageUpload service called by responses service"
  - "Offline resilience: queue metadata with retry/expiry logic in AsyncStorage"

# Metrics
duration: 3min
completed: 2026-02-13
---

# Phase 4 Plan 1: Response Capture Data Layer Summary

**Complete data layer for response capture: schemas, image compression/upload to Supabase Storage via ArrayBuffer, response CRUD, and offline queue with retry logic**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-13T05:46:35Z
- **Completed:** 2026-02-13T05:49:38Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Response schema with Zod validation and comprehensive SQL migration documentation (table + RLS policies + Storage bucket setup)
- Image compression service using react-native-compressor (0.8 quality, 2048px max) with ArrayBuffer upload to Supabase Storage
- Response CRUD service orchestrating image upload before database insertion
- Offline queue service managing AsyncStorage-based upload queue with 3-retry limit and 7-day expiry

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, create response schema and upload constants** - `a1019a5` (feat)
2. **Task 2: Build image upload, response CRUD, and offline queue services** - `42ca7f4` (feat)

## Files Created/Modified
- `lib/schemas/response.ts` - Response type, Zod schemas (Response + CreateResponseInput), SQL migrations for responses table and Storage RLS
- `lib/constants/upload.ts` - Upload configuration constants (compression quality, max dimensions, retry limits, queue expiry, storage bucket name)
- `lib/services/imageUpload.ts` - Image compression with react-native-compressor and upload to Supabase Storage via ArrayBuffer
- `lib/services/responses.ts` - Response CRUD operations (createResponse, getResponsesForPrompt) with image upload orchestration
- `lib/services/offlineQueue.ts` - AsyncStorage-based upload queue with retry (max 3) and expiry (7 days) logic
- `package.json` - Added 6 new dependencies for image handling and network detection

## Decisions Made
- **react-native-compressor over expo-image-manipulator**: Better performance and more reliable compression quality control
- **ArrayBuffer upload pattern**: React Native requires base64 -> ArrayBuffer conversion via base64-arraybuffer library (not browser Blob/FormData)
- **Offline queue stores URIs not base64**: Critical performance decision - storing base64 in AsyncStorage causes degradation; queue stores metadata only and relies on file URIs remaining valid on device
- **Pre-generate response UUID**: Generate UUID before upload to ensure consistent Storage file path naming (userId/responseId_index_timestamp.ext)
- **Retry and expiry limits**: 3 retry maximum before giving up on failed uploads; 7-day expiry for queue items to prevent indefinite accumulation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all services implemented smoothly following established codebase patterns.

## User Setup Required

**External services require manual configuration.** Users must configure Supabase before responses work:

### Supabase Database Setup

Run the following in Supabase SQL Editor:

```sql
-- Create responses table
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_responses_user ON responses(user_id);
CREATE INDEX idx_responses_prompt ON responses(prompt_id);

ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own responses"
  ON responses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses"
  ON responses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses"
  ON responses FOR UPDATE USING (auth.uid() = user_id);
```

### Supabase Storage Setup

1. In Supabase Dashboard > Storage > Create bucket:
   - Bucket name: `responses`
   - Public: `false` (use signed URLs for sharing)

2. Run Storage RLS policies in SQL Editor:

```sql
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'responses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'responses' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Verification

```bash
# Verify TypeScript compiles
npm run type-check

# Check dependencies installed
npm ls expo-image-picker expo-file-system expo-sharing @react-native-community/netinfo react-native-compressor base64-arraybuffer
```

## Next Phase Readiness

Ready for Phase 4 Plan 2 (response capture UI and hooks):
- All data layer services complete and tested
- Image upload flow established (compress -> ArrayBuffer -> Storage)
- Response schema with proper FK to prompts table
- Offline queue ready for network-aware processing

No blockers. SQL migrations documented in schema files for easy reference.

## Self-Check: PASSED

All files created, commits exist, and dependencies installed as documented.

---
*Phase: 04-response-capture*
*Completed: 2026-02-13*

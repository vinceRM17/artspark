---
phase: 05-history-tracking
plan: 01
subsystem: data-layer
tags: [history, pagination, caching, hooks]
dependency-graph:
  requires: [onboarding-preferences, daily-prompts, response-capture]
  provides: [prompt-history-data, history-hook, completion-status]
  affects: [history-ui, stats-dashboard]
tech-stack:
  added: [AsyncStorage-caching, signed-urls]
  patterns: [pagination-offset, join-queries, cache-invalidation]
key-files:
  created:
    - lib/hooks/usePromptHistory.ts
  modified:
    - lib/schemas/prompts.ts
    - lib/services/prompts.ts
    - lib/services/responses.ts
decisions:
  - decision: Use JOIN query with responses(count) for completion status
    rationale: Single query more efficient than separate response count queries
    alternatives: Separate query for each prompt's response count
  - decision: Offset-based pagination over cursor-based
    rationale: Simple, predictable, works well with total count for UI progress indicators
    alternatives: Cursor-based (more complex, harder to show total count)
  - decision: 5-minute cache TTL for history
    rationale: Balances freshness with API call reduction - history changes infrequently
    alternatives: Longer TTL (stale data), shorter TTL (more API calls), no cache
  - decision: Store signed URLs with 1-hour expiry
    rationale: Supabase Storage is private, requires signed URLs for image display
    alternatives: Public bucket (security risk), longer expiry (not recommended by Supabase)
metrics:
  duration: 2
  completed: 2026-02-13
  tasks: 2
  files: 4
---

# Phase 5 Plan 01: History Data Layer Summary

Built complete data infrastructure for prompt history with completion status, pagination, and caching.

## One-liner

Prompt history service with JOIN-based completion status, paginated hook with AsyncStorage caching, and signed URL generation for response images.

## What Was Built

### Task 1: Extended Prompts Schema and Services

**Files modified:** `lib/schemas/prompts.ts`, `lib/services/prompts.ts`, `lib/services/responses.ts`

**Schema extension:**
- Added `PromptWithStatus` type extending `Prompt` with `response_count: number` and `is_completed: boolean`
- No Zod schema needed - values computed client-side from JOIN query results

**Service functions:**
1. `getPromptHistory(userId, limit, offset)` - Returns `{ prompts: PromptWithStatus[], total: number }`
   - Single JOIN query: `.select('*, responses:responses(count)', { count: 'exact' })`
   - Filters by userId, orders by created_at DESC (newest first)
   - Pagination via `.range(offset, offset + limit - 1)`
   - Transforms result to compute response_count and is_completed from JOIN data

2. `getPromptById(userId, promptId)` - Returns `Promise<PromptWithStatus | null>`
   - Same JOIN pattern for single prompt lookup
   - Returns null on PGRST116 (not found), throws on other errors
   - Used for detail view refresh

3. `getResponsesForPromptWithImages(userId, promptId)` - Returns `Promise<Response[]>`
   - Fetches responses for a prompt with signed Storage URLs for images
   - Calls `supabase.storage.from('responses').createSignedUrl(url, 3600)` for each image
   - 1-hour expiry on signed URLs (Supabase recommendation)
   - __DEV__ fallback with placeholder image URLs

**Why these functions?**
- History list needs completion status without N+1 queries
- Detail view needs actual image display (requires signed URLs for private storage)
- Single-query JOIN pattern is more efficient than separate response count lookups

### Task 2: Created usePromptHistory Hook

**File created:** `lib/hooks/usePromptHistory.ts`

**Hook interface:**
```typescript
{
  prompts: PromptWithStatus[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
}
```

**Features:**
1. **Pagination:** Offset-based with PAGE_SIZE=20, tracks hasMore state, loadMore function
2. **Caching:** AsyncStorage with 5-min TTL, cache key `@artspark:prompt-history`
3. **Refresh:** Pull-to-refresh support via refresh function (clears cache, resets offset)
4. **Cache invalidation:** Export `invalidateHistoryCache()` for cross-feature use (e.g., after creating response)
5. **Dev mode:** __DEV__ fallback with 3 mock PromptWithStatus items (varying is_completed)

**Implementation pattern:**
- Follows `useDailyPrompt.ts` structure: useState/useEffect, useSession for userId
- On first load (offset 0): check cache, use if fresh (<5min), fetch fresh in background anyway
- On loadMore: append new prompts to existing array, update offset and hasMore
- Uses useCallback for loadMore and refresh to prevent unnecessary re-renders

**Why AsyncStorage cache?**
- History data changes infrequently (only on new prompts or responses)
- Reduces API calls on repeated navigation to history screen
- 5-min TTL balances freshness with performance

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**Upstream dependencies:**
- `lib/services/prompts.ts` (getTodayPrompt, createManualPrompt) - History includes daily and manual prompts
- `lib/services/responses.ts` (createResponse) - Response creation changes completion status
- `components/auth/SessionProvider.tsx` (useSession) - Hook requires userId for queries

**Downstream consumers (Plan 02):**
- History list screen will use `usePromptHistory` hook
- Detail screen will use `getPromptById` and `getResponsesForPromptWithImages`
- Response creation flow should call `invalidateHistoryCache()` after successful upload

**Cross-feature cache invalidation:**
- After creating response: call `invalidateHistoryCache()` to refresh completion status
- After deleting response (future): call `invalidateHistoryCache()`

## Testing Notes

**Manual testing checklist:**
- [ ] getPromptHistory returns prompts with correct is_completed boolean
- [ ] Pagination works with loadMore (hasMore updates correctly)
- [ ] Cache returns data on second load within 5 minutes
- [ ] refresh clears cache and fetches fresh data
- [ ] invalidateHistoryCache clears the cache
- [ ] Signed URLs work for image display (1-hour expiry)
- [ ] __DEV__ mode shows 3 mock prompts without auth

**Edge cases handled:**
- No prompts: returns empty array, hasMore=false
- PGRST116 error in getPromptById: returns null instead of throwing
- Signed URL generation fails: returns original URL (graceful degradation)
- No userId in production: loading stops, no error thrown

## Performance Characteristics

**Query efficiency:**
- Single JOIN query for history list (not N+1 response count queries)
- Pagination limits result set size (20 prompts per page)
- AsyncStorage cache reduces repeated API calls

**Cache strategy:**
- 5-min TTL: assumes history doesn't change frequently during a session
- Cache invalidation on response creation ensures UI stays fresh
- Background fetch on cache hit keeps data current

**Signed URL considerations:**
- 1-hour expiry: images remain viewable during session, but don't persist indefinitely
- Generated on-demand: only for detail view (not list view)
- Batch generation: uses Promise.all for parallel URL signing

## Next Steps (Plan 02)

1. Create history list screen (`app/history/index.tsx`)
   - Use `usePromptHistory` hook
   - Display prompts with completion badges
   - Infinite scroll via loadMore
   - Pull-to-refresh via refresh

2. Create prompt detail screen (`app/history/[id].tsx`)
   - Use `getPromptById` for prompt data
   - Use `getResponsesForPromptWithImages` for images
   - Display all responses with signed image URLs

3. Add history navigation from home screen
   - Link to `/history` route

4. Integrate cache invalidation in response flow
   - Call `invalidateHistoryCache()` after successful response creation

## Self-Check: PASSED

**Files created:**
- [FOUND] lib/hooks/usePromptHistory.ts

**Files modified:**
- [FOUND] lib/schemas/prompts.ts
- [FOUND] lib/services/prompts.ts
- [FOUND] lib/services/responses.ts

**Commits:**
- [FOUND] 8806b31: feat(05-01): extend prompts schema and services with history queries
- [FOUND] e3d90f0: feat(05-01): create usePromptHistory hook with pagination and caching

**Exports verified:**
- [FOUND] PromptWithStatus exported from lib/schemas/prompts.ts
- [FOUND] getPromptHistory, getPromptById exported from lib/services/prompts.ts
- [FOUND] getResponsesForPromptWithImages exported from lib/services/responses.ts
- [FOUND] usePromptHistory, invalidateHistoryCache exported from lib/hooks/usePromptHistory.ts

All artifacts created as specified. TypeScript compilation passes.

# Phase 5: History + Tracking - Research

**Researched:** 2026-02-13
**Domain:** React Native list optimization, pagination, and data presentation
**Confidence:** HIGH

## Summary

Phase 5 implements a browsable history of past prompts with completion status tracking. The core technical challenge is displaying 100+ items efficiently while providing instant interaction feedback and detailed views.

The research confirms that React Native's FlatList, when properly configured, handles large datasets efficiently. The standard approach uses offset-based pagination with Supabase (simpler than cursor-based for finite lists), combined with FlatList's built-in windowing and memo optimization. For completion status, a JOIN query or aggregated count is more performant than client-side filtering. AsyncStorage caching improves perceived performance for history lists that don't change frequently.

The existing codebase already demonstrates strong patterns: clean service layer separation (`lib/services/*`), hook-based data fetching (`lib/hooks/*`), and file-based routing with expo-router. History views extend these patterns naturally.

**Primary recommendation:** Use FlatList with proper memoization, implement offset-based pagination with limit/offset from Supabase, add a response_count computed field or JOIN query for completion status, and follow the existing hook + service pattern for data fetching.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FlatList (React Native) | Built-in | List rendering with virtualization | Official RN list component, handles 1000+ items efficiently with proper config |
| Supabase JS Client | ^2.x | Database queries with RLS, pagination | Already in use, provides `.range()` for offset pagination |
| AsyncStorage | ^1.23.x | Local cache for history data | Official Expo-recommended storage, already used in `useDailyPrompt` |
| expo-router | SDK 54 | File-based navigation with params | Project standard, handles detail view routing cleanly |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React.memo | Built-in | Prevent unnecessary re-renders of list items | Essential for FlatList performance with 100+ items |
| useCallback | Built-in | Memoize renderItem and event handlers | Required to prevent FlatList re-renders |
| RefreshControl | Built-in | Pull-to-refresh UI | Standard mobile pattern for updating lists |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Offset pagination | Cursor-based pagination | Cursor is more efficient for deep pages (1000+), but offset is simpler and sufficient for history lists where users rarely scroll past 50-100 items |
| FlatList | FlashList / react-native-big-list | FlashList offers better default performance but adds dependency; FlatList with proper config handles 100+ items fine |
| JOIN query | Client-side filtering | Client approach requires fetching all responses separately; JOIN/count is single query |

**Installation:**
```bash
# All dependencies already installed in project
# No new packages required
```

## Architecture Patterns

### Recommended Project Structure
```
app/(auth)/
├── index.tsx              # Today's prompt (existing)
├── respond.tsx            # Response creation (existing)
├── history.tsx            # NEW: History list view
└── history/
    └── [id].tsx           # NEW: Prompt detail view

lib/
├── services/
│   ├── prompts.ts         # EXTEND: Add getPromptHistory()
│   └── responses.ts       # EXTEND: Add getResponsesByPromptIds()
├── hooks/
│   └── usePromptHistory.ts  # NEW: History data fetching hook
└── schemas/
    └── prompts.ts         # EXTEND: Add PromptWithStatus type
```

### Pattern 1: List + Detail Navigation
**What:** FlatList of items linking to detail screen via dynamic route
**When to use:** Any master-detail flow (history list → prompt detail)
**Example:**
```typescript
// app/(auth)/history.tsx - List Screen
import { FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function History() {
  const { prompts } = usePromptHistory();

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/history/${item.id}`)}
    >
      <PromptListItem prompt={item} />
    </TouchableOpacity>
  ), []);

  return (
    <FlatList
      data={prompts}
      renderItem={renderItem}
      keyExtractor={item => item.id}
    />
  );
}

// app/(auth)/history/[id].tsx - Detail Screen
import { useLocalSearchParams } from 'expo-router';

export default function PromptDetail() {
  const { id } = useLocalSearchParams();
  // Fetch prompt + responses by id
}
```

### Pattern 2: FlatList Performance Optimization
**What:** Configure FlatList for efficient rendering of 100+ items
**When to use:** Any list that might grow beyond 20-30 items
**Example:**
```typescript
// Source: https://reactnative.dev/docs/optimizing-flatlist-configuration
import React, { memo, useCallback } from 'react';

const PromptListItem = memo(({ prompt }) => {
  // Item UI
}, (prev, next) => prev.prompt.id === next.prompt.id);

export default function HistoryList({ prompts }) {
  const renderItem = useCallback(({ item }) => (
    <PromptListItem prompt={item} />
  ), []);

  return (
    <FlatList
      data={prompts}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      initialNumToRender={15}      // Cover full screen on most devices
      maxToRenderPerBatch={10}     // Render 10 items per batch
      windowSize={5}               // Keep 2.5 screens above/below viewport
      removeClippedSubviews={true} // Detach off-screen items (Android)
      getItemLayout={(data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      })} // If fixed height
    />
  );
}
```

### Pattern 3: Supabase Pagination with Offset
**What:** Use `.range()` for paginated queries with limit/offset
**When to use:** History lists, any finite dataset where users scroll sequentially
**Example:**
```typescript
// lib/services/prompts.ts
export async function getPromptHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ prompts: PromptWithStatus[], total: number }> {
  const { data, error, count } = await supabase
    .from('prompts')
    .select(`
      *,
      response_count:responses(count)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    prompts: data || [],
    total: count || 0
  };
}
```

### Pattern 4: Pull-to-Refresh
**What:** Standard mobile pattern for refreshing list data
**When to use:** Any list that displays server data
**Example:**
```typescript
// Source: https://reactnative.dev/docs/refreshcontrol
import { RefreshControl } from 'react-native';

const [refreshing, setRefreshing] = useState(false);

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await refetchHistory();
  setRefreshing(false);
}, []);

return (
  <FlatList
    data={prompts}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor="#7C9A72" // Match brand color
      />
    }
  />
);
```

### Pattern 5: Completion Status via JOIN
**What:** Fetch prompts with response count in single query
**When to use:** Displaying derived state that depends on related records
**Example:**
```typescript
// Supabase query with aggregation
const { data } = await supabase
  .from('prompts')
  .select(`
    id,
    prompt_text,
    created_at,
    responses:responses(count)
  `)
  .eq('user_id', userId);

// Type for prompt with completion status
export type PromptWithStatus = Prompt & {
  responses: { count: number }[];
  is_completed: boolean; // Computed client-side
};

// Transform response
const promptsWithStatus: PromptWithStatus[] = data.map(p => ({
  ...p,
  is_completed: p.responses[0]?.count > 0
}));
```

### Anti-Patterns to Avoid
- **Anonymous functions in renderItem:** Causes full list re-render on parent state change. Always use `useCallback`.
- **Fetching all prompts without pagination:** Poor performance and memory usage. Always paginate server-side.
- **Client-side JOIN emulation:** Fetching prompts and responses separately then merging. Use Supabase's JOIN syntax.
- **Stale cache without invalidation:** AsyncStorage cache should have TTL or manual invalidation on new response creation.
- **Missing keyExtractor:** Can cause rendering bugs and poor performance. Always provide unique keys.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| List virtualization | Custom scroll + absolute positioning | FlatList with proper config | Complex touch handling, scroll physics, memory management. FlatList handles all edge cases. |
| Pagination logic | Custom offset tracking, "load more" buttons | FlatList `onEndReached` + Supabase `.range()` | Easy to get wrong (duplicate requests, missed pages). FlatList has built-in thresholds. |
| Loading skeletons | Custom shimmer animations | Existing loading patterns or simple ActivityIndicator | Time sink for minimal UX gain. Users accept standard spinners. |
| Pull-to-refresh | Custom gesture + animation | RefreshControl | Platform-specific physics, accessibility, edge cases. |

**Key insight:** React Native list performance is a solved problem with well-documented patterns. The challenge is configuration and memoization, not low-level implementation. Supabase handles pagination server-side efficiently. Focus effort on UX and data modeling, not reinventing list primitives.

## Common Pitfalls

### Pitfall 1: FlatList Re-renders on Every Parent State Change
**What goes wrong:** List stutters or flickers when unrelated state updates (e.g., search input typing)
**Why it happens:** `renderItem` is recreated as new function on every render, breaking memoization
**How to avoid:** Wrap `renderItem` in `useCallback` with proper dependencies, memo-ize list item component
**Warning signs:** Typing in search box causes visible list flicker, performance degrades with more items

### Pitfall 2: Missing ORDER BY in Pagination Queries
**What goes wrong:** Items appear duplicated or missing across pages
**Why it happens:** PostgreSQL returns rows in undefined order without explicit ORDER BY
**How to avoid:** Always include `.order('created_at', { ascending: false })` before `.range()`
**Warning signs:** Same item appears on multiple pages, items missing when scrolling back up

### Pitfall 3: No Cache Invalidation After Response Creation
**What goes wrong:** User creates response, returns to history, sees old "not completed" status
**Why it happens:** AsyncStorage cache not updated when new data created
**How to avoid:** Clear relevant cache keys after mutations, or use TTL-based cache expiry
**Warning signs:** User reports stale data, refreshing fixes issue

### Pitfall 4: Blank Scroll Areas with Low initialNumToRender
**What goes wrong:** White space appears when scrolling quickly
**Why it happens:** `initialNumToRender` too low, items not rendered before viewport reaches them
**How to avoid:** Set `initialNumToRender` to cover full screen height (15-20 items typical), increase `maxToRenderPerBatch`
**Warning signs:** Fast scrolling shows blank areas that fill in after delay

### Pitfall 5: N+1 Query Problem for Completion Status
**What goes wrong:** History screen makes hundreds of requests, slow load time
**Why it happens:** Fetching responses separately for each prompt in a loop
**How to avoid:** Use Supabase JOIN syntax or batch fetch with `.in()` operator
**Warning signs:** Network tab shows 100+ requests, loading takes 5+ seconds

## Code Examples

Verified patterns from official sources:

### FlatList with Pull-to-Refresh and Pagination
```typescript
// Combining multiple patterns
import { FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useState, useCallback, memo } from 'react';

const PromptListItem = memo(({ prompt, onPress }) => (
  <TouchableOpacity onPress={() => onPress(prompt.id)}>
    {/* Item UI */}
  </TouchableOpacity>
));

export default function HistoryScreen() {
  const { prompts, loading, hasMore, loadMore, refresh } = usePromptHistory();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleEndReached = useCallback(() => {
    if (!loading && hasMore) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  const handlePress = useCallback((id: string) => {
    router.push(`/history/${id}`);
  }, []);

  const renderItem = useCallback(({ item }) => (
    <PromptListItem prompt={item} onPress={handlePress} />
  ), [handlePress]);

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator size="large" color="#7C9A72" />;
  };

  return (
    <FlatList
      data={prompts}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      windowSize={5}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#7C9A72"
        />
      }
      ListFooterComponent={renderFooter}
    />
  );
}
```

### Supabase Prompt History Query with Completion Status
```typescript
// lib/services/prompts.ts
import { supabase } from '@/lib/supabase';
import { Prompt } from '@/lib/schemas/prompts';

export type PromptWithStatus = Prompt & {
  response_count: number;
  is_completed: boolean;
};

export async function getPromptHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ prompts: PromptWithStatus[], total: number }> {
  // Single query with JOIN for response count
  const { data, error, count } = await supabase
    .from('prompts')
    .select(`
      *,
      responses:responses(count)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Transform to include is_completed flag
  const prompts: PromptWithStatus[] = (data || []).map(p => ({
    ...p,
    response_count: p.responses?.[0]?.count || 0,
    is_completed: (p.responses?.[0]?.count || 0) > 0,
    responses: undefined, // Remove raw responses object
  }));

  return { prompts, total: count || 0 };
}
```

### Custom Hook with Pagination and Caching
```typescript
// lib/hooks/usePromptHistory.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPromptHistory, PromptWithStatus } from '@/lib/services/prompts';
import { useSession } from '@/components/auth/SessionProvider';

const CACHE_KEY = '@artspark:prompt-history';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 20;

export function usePromptHistory() {
  const [prompts, setPrompts] = useState<PromptWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { session } = useSession();
  const userId = session?.user?.id;

  // Load from cache then fetch fresh data
  const fetchHistory = useCallback(async (fromOffset: number = 0, append: boolean = false) => {
    if (!userId) return;

    try {
      setLoading(true);

      // Check cache only on first load
      if (fromOffset === 0 && !append) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setPrompts(data);
            setLoading(false);
            // Still fetch fresh data in background
          }
        }
      }

      // Fetch from server
      const { prompts: newPrompts, total } = await getPromptHistory(
        userId,
        PAGE_SIZE,
        fromOffset
      );

      if (append) {
        setPrompts(prev => [...prev, ...newPrompts]);
      } else {
        setPrompts(newPrompts);
        // Update cache
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          data: newPrompts,
          timestamp: Date.now(),
        }));
      }

      setHasMore(fromOffset + newPrompts.length < total);
      setOffset(fromOffset + newPrompts.length);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      setLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    fetchHistory(0, false);
  }, [fetchHistory]);

  // Load more (pagination)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchHistory(offset, true);
    }
  }, [loading, hasMore, offset, fetchHistory]);

  // Refresh (pull-to-refresh)
  const refresh = useCallback(async () => {
    await AsyncStorage.removeItem(CACHE_KEY);
    setOffset(0);
    await fetchHistory(0, false);
  }, [fetchHistory]);

  return {
    prompts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
```

### Empty State and Loading States
```typescript
// app/(auth)/history.tsx
import { View, Text, FlatList, ActivityIndicator } from 'react-native';

export default function History() {
  const { prompts, loading, error } = usePromptHistory();

  // Loading state
  if (loading && prompts.length === 0) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center">
        <ActivityIndicator size="large" color="#7C9A72" />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center px-6">
        <Text className="text-gray-600 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-[#7C9A72] rounded-xl py-3 px-6"
          onPress={() => router.replace('/(auth)/history')}
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (prompts.length === 0) {
    return (
      <View className="flex-1 bg-[#FFF8F0] justify-center items-center px-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          No prompts yet
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          Start creating art to build your history
        </Text>
        <TouchableOpacity
          className="bg-[#7C9A72] rounded-xl py-3 px-6"
          onPress={() => router.push('/(auth)')}
        >
          <Text className="text-white font-semibold">Go to Today's Prompt</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Success state with data
  return (
    <FlatList
      data={prompts}
      renderItem={renderItem}
      // ... rest of FlatList props
    />
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ListView | FlatList | 2017 (RN 0.43) | FlatList is virtualized, handles 1000+ items efficiently |
| Manual pagination UI | `onEndReached` prop | Built-in since FlatList | Simpler infinite scroll, no custom logic needed |
| React Navigation | expo-router | 2023 (Expo SDK 49+) | File-based routing, better deep linking, typed routes |
| Component-level cache | TanStack Query | 2020+ | Server state management with auto-refetch, but adds complexity |
| Cursor pagination default | Offset for finite lists | Ongoing debate | Offset simpler, cursor only needed for massive datasets |

**Deprecated/outdated:**
- **ListView**: Deprecated in favor of FlatList (2017)
- **VirtualizedList direct usage**: FlatList wraps this, use FlatList instead
- **Multiple separate queries for related data**: Use Supabase JOIN syntax introduced in postgrest 9.0+ (2021)

## Open Questions

1. **Should we use TanStack Query for history data?**
   - What we know: TanStack Query provides auto-refetch, cache invalidation, and optimistic updates
   - What's unclear: Is the added complexity worth it for this simple use case?
   - Recommendation: Start with custom hook + AsyncStorage (matches existing pattern in `useDailyPrompt`). Migrate to TanStack Query later if cache invalidation becomes complex.

2. **Fixed-height items or dynamic?**
   - What we know: Fixed height enables `getItemLayout` optimization (major perf boost)
   - What's unclear: Will all prompts render at same height, or will long text cause variation?
   - Recommendation: Design for fixed height (2-line title, truncated). If dynamic needed, test performance without `getItemLayout` first.

3. **How many items to paginate at once?**
   - What we know: Smaller pages = faster initial load, larger pages = fewer network requests
   - What's unclear: Typical user history size (10 prompts? 100? 500?)
   - Recommendation: Start with 20 items per page (covers ~2 screens). Adjust based on user data.

4. **Cache invalidation strategy for completion status?**
   - What we know: Status changes when user creates response
   - What's unclear: Should we clear entire cache, update single item, or use TTL?
   - Recommendation: Use TTL (5 minutes) + manual cache clear on response creation in same session. Simplest and handles most cases.

## Sources

### Primary (HIGH confidence)
- [React Native FlatList Optimization Docs](https://reactnative.dev/docs/optimizing-flatlist-configuration) - Official performance configuration guide
- [Expo Router Navigation Docs](https://docs.expo.dev/router/basics/navigation/) - Parameter passing and navigation patterns
- [React Native RefreshControl Docs](https://reactnative.dev/docs/refreshcontrol) - Pull-to-refresh implementation
- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript/range) - Pagination with `.range()`
- [Supabase Computed Fields](https://supabase.github.io/pg_graphql/computed_fields/) - PostgreSQL computed columns and functions

### Secondary (MEDIUM confidence)
- [How to Implement FlatList Optimization for Large Lists (2026)](https://oneuptime.com/blog/post/2026-01-15-react-native-flatlist-optimization/view) - Recent optimization patterns
- [React Native Performance Tips: FlatList Guide](https://rafalnawojczyk.pl/blog/react-native/flatlist-performance) - Advanced pagination patterns
- [Supabase Pagination in React](https://makerkit.dev/blog/tutorials/pagination-supabase-react) - Offset vs cursor comparison
- [TanStack Query React Native Docs](https://tanstack.com/query/latest/docs/framework/react/react-native) - Alternative data fetching approach
- [React Native AsyncStorage Guide](https://mernstackdev.com/react-native-asyncstorage/) - Local caching strategies

### Tertiary (LOW confidence - verify during implementation)
- [GitHub: react-native-testing-library FlatList tests](https://github.com/vanGalilea/react-native-testing/blob/main/apps/rn-cli-app/__tests__/FlatList.test.tsx) - Example test patterns
- [Medium: TanStack Query for React Native](https://medium.com/@andrew.chester/tanstack-query-the-ultimate-data-fetching-solution-for-react-native-developers-ea2af6ca99f2) - Community patterns
- [LogRocket: UI Best Practices for Loading States](https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/) - Empty state patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries currently in use, well-documented official APIs
- Architecture: HIGH - Verified with official React Native and Expo Router docs, matches existing patterns
- Pitfalls: MEDIUM-HIGH - Based on official docs + verified community experiences, some specific to app context

**Research date:** 2026-02-13
**Valid until:** 2026-04-13 (60 days - React Native ecosystem is stable, patterns unlikely to change rapidly)

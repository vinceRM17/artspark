/**
 * useGallery hook
 *
 * Paginated gallery hook with filter support.
 * Follows the usePromptHistory pattern.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGalleryItems, GalleryItem, GalleryFilters } from '@/lib/services/gallery';
import { useSession } from '@/components/auth/SessionProvider';

const CACHE_KEY = '@artspark:gallery';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 20;

// Dev mode mock data
const MOCK_GALLERY: GalleryItem[] = [
  {
    id: 'dev-1',
    image_url: 'https://via.placeholder.com/400x400.png?text=Watercolor+Landscape',
    medium: 'watercolor',
    subject: 'landscapes',
    notes: 'My first landscape attempt',
    tags: ['landscape', 'watercolor'],
    prompt_text: 'Paint a landscape in watercolor',
    prompt_id: 'dev-prompt-1',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'dev-2',
    image_url: 'https://via.placeholder.com/400x400.png?text=Pencil+Botanicals',
    medium: 'pencil',
    subject: 'botanicals',
    notes: 'Quick sketch of flowers',
    tags: ['botanicals', 'sketch'],
    prompt_text: 'Draw botanicals in pencil',
    prompt_id: 'dev-prompt-2',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'dev-3',
    image_url: 'https://via.placeholder.com/400x400.png?text=Ink+Animals',
    medium: 'ink',
    subject: 'animals',
    notes: null,
    tags: ['animals'],
    prompt_text: 'Sketch animals in ink',
    prompt_id: 'dev-prompt-3',
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

export function useGallery(): {
  items: GalleryItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  filters: GalleryFilters;
  setFilters: (filters: GalleryFilters) => void;
  loadMore: () => void;
  refresh: () => Promise<void>;
} {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filters, setFiltersState] = useState<GalleryFilters>({});

  const { session } = useSession();
  const userId = session?.user?.id;

  // Fetch gallery data
  const fetchGallery = useCallback(
    async (pageOffset: number, isRefresh: boolean) => {
      // Dev mode
      if (!userId && __DEV__) {
        const filtered = MOCK_GALLERY.filter(item => {
          if (filters.medium && item.medium !== filters.medium) return false;
          if (filters.subject && item.subject !== filters.subject) return false;
          return true;
        });
        setItems(filtered);
        setHasMore(false);
        setLoading(false);
        return;
      }

      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { items: newItems, total } = await getGalleryItems(
          userId,
          filters,
          PAGE_SIZE,
          pageOffset
        );

        if (isRefresh) {
          setItems(newItems);
        } else {
          setItems(prev => [...prev, ...newItems]);
        }

        setHasMore(pageOffset + PAGE_SIZE < total);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load gallery');
      } finally {
        setLoading(false);
      }
    },
    [userId, filters]
  );

  // Initial load
  useEffect(() => {
    setLoading(true);
    setOffset(0);
    fetchGallery(0, true);
  }, [fetchGallery]);

  // Load more (pagination)
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    fetchGallery(newOffset, false);
  }, [loading, hasMore, offset, fetchGallery]);

  // Refresh
  const refresh = useCallback(async () => {
    setOffset(0);
    setLoading(true);
    await fetchGallery(0, true);
  }, [fetchGallery]);

  // Set filters (resets pagination)
  const setFilters = useCallback((newFilters: GalleryFilters) => {
    setFiltersState(newFilters);
  }, []);

  return { items, loading, error, hasMore, filters, setFilters, loadMore, refresh };
}

/**
 * Invalidate gallery cache
 */
export async function invalidateGalleryCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}

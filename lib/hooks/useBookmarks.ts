/**
 * Hook for prompt bookmarks
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getBookmarks,
  isBookmarked,
  toggleBookmark,
  type BookmarkedPrompt,
} from '@/lib/services/bookmarks';
import type { Prompt } from '@/lib/schemas/prompts';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkedPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getBookmarks();
    setBookmarks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bookmarks, loading, refresh };
}

export function useIsBookmarked(promptId: string | undefined) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!promptId) return;
    isBookmarked(promptId).then(setBookmarked);
  }, [promptId]);

  const toggle = useCallback(async (prompt: Prompt) => {
    const result = await toggleBookmark(prompt);
    setBookmarked(result);
    return result;
  }, []);

  return { bookmarked, toggle };
}

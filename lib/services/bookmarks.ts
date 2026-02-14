/**
 * Bookmark service — save/unsave prompts locally
 *
 * Uses AsyncStorage to persist bookmarked prompt IDs.
 * Stores full prompt data so bookmarks work offline.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Prompt } from '@/lib/schemas/prompts';

const BOOKMARKS_KEY = '@artspark:bookmarks';

export type BookmarkedPrompt = Prompt & {
  bookmarked_at: string;
};

async function loadBookmarks(): Promise<BookmarkedPrompt[]> {
  try {
    const json = await AsyncStorage.getItem(BOOKMARKS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

async function saveBookmarksList(bookmarks: BookmarkedPrompt[]): Promise<void> {
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

export async function addBookmark(prompt: Prompt): Promise<void> {
  const bookmarks = await loadBookmarks();
  if (bookmarks.some(b => b.id === prompt.id)) return;
  bookmarks.unshift({ ...prompt, bookmarked_at: new Date().toISOString() });
  await saveBookmarksList(bookmarks);
}

export async function removeBookmark(promptId: string): Promise<void> {
  const bookmarks = await loadBookmarks();
  const filtered = bookmarks.filter(b => b.id !== promptId);
  await saveBookmarksList(filtered);
}

export async function isBookmarked(promptId: string): Promise<boolean> {
  const bookmarks = await loadBookmarks();
  return bookmarks.some(b => b.id === promptId);
}

export async function getBookmarks(): Promise<BookmarkedPrompt[]> {
  return loadBookmarks();
}

export async function toggleBookmark(prompt: Prompt): Promise<boolean> {
  const bookmarked = await isBookmarked(prompt.id);
  if (bookmarked) {
    await removeBookmark(prompt.id);
    return false;
  } else {
    await addBookmark(prompt);
    return true;
  }
}

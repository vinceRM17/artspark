/**
 * Gallery service
 *
 * Fetches user responses with prompt metadata for the progress gallery.
 * Joins responses with prompts to provide medium/subject context.
 */

import { supabase } from '@/lib/supabase';

export type GalleryItem = {
  id: string;
  image_url: string;
  medium: string;
  subject: string;
  notes: string | null;
  tags: string[];
  prompt_text: string;
  prompt_id: string;
  created_at: string;
};

export type GalleryFilters = {
  medium?: string;
  subject?: string;
};

/**
 * Fetch gallery items for a user with optional filters
 * Returns one entry per image (responses with multiple images produce multiple items)
 */
export async function getGalleryItems(
  userId: string,
  filters: GalleryFilters = {},
  limit: number = 20,
  offset: number = 0
): Promise<{ items: GalleryItem[]; total: number }> {
  let query = supabase
    .from('responses')
    .select('id, image_urls, notes, tags, created_at, prompt_id, prompts!inner(medium, subject, prompt_text)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Apply filters via the joined prompts table
  if (filters.medium) {
    query = query.eq('prompts.medium', filters.medium);
  }
  if (filters.subject) {
    query = query.eq('prompts.subject', filters.subject);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch gallery: ${error.message}`);
  }

  // Collect all image paths for batch signing
  const allImagePaths: string[] = [];
  const rowMeta: { row: any; prompt: any; urlIndex: number }[] = [];

  for (const row of data || []) {
    const prompt = (row as any).prompts;
    const imageUrls: string[] = (row as any).image_urls || [];
    for (let i = 0; i < imageUrls.length; i++) {
      allImagePaths.push(imageUrls[i]);
      rowMeta.push({ row, prompt, urlIndex: i });
    }
  }

  // Batch sign all URLs in a single API call
  let signedUrlMap = new Map<string, string>();
  if (allImagePaths.length > 0) {
    try {
      const { data: signedUrls } = await supabase.storage
        .from('responses')
        .createSignedUrls(allImagePaths, 3600);
      if (signedUrls) {
        for (const entry of signedUrls) {
          if (entry.signedUrl && entry.path) {
            signedUrlMap.set(entry.path, entry.signedUrl);
          }
        }
      }
    } catch {
      // Fall back to original URLs if batch signing fails
    }
  }

  // Build gallery items using signed URLs
  const items: GalleryItem[] = [];
  for (let i = 0; i < allImagePaths.length; i++) {
    const { row, prompt, urlIndex } = rowMeta[i];
    const originalUrl = allImagePaths[i];
    items.push({
      id: `${row.id}-${urlIndex}`,
      image_url: signedUrlMap.get(originalUrl) || originalUrl,
      medium: prompt?.medium || '',
      subject: prompt?.subject || '',
      notes: row.notes,
      tags: row.tags || [],
      prompt_text: prompt?.prompt_text || '',
      prompt_id: row.prompt_id,
      created_at: row.created_at,
    });
  }

  return {
    items,
    total: count || 0,
  };
}

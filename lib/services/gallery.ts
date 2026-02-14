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

  // Flatten: each image_url becomes its own gallery item
  const items: GalleryItem[] = [];
  for (const row of data || []) {
    const prompt = (row as any).prompts;
    const imageUrls: string[] = (row as any).image_urls || [];

    for (const url of imageUrls) {
      // Generate signed URL
      let signedUrl = url;
      try {
        const { data: signedData } = await supabase.storage
          .from('responses')
          .createSignedUrl(url, 3600);
        if (signedData?.signedUrl) {
          signedUrl = signedData.signedUrl;
        }
      } catch {
        // Use original URL if signing fails
      }

      items.push({
        id: `${row.id}-${imageUrls.indexOf(url)}`,
        image_url: signedUrl,
        medium: prompt?.medium || '',
        subject: prompt?.subject || '',
        notes: row.notes,
        tags: row.tags || [],
        prompt_text: prompt?.prompt_text || '',
        prompt_id: row.prompt_id,
        created_at: row.created_at,
      });
    }
  }

  return {
    items,
    total: count || 0,
  };
}

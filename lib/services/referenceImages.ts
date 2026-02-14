/**
 * Reference image service
 *
 * Provides real-world reference photos of prompt subjects for artists.
 * Priority: Pexels (best relevance) -> Unsplash -> Wikimedia Commons (fallback).
 * Deduplicates by both ID and URL to prevent duplicate photos.
 */

const PEXELS_API_KEY = process.env.EXPO_PUBLIC_PEXELS_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

export type ReferenceImage = {
  id: string;
  url: string;
  thumbUrl: string;
  photographer: string;
  alt: string;
};

// Track seen image IDs AND URLs per session to catch duplicates
let seenImageIds = new Set<string>();
let seenImageUrls = new Set<string>();
let currentSubject: string | null = null;

/**
 * Reset seen images when subject changes
 */
function resetIfSubjectChanged(subject: string) {
  if (subject !== currentSubject) {
    seenImageIds = new Set();
    seenImageUrls = new Set();
    currentSubject = subject;
  }
}

/**
 * Check if an image is a duplicate (by ID or URL)
 */
function isDuplicate(id: string, url: string): boolean {
  return seenImageIds.has(id) || seenImageUrls.has(url);
}

/**
 * Mark an image as seen
 */
function markSeen(id: string, url: string) {
  seenImageIds.add(id);
  seenImageUrls.add(url);
}

// Search queries optimized for Pexels (clean, specific terms)
const SUBJECT_QUERIES: Record<string, string[]> = {
  'animals': ['wildlife animal', 'pet portrait', 'bird nature'],
  'landscapes': ['mountain landscape', 'countryside scenery', 'ocean coast'],
  'people-portraits': ['portrait face', 'person candid', 'street portrait'],
  'still-life': ['fruit arrangement', 'flowers vase', 'objects table'],
  'abstract': ['texture macro', 'light abstract', 'water reflection'],
  'urban': ['city street', 'architecture downtown', 'urban night'],
  'botanicals': ['flower closeup', 'garden plant', 'wildflower field'],
  'fantasy': ['foggy forest', 'dramatic clouds', 'ancient ruins'],
  'food': ['fresh food', 'cooking ingredients', 'market produce'],
  'architecture': ['building facade', 'interior design', 'bridge structure'],
  'patterns': ['natural pattern', 'geometric pattern', 'textile fabric'],
  'mythology': ['ancient statue', 'temple ruins', 'classical sculpture'],
};

/**
 * Fetch reference images from Pexels (primary source)
 * Free API with high-quality, relevant photos
 */
async function fetchFromPexels(
  subject: string,
  count: number
): Promise<ReferenceImage[]> {
  if (!PEXELS_API_KEY) return [];

  const queries = SUBJECT_QUERIES[subject] || [subject];
  const query = queries[Math.floor(Math.random() * queries.length)];
  const page = Math.floor(Math.random() * 3) + 1; // Random page for variety

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count + 6}&page=${page}&orientation=landscape`,
    { headers: { Authorization: PEXELS_API_KEY } }
  );

  if (!response.ok) return [];

  const data = await response.json();
  const results: ReferenceImage[] = [];

  for (const photo of data.photos || []) {
    if (results.length >= count) break;

    const id = String(photo.id);
    const url = photo.src.medium || photo.src.original;

    if (isDuplicate(id, url)) continue;

    results.push({
      id,
      url: photo.src.medium,
      thumbUrl: photo.src.small,
      photographer: photo.photographer || 'Pexels',
      alt: photo.alt || query,
    });

    markSeen(id, url);
  }

  return results;
}

/**
 * Fetch reference images from Unsplash (secondary source)
 */
async function fetchFromUnsplash(
  subject: string,
  count: number
): Promise<ReferenceImage[]> {
  if (!UNSPLASH_ACCESS_KEY) return [];

  const queries = SUBJECT_QUERIES[subject] || [subject];
  const query = queries[Math.floor(Math.random() * queries.length)];

  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count + 4}&orientation=landscape&content_filter=high`,
    { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
  );

  if (!response.ok) return [];

  const data = await response.json();
  const results: ReferenceImage[] = [];

  for (const photo of data.results || []) {
    if (results.length >= count) break;

    const url = photo.urls.small;
    if (isDuplicate(photo.id, url)) continue;

    results.push({
      id: photo.id,
      url: photo.urls.small,
      thumbUrl: photo.urls.thumb,
      photographer: photo.user.name,
      alt: photo.alt_description || query,
    });

    markSeen(photo.id, url);
  }

  return results;
}

/**
 * Fetch reference images from Wikimedia Commons (fallback)
 */
async function fetchFromWikimediaCommons(
  subject: string,
  count: number
): Promise<ReferenceImage[]> {
  const queries = SUBJECT_QUERIES[subject] || [subject + ' photograph'];
  const query = queries[Math.floor(Math.random() * queries.length)] + ' photograph';
  const offset = Math.floor(Math.random() * 20);
  const fetchCount = count + seenImageIds.size + 6;

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: String(fetchCount),
    gsroffset: String(offset),
    gsrnamespace: '6',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '400',
    format: 'json',
    origin: '*',
  });

  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`
  );

  if (!response.ok) return [];

  const data = await response.json();
  const pages = data.query?.pages;
  if (!pages) return [];

  const results: ReferenceImage[] = [];

  for (const page of Object.values(pages) as any[]) {
    if (results.length >= count) break;

    const pageId = String(page.pageid);
    const info = page.imageinfo?.[0];
    if (!info) continue;

    if (!info.url || info.width < 200 || info.height < 150) continue;
    if (info.url.endsWith('.svg') || info.url.endsWith('.gif')) continue;

    const imageUrl = info.thumburl || info.url;
    if (isDuplicate(pageId, imageUrl)) continue;

    const artist = info.extmetadata?.Artist?.value
      ?.replace(/<[^>]*>/g, '')
      ?.substring(0, 40) || 'Wikimedia Commons';

    results.push({
      id: pageId,
      url: imageUrl,
      thumbUrl: imageUrl,
      photographer: artist,
      alt: page.title?.replace('File:', '').replace(/\.[^.]+$/, '') || 'Reference photo',
    });

    markSeen(pageId, imageUrl);
  }

  return results;
}

/**
 * Fetch reference photos for a prompt
 * Priority: Pexels -> Unsplash -> Wikimedia Commons
 * Deduplicates across calls within the same subject
 */
export async function fetchReferenceImages(
  subject: string,
  _medium: string,
  count: number = 3
): Promise<ReferenceImage[]> {
  resetIfSubjectChanged(subject);

  // Try Pexels first (best relevance)
  try {
    const results = await fetchFromPexels(subject, count);
    if (results.length > 0) return results;
  } catch {
    // Fall through
  }

  // Try Unsplash second
  if (UNSPLASH_ACCESS_KEY) {
    try {
      const results = await fetchFromUnsplash(subject, count);
      if (results.length > 0) return results;
    } catch {
      // Fall through
    }
  }

  // Fallback to Wikimedia Commons
  try {
    return await fetchFromWikimediaCommons(subject, count);
  } catch {
    return [];
  }
}

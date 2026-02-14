/**
 * Reference image service
 *
 * Provides real-world reference photos of prompt subjects for artists.
 * Uses Wikimedia Commons search API (free, no key needed) to find
 * actual photographs — NOT artwork, but real subjects in natural form.
 * Falls back to Unsplash if configured.
 *
 * Tracks previously shown image IDs per session to avoid repeats.
 */

const UNSPLASH_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

export type ReferenceImage = {
  id: string;
  url: string;
  thumbUrl: string;
  photographer: string;
  alt: string;
};

// Track seen image IDs per session to avoid repeats
let seenImageIds = new Set<string>();
let currentSubject: string | null = null;

/**
 * Reset seen images when subject changes
 */
function resetIfSubjectChanged(subject: string) {
  if (subject !== currentSubject) {
    seenImageIds = new Set();
    currentSubject = subject;
  }
}

// Photo search queries — specific enough for relevant photos, with variants for variety
const SUBJECT_QUERIES: Record<string, string[]> = {
  'animals': ['wildlife animal photography', 'pet portrait photograph', 'bird nature photo'],
  'landscapes': ['mountain landscape photograph', 'countryside nature scenery', 'ocean coast photograph'],
  'people-portraits': ['portrait face photograph', 'candid person photograph', 'street portrait'],
  'still-life': ['fruit arrangement photograph', 'flowers vase photograph', 'objects table photograph'],
  'abstract': ['texture macro photograph', 'light abstract photograph', 'reflection water photograph'],
  'urban': ['city street photograph', 'downtown architecture photograph', 'urban night photograph'],
  'botanicals': ['flower close up photograph', 'garden plant photograph', 'wildflower nature photograph'],
  'fantasy': ['foggy forest photograph', 'dramatic clouds photograph', 'ancient ruins photograph'],
  'food': ['fresh food photograph', 'cooking ingredients photograph', 'market produce photograph'],
  'architecture': ['building facade photograph', 'interior architecture photograph', 'bridge photograph'],
  'patterns': ['natural pattern photograph', 'geometric pattern photograph', 'textile pattern photograph'],
  'mythology': ['ancient statue photograph', 'temple ruins photograph', 'classical sculpture photograph'],
};

/**
 * Fetch real-world reference photos from Wikimedia Commons
 * Free, no API key, returns actual photographs
 */
async function fetchFromWikimediaCommons(
  subject: string,
  count: number
): Promise<ReferenceImage[]> {
  const queries = SUBJECT_QUERIES[subject] || [subject + ' photograph'];
  const query = queries[Math.floor(Math.random() * queries.length)];
  // Random offset for variety
  const offset = Math.floor(Math.random() * 20);

  // Fetch extra to account for filtering out seen images
  const fetchCount = count + seenImageIds.size + 6;

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: String(fetchCount),
    gsroffset: String(offset),
    gsrnamespace: '6', // File namespace only
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

    // Skip previously shown images
    if (seenImageIds.has(pageId)) continue;

    const info = page.imageinfo?.[0];
    if (!info) continue;

    // Skip non-image files and very small images
    if (!info.url || info.width < 200 || info.height < 150) continue;
    // Skip SVGs and icons
    if (info.url.endsWith('.svg') || info.url.endsWith('.gif')) continue;

    const artist = info.extmetadata?.Artist?.value
      ?.replace(/<[^>]*>/g, '') // Strip HTML tags
      ?.substring(0, 40) || 'Wikimedia Commons';

    results.push({
      id: pageId,
      url: info.thumburl || info.url,
      thumbUrl: info.thumburl || info.url,
      photographer: artist,
      alt: page.title?.replace('File:', '').replace(/\.[^.]+$/, '') || 'Reference photo',
    });

    // Mark as seen
    seenImageIds.add(pageId);
  }

  return results;
}

/**
 * Fetch reference images from Unsplash (requires API key)
 */
async function fetchFromUnsplash(
  subject: string,
  count: number
): Promise<ReferenceImage[]> {
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
    if (seenImageIds.has(photo.id)) continue;

    results.push({
      id: photo.id,
      url: photo.urls.small,
      thumbUrl: photo.urls.thumb,
      photographer: photo.user.name,
      alt: photo.alt_description || query,
    });

    seenImageIds.add(photo.id);
  }

  return results;
}

/**
 * Fetch reference photos for a prompt
 * Returns real photographs of the subject matter for artist reference
 * Automatically deduplicates across calls within the same subject
 */
export async function fetchReferenceImages(
  subject: string,
  _medium: string,
  count: number = 3
): Promise<ReferenceImage[]> {
  // Reset tracking if subject changed
  resetIfSubjectChanged(subject);

  // Try Unsplash first if key is available
  if (UNSPLASH_ACCESS_KEY) {
    try {
      const results = await fetchFromUnsplash(subject, count);
      if (results.length > 0) return results;
    } catch {
      // Fall through
    }
  }

  // Use Wikimedia Commons (free, no key, real photographs)
  try {
    return await fetchFromWikimediaCommons(subject, count);
  } catch {
    return [];
  }
}

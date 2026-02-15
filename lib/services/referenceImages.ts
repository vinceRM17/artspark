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

// Fallback search queries when no prompt text is available
const SUBJECT_QUERIES: Record<string, string[]> = {
  'animals': ['wildlife photography nature', 'domestic animal pet photo', 'bird nature close up'],
  'landscapes': ['scenic mountain landscape photo', 'countryside nature scenery', 'ocean coast sunset photo'],
  'people-portraits': ['portrait photography face', 'natural light portrait photo', 'candid people photography'],
  'still-life': ['still life fruit table', 'flowers vase arrangement', 'objects natural light table'],
  'abstract': ['macro texture nature', 'light reflection water', 'colorful abstract close up'],
  'urban': ['city street photography', 'urban architecture downtown', 'city skyline evening'],
  'botanicals': ['flower close up macro', 'botanical garden plant', 'wildflower meadow nature'],
  'fantasy': ['misty forest nature', 'dramatic sky clouds', 'enchanted woodland'],
  'food': ['fresh fruit vegetables', 'artisan food photography', 'farmers market produce'],
  'architecture': ['historic building facade', 'architectural detail', 'bridge structure engineering'],
  'patterns': ['natural pattern close up', 'geometric tile pattern', 'leaf vein texture macro'],
  'mythology': ['classical marble sculpture', 'ancient greek statue', 'renaissance artwork detail'],
};

/**
 * Extract the core subject description from prompt text for image search.
 * Strips action verbs, medium references, tips, twists, and style modifiers
 * to get the specific subject (e.g., "a nautilus shell" from the full prompt).
 */
function extractSearchQuery(promptText: string): string {
  // Take only the first sentence (before twist/tip/color rule)
  let query = promptText.split(/[.!]\s/)[0];

  // Strip leading action verbs + prepositions: "Paint a cat" → "a cat"
  query = query.replace(
    /^(draw|paint|sketch|create|imagine|capture|explore|interpret|reimagine|reinterpret|build|distill|bring|use)\b[^,—]*?\b(using|with|in|to|of)\s+/i,
    ''
  );

  // Remove medium references (e.g., "oil paint", "watercolor", "pencil")
  query = query.replace(
    /\b(oil paint|watercolor|gouache|acrylic|pencil|charcoal|ink|pastel|digital|collage|mixed media|paper art)\b/gi,
    ''
  );

  // Remove trailing instructions after em-dash or "—"
  query = query.replace(/\s*[—–-]\s*.+$/, '');

  // Clean up leftover artifacts
  query = query
    .replace(/\busing\b|\bwith\b|\bin\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,—–-]+|[\s,—–-]+$/g, '')
    .trim();

  return query;
}

// Medium-specific query modifiers for more relevant results
const MEDIUM_MODIFIERS: Record<string, string> = {
  'watercolor': 'soft light',
  'oil': 'rich color',
  'pencil': 'high contrast',
  'charcoal': 'dramatic light shadow',
  'ink': 'high contrast detail',
  'pastel': 'soft pastel tones',
  'digital': 'vivid colorful',
};

/**
 * Fetch reference images from Pexels (primary source)
 * Free API with high-quality, relevant photos
 */
async function fetchFromPexels(
  subject: string,
  medium: string,
  count: number,
  promptText?: string
): Promise<ReferenceImage[]> {
  if (!PEXELS_API_KEY) return [];

  // Use prompt-derived query when available, fall back to generic category queries
  let query: string;
  if (promptText) {
    query = extractSearchQuery(promptText);
  } else {
    const queries = SUBJECT_QUERIES[subject] || [subject + ' photography'];
    query = queries[Math.floor(Math.random() * queries.length)];
  }
  const modifier = MEDIUM_MODIFIERS[medium];
  if (modifier) query += ' ' + modifier;
  const page = Math.floor(Math.random() * 3) + 1;

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
  medium: string,
  count: number,
  promptText?: string
): Promise<ReferenceImage[]> {
  if (!UNSPLASH_ACCESS_KEY) return [];

  let query: string;
  if (promptText) {
    query = extractSearchQuery(promptText);
  } else {
    const queries = SUBJECT_QUERIES[subject] || [subject + ' photography'];
    query = queries[Math.floor(Math.random() * queries.length)];
  }
  const modifier = MEDIUM_MODIFIERS[medium];
  if (modifier) query += ' ' + modifier;

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
  medium: string,
  count: number,
  promptText?: string
): Promise<ReferenceImage[]> {
  let query: string;
  if (promptText) {
    query = extractSearchQuery(promptText) + ' photo';
  } else {
    const queries = SUBJECT_QUERIES[subject] || [subject + ' photography'];
    query = queries[Math.floor(Math.random() * queries.length)] + ' photo';
  }
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
 *
 * @param promptText - The full prompt sentence, used to extract a specific
 *   search query (e.g., "a nautilus shell") instead of generic category terms
 */
export async function fetchReferenceImages(
  subject: string,
  medium: string,
  count: number = 3,
  promptText?: string
): Promise<ReferenceImage[]> {
  resetIfSubjectChanged(subject);

  // Try Pexels first (best relevance)
  try {
    const results = await fetchFromPexels(subject, medium, count, promptText);
    if (results.length > 0) return results;
  } catch {
    // Fall through
  }

  // Try Unsplash second
  if (UNSPLASH_ACCESS_KEY) {
    try {
      const results = await fetchFromUnsplash(subject, medium, count, promptText);
      if (results.length > 0) return results;
    } catch {
      // Fall through
    }
  }

  // Fallback to Wikimedia Commons
  try {
    return await fetchFromWikimediaCommons(subject, medium, count, promptText);
  } catch {
    return [];
  }
}

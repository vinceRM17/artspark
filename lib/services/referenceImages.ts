/**
 * Reference image service
 *
 * Provides real-world reference photos of prompt subjects for artists.
 * Priority: Pexels (best relevance) -> Unsplash -> Wikimedia Commons (fallback).
 * For mythological/fantasy subjects, Wikimedia is tried first (has art/sculpture images).
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
  source: 'pexels' | 'unsplash' | 'wikimedia';
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
 *
 * Templates follow the pattern: "Verb {subject} with/using {medium} ..."
 * Strategy: strip the medium + its preposition first, then strip the verb.
 *
 * "Create a quiet park bench under a streetlamp with oil paint today"
 *   → strip medium: "Create a quiet park bench under a streetlamp"
 *   → strip verb:   "a quiet park bench under a streetlamp"
 */
function extractSearchQuery(promptText: string): string {
  // Take only the first sentence (before twist/tip/color/em-dash clauses)
  let query = promptText.split(/[.!]\s/)[0];
  query = query.replace(/\s*[—–]\s*.+$/, '');

  // 1) Strip medium + its preposition ("with oil paint", "using watercolor", "in pencil")
  query = query.replace(
    /\s+(using|with|in)\s+(oil paint|watercolor|gouache|acrylic|pencil|charcoal|ink|pastel|digital|collage|mixed media|paper art|photography)\b.*/gi,
    ''
  );

  // 2) Strip leading action verb: "Create a park bench" → "a park bench"
  query = query.replace(
    /^(draw|paint|sketch|create|imagine|capture|explore|interpret|reimagine|reinterpret|build|distill|bring|use|photograph|shoot)\s+/i,
    ''
  );

  // 3) Clean up any remaining loose words
  query = query.replace(/\s{2,}/g, ' ').trim();

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
  'photography': 'professional composition',
};

// Keywords for mythological/fantasy/abstract subjects that stock photo sites can't handle.
// Maps to more photo-friendly search terms (sculptures, art, etc.).
const SUBJECT_REWRITES: Record<string, string> = {
  // Mythological figures
  'anubis': 'Anubis Egyptian god statue sculpture',
  'medusa': 'Medusa sculpture statue art',
  'poseidon': 'Poseidon statue sculpture Greek',
  'zeus': 'Zeus statue sculpture Greek',
  'athena': 'Athena statue sculpture Greek',
  'apollo': 'Apollo statue sculpture Greek',
  'hades': 'Hades sculpture statue Greek',
  'thor': 'Thor Norse mythology sculpture',
  'odin': 'Odin Norse mythology sculpture',
  'isis': 'Isis Egyptian goddess statue',
  'ra': 'Ra Egyptian sun god statue',
  'horus': 'Horus Egyptian god statue',
  'minotaur': 'Minotaur sculpture statue art',
  'cerberus': 'Cerberus sculpture statue mythology',
  'cyclops': 'Cyclops sculpture mythology art',
  'centaur': 'centaur sculpture statue mythology',
  'sphinx': 'Sphinx statue sculpture ancient',
  'valkyrie': 'Valkyrie Norse sculpture art',
  'ganesha': 'Ganesha statue sculpture Hindu',
  'shiva': 'Shiva statue sculpture Hindu',
  'buddha': 'Buddha statue sculpture',
  // Fantasy creatures
  'dragon': 'dragon sculpture art statue',
  'unicorn': 'unicorn sculpture art statue',
  'phoenix': 'phoenix sculpture art painting',
  'griffin': 'griffin sculpture art statue',
  'griffon': 'griffon sculpture art statue',
  'gryphon': 'gryphon sculpture art statue',
  'pegasus': 'Pegasus sculpture statue winged horse',
  'kraken': 'kraken sea monster sculpture art',
  'hydra': 'hydra sculpture mythology art',
  'fairy': 'fairy sculpture art statue',
  'mermaid': 'mermaid sculpture art statue',
  'werewolf': 'werewolf sculpture art dark',
  'goblin': 'goblin sculpture art fantasy',
  'troll': 'troll sculpture art fantasy',
  // Abstract concepts (use art-related terms)
  'time': 'time concept art surreal clock',
  'loneliness': 'solitude alone art photography',
  'chaos': 'chaos abstract art dynamic',
  'death': 'memento mori art sculpture',
  'dream': 'surreal dreamlike art painting',
  'eternity': 'infinity eternity art sculpture',
  'fate': 'fate destiny art classical painting',
  'freedom': 'freedom art sculpture wings',
};

/**
 * Check if the extracted query contains a mythological/fantasy/abstract subject
 * and rewrite it to terms that stock photo sites can actually find.
 * Returns { query, isMythological } so callers know whether to prioritize Wikimedia.
 */
function rewriteForPhotoSearch(query: string): { query: string; isMythological: boolean } {
  const lowerQuery = query.toLowerCase();
  for (const [keyword, rewrite] of Object.entries(SUBJECT_REWRITES)) {
    // Match whole word to avoid false positives (e.g. "rather" matching "ra")
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(lowerQuery)) {
      return { query: rewrite, isMythological: true };
    }
  }
  return { query, isMythological: false };
}

/**
 * Check if a Pexels/Unsplash result's alt text is relevant to the search query.
 * Returns true if at least one meaningful word from the query appears in the alt text.
 */
function isRelevantResult(altText: string, searchQuery: string): boolean {
  if (!altText) return false;
  const stopWords = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'with', 'is', 'are', 'was', 'were', 'art', 'photo', 'soft', 'light', 'rich', 'color', 'high', 'contrast', 'dramatic', 'shadow', 'vivid', 'colorful', 'detail', 'pastel', 'tones']);
  const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const altLower = altText.toLowerCase();
  return queryWords.some(word => altLower.includes(word));
}

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

  // Rewrite mythological/fantasy subjects to photo-friendly terms
  const { query: rewrittenQuery } = rewriteForPhotoSearch(query);
  query = rewrittenQuery;

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

    // Filter out irrelevant results by checking alt text against query
    const alt = photo.alt || '';
    if (alt && !isRelevantResult(alt, query)) continue;

    results.push({
      id,
      url: photo.src.medium,
      thumbUrl: photo.src.small,
      photographer: photo.photographer || 'Pexels',
      alt: alt || query,
      source: 'pexels',
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

  // Rewrite mythological/fantasy subjects to photo-friendly terms
  const { query: rewrittenQuery } = rewriteForPhotoSearch(query);
  query = rewrittenQuery;

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

    // Filter out irrelevant results by checking alt text against query
    const alt = photo.alt_description || '';
    if (alt && !isRelevantResult(alt, query)) continue;

    results.push({
      id: photo.id,
      url: photo.urls.small,
      thumbUrl: photo.urls.thumb,
      photographer: photo.user.name,
      alt: alt || query,
      source: 'unsplash',
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
      source: 'wikimedia',
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

  // Check if the prompt contains a mythological/fantasy subject
  const extractedQuery = promptText ? extractSearchQuery(promptText) : subject;
  const { isMythological } = rewriteForPhotoSearch(extractedQuery);

  // For mythological/fantasy subjects, try Wikimedia first (has art/sculpture/historical images)
  if (isMythological) {
    try {
      const results = await fetchFromWikimediaCommons(subject, medium, count, promptText);
      if (results.length > 0) return results;
    } catch {
      // Fall through to stock photo sites
    }
  }

  // Try Pexels (best relevance for normal subjects)
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

  // Fallback to Wikimedia Commons (skip if already tried for mythological)
  if (!isMythological) {
    try {
      return await fetchFromWikimediaCommons(subject, medium, count, promptText);
    } catch {
      return [];
    }
  }

  return [];
}

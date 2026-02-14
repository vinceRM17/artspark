/**
 * Reference image service
 *
 * Provides reference artwork to accompany daily prompts.
 * Uses Art Institute of Chicago's free public API (no key needed)
 * with Elasticsearch queries for highly relevant artwork results.
 * Falls back to Unsplash API if configured.
 */

const UNSPLASH_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

export type ReferenceImage = {
  id: string;
  url: string;
  thumbUrl: string;
  photographer: string;
  alt: string;
};

// Medium keywords the Art Institute API understands
const MEDIUM_KEYWORDS: Record<string, string> = {
  'watercolor': 'watercolor',
  'gouache': 'gouache',
  'acrylic': 'acrylic',
  'oil': 'oil on canvas',
  'pencil': 'graphite pencil drawing',
  'ink': 'ink',
  'digital': 'print',
  'collage': 'collage',
  'paper-art': 'paper',
  'pastel': 'pastel',
  'charcoal': 'charcoal',
  'mixed-media': 'mixed media',
};

// Tight subject keywords — short and specific for better matching
const SUBJECT_KEYWORDS: Record<string, string> = {
  'animals': 'animals',
  'landscapes': 'landscape',
  'people-portraits': 'portrait',
  'still-life': 'still life',
  'abstract': 'abstract',
  'urban': 'city street',
  'botanicals': 'flowers',
  'fantasy': 'fantasy mythological',
  'food': 'fruit food',
  'architecture': 'architecture',
  'patterns': 'pattern ornament',
  'mythology': 'mythology gods',
};

/**
 * Fetch reference images from the Art Institute of Chicago API
 * Uses Elasticsearch body for tighter relevance matching
 */
async function fetchFromArtInstitute(
  subject: string,
  medium: string,
  count: number
): Promise<ReferenceImage[]> {
  const subjectTerm = SUBJECT_KEYWORDS[subject] || subject;
  const mediumTerm = MEDIUM_KEYWORDS[medium] || '';

  // Build an Elasticsearch query focused on subject relevance
  // Medium is intentionally excluded — images should show WHAT to draw, not HOW
  const searchBody: any = {
    fields: ['id', 'title', 'artist_display', 'image_id'],
    limit: count + 4,
    query: {
      bool: {
        must: [
          { term: { is_public_domain: true } },
          {
            bool: {
              should: [
                { match: { subject_titles: { query: subjectTerm, boost: 5 } } },
                { match: { title: { query: subjectTerm, boost: 3 } } },
                { match: { description: { query: subjectTerm, boost: 2 } } },
              ],
              minimum_should_match: 1,
            },
          },
        ],
      },
    },
  };

  const response = await fetch(
    'https://api.artic.edu/api/v1/artworks/search',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(searchBody),
    }
  );

  if (!response.ok) {
    // Fallback to simple text search if POST fails
    return fetchFromArtInstituteSimple(subject, count);
  }

  const data = await response.json();
  const artworks = (data.data || [])
    .filter((art: any) => art.image_id)
    .slice(0, count);

  if (artworks.length === 0) {
    return fetchFromArtInstituteSimple(subject, count);
  }

  return artworks.map((art: any) => ({
    id: String(art.id),
    url: `https://www.artic.edu/iiif/2/${art.image_id}/full/600,/0/default.jpg`,
    thumbUrl: `https://www.artic.edu/iiif/2/${art.image_id}/full/300,/0/default.jpg`,
    photographer: art.artist_display?.split('\n')[0] || 'Unknown Artist',
    alt: art.title || 'Artwork',
  }));
}

/**
 * Simple GET-based fallback search
 */
async function fetchFromArtInstituteSimple(
  subject: string,
  count: number
): Promise<ReferenceImage[]> {
  const query = SUBJECT_KEYWORDS[subject] || subject;

  const response = await fetch(
    `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(query)}&fields=id,title,artist_display,image_id&limit=${count + 2}&query[term][is_public_domain]=true`,
    { headers: { 'Accept': 'application/json' } }
  );

  if (!response.ok) return [];

  const data = await response.json();
  const artworks = (data.data || [])
    .filter((art: any) => art.image_id)
    .slice(0, count);

  return artworks.map((art: any) => ({
    id: String(art.id),
    url: `https://www.artic.edu/iiif/2/${art.image_id}/full/600,/0/default.jpg`,
    thumbUrl: `https://www.artic.edu/iiif/2/${art.image_id}/full/300,/0/default.jpg`,
    photographer: art.artist_display?.split('\n')[0] || 'Unknown Artist',
    alt: art.title || 'Artwork',
  }));
}

/**
 * Fetch reference images from Unsplash (requires API key)
 */
async function fetchFromUnsplash(
  subject: string,
  count: number
): Promise<ReferenceImage[]> {
  const UNSPLASH_QUERIES: Record<string, string> = {
    'animals': 'animals wildlife', 'landscapes': 'landscape nature',
    'people-portraits': 'portrait', 'still-life': 'still life objects',
    'abstract': 'abstract art', 'urban': 'city urban street',
    'botanicals': 'flowers plants', 'fantasy': 'fantasy surreal',
    'food': 'food cuisine', 'architecture': 'architecture building',
    'patterns': 'patterns texture', 'mythology': 'mythology classical sculpture',
  };

  const query = UNSPLASH_QUERIES[subject] || subject;
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&content_filter=high`,
    { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
  );

  if (!response.ok) return [];

  const data = await response.json();
  return (data.results || []).map((photo: any) => ({
    id: photo.id,
    url: photo.urls.small,
    thumbUrl: photo.urls.thumb,
    photographer: photo.user.name,
    alt: photo.alt_description || query,
  }));
}

/**
 * Fetch reference images for a prompt
 * Tries Unsplash first (if key available), then Art Institute of Chicago
 */
export async function fetchReferenceImages(
  subject: string,
  medium: string,
  count: number = 3
): Promise<ReferenceImage[]> {
  // Try Unsplash API first if key is available
  if (UNSPLASH_ACCESS_KEY) {
    try {
      const results = await fetchFromUnsplash(subject, count);
      if (results.length > 0) return results;
    } catch {
      // Fall through
    }
  }

  // Use Art Institute of Chicago (free, no key needed, real artwork)
  try {
    return await fetchFromArtInstitute(subject, medium, count);
  } catch {
    return [];
  }
}

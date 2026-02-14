/**
 * Reference image service
 *
 * Fetches curated reference photos from Unsplash to accompany daily prompts.
 * Uses the Unsplash API to find images matching the prompt's subject and medium.
 *
 * Setup: Add your Unsplash API key to .env.local:
 *   EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your-key-here
 *
 * Get a free key at: https://unsplash.com/developers
 * Free tier: 50 requests/hour (plenty for a daily prompt app)
 */

const UNSPLASH_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API = 'https://api.unsplash.com';

type UnsplashPhoto = {
  id: string;
  urls: {
    small: string;
    regular: string;
    thumb: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  alt_description: string | null;
  links: {
    html: string;
  };
};

export type ReferenceImage = {
  id: string;
  url: string;
  thumbUrl: string;
  photographer: string;
  photographerUrl: string;
  alt: string;
  unsplashUrl: string;
};

// Map prompt subjects to better Unsplash search terms
const SUBJECT_SEARCH_MAP: Record<string, string> = {
  'animals': 'animals wildlife',
  'landscapes': 'landscape nature scenery',
  'people-portraits': 'portrait people',
  'still-life': 'still life objects arrangement',
  'abstract': 'abstract art texture',
  'urban': 'city urban street',
  'botanicals': 'flowers plants botanical',
  'fantasy': 'fantasy dreamy surreal',
  'food': 'food cuisine plating',
  'architecture': 'architecture building',
  'patterns': 'patterns texture design',
  'mythology': 'mythology sculpture classical',
};

// Map mediums to search modifiers
const MEDIUM_SEARCH_MAP: Record<string, string> = {
  'watercolor': 'watercolor painting',
  'gouache': 'gouache painting',
  'acrylic': 'acrylic painting art',
  'oil': 'oil painting fine art',
  'pencil': 'pencil drawing sketch',
  'ink': 'ink drawing illustration',
  'digital': 'digital art',
  'collage': 'collage art mixed',
  'paper-art': 'paper art craft',
  'pastel': 'pastel drawing art',
  'charcoal': 'charcoal drawing',
  'mixed-media': 'mixed media art',
};

/**
 * Fetch reference images for a prompt
 * Returns 2-3 curated photos matching the prompt's subject
 */
export async function fetchReferenceImages(
  subject: string,
  medium: string,
  count: number = 3
): Promise<ReferenceImage[]> {
  if (!UNSPLASH_ACCESS_KEY) {
    return [];
  }

  try {
    // Build search query from subject (primary) + medium context
    const subjectTerms = SUBJECT_SEARCH_MAP[subject] || subject;
    const mediumTerms = MEDIUM_SEARCH_MAP[medium] || medium;
    const query = `${subjectTerms} ${mediumTerms}`;

    const response = await fetch(
      `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.warn('Unsplash API error:', response.status);
      return [];
    }

    const data = await response.json();
    const photos: UnsplashPhoto[] = data.results || [];

    return photos.map((photo) => ({
      id: photo.id,
      url: photo.urls.small,
      thumbUrl: photo.urls.thumb,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      alt: photo.alt_description || `${subjectTerms} reference`,
      unsplashUrl: photo.links.html,
    }));
  } catch (error) {
    console.warn('Failed to fetch reference images:', error);
    return [];
  }
}

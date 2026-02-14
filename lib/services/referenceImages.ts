/**
 * Reference image service
 *
 * Fetches curated reference photos to accompany daily prompts.
 * Uses Unsplash API if key is available, falls back to curated public domain images.
 */

const UNSPLASH_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

export type ReferenceImage = {
  id: string;
  url: string;
  thumbUrl: string;
  photographer: string;
  alt: string;
};

// Curated public domain artwork URLs organized by subject
// These are from Wikimedia Commons and are in the public domain
const CURATED_IMAGES: Record<string, ReferenceImage[]> = {
  'animals': [
    { id: 'a1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/800px-Cat_November_2010-1a.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/320px-Cat_November_2010-1a.jpg', photographer: 'Alvesgaspar', alt: 'Cat portrait' },
    { id: 'a2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Dog_park_in_San_Jose_%2882816983%29.jpeg/800px-Dog_park_in_San_Jose_%2882816983%29.jpeg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Dog_park_in_San_Jose_%2882816983%29.jpeg/320px-Dog_park_in_San_Jose_%2882816983%29.jpeg', photographer: 'Wikimedia', alt: 'Dog in park' },
    { id: 'a3', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2010-kodiak-bear-1.jpg/800px-2010-kodiak-bear-1.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2010-kodiak-bear-1.jpg/320px-2010-kodiak-bear-1.jpg', photographer: 'Yathin S Krishnappa', alt: 'Kodiak bear' },
  ],
  'landscapes': [
    { id: 'l1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Moraine_Lake_17092005.jpg/800px-Moraine_Lake_17092005.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Moraine_Lake_17092005.jpg/320px-Moraine_Lake_17092005.jpg', photographer: 'Gorgo', alt: 'Moraine Lake' },
    { id: 'l2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Tunnel_View%2C_Yosemite_Valley%2C_Yosemite_NP_-_Diliff.jpg/800px-Tunnel_View%2C_Yosemite_Valley%2C_Yosemite_NP_-_Diliff.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Tunnel_View%2C_Yosemite_Valley%2C_Yosemite_NP_-_Diliff.jpg/320px-Tunnel_View%2C_Yosemite_Valley%2C_Yosemite_NP_-_Diliff.jpg', photographer: 'Diliff', alt: 'Yosemite Valley' },
    { id: 'l3', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg/800px-Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg/320px-Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg', photographer: 'Luca Galuzzi', alt: 'Mount Everest' },
  ],
  'people-portraits': [
    { id: 'p1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/320px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg', photographer: 'Leonardo da Vinci', alt: 'Mona Lisa' },
    { id: 'p2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Vermeer_-_Girl_with_a_Pearl_Earring.jpg/800px-Vermeer_-_Girl_with_a_Pearl_Earring.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Vermeer_-_Girl_with_a_Pearl_Earring.jpg/320px-Vermeer_-_Girl_with_a_Pearl_Earring.jpg', photographer: 'Johannes Vermeer', alt: 'Girl with a Pearl Earring' },
    { id: 'p3', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg/800px-A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg/320px-A_Sunday_on_La_Grande_Jatte%2C_Georges_Seurat%2C_1884.jpg', photographer: 'Georges Seurat', alt: 'A Sunday on La Grande Jatte' },
  ],
  'still-life': [
    { id: 's1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat_03.jpg/800px-Cat_03.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Big_Mac_hamburger.jpg/320px-Big_Mac_hamburger.jpg', photographer: 'Wikimedia', alt: 'Still life arrangement' },
    { id: 's2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Item_%28Fruit%29-Banana.jpg/800px-Banana-Item_%28Fruit%29-Banana.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Item_%28Fruit%29-Banana.jpg/320px-Banana-Item_%28Fruit%29-Banana.jpg', photographer: 'Wikimedia', alt: 'Fruit arrangement' },
  ],
  'abstract': [
    { id: 'ab1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Kandinsky_-_Jaune_Rouge_Bleu.jpg/800px-Kandinsky_-_Jaune_Rouge_Bleu.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Kandinsky_-_Jaune_Rouge_Bleu.jpg/320px-Kandinsky_-_Jaune_Rouge_Bleu.jpg', photographer: 'Wassily Kandinsky', alt: 'Yellow Red Blue' },
    { id: 'ab2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/800px-Tsunami_by_hokusai_19th_century.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/320px-Tsunami_by_hokusai_19th_century.jpg', photographer: 'Hokusai', alt: 'The Great Wave' },
    { id: 'ab3', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/800px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/320px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg', photographer: 'Vincent van Gogh', alt: 'Starry Night' },
  ],
  'urban': [
    { id: 'u1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Southwest_corner_of_Central_Park%2C_looking_east%2C_NYC.jpg/800px-Southwest_corner_of_Central_Park%2C_looking_east%2C_NYC.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Southwest_corner_of_Central_Park%2C_looking_east%2C_NYC.jpg/320px-Southwest_corner_of_Central_Park%2C_looking_east%2C_NYC.jpg', photographer: 'Wikimedia', alt: 'New York City' },
    { id: 'u2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/800px-Image_created_with_a_mobile_phone.png', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Image_created_with_a_mobile_phone.png/320px-Image_created_with_a_mobile_phone.png', photographer: 'Wikimedia', alt: 'Urban street scene' },
  ],
  'botanicals': [
    { id: 'b1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Sunflower_from_Silesia2.jpg/800px-Sunflower_from_Silesia2.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Sunflower_from_Silesia2.jpg/320px-Sunflower_from_Silesia2.jpg', photographer: 'Wikimedia', alt: 'Sunflower' },
    { id: 'b2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/800px-GoldenGateBridge-001.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/A_black_image.jpg/320px-A_black_image.jpg', photographer: 'Wikimedia', alt: 'Botanical' },
    { id: 'b3', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Dahlia_x_hybrida.jpg/800px-Dahlia_x_hybrida.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Dahlia_x_hybrida.jpg/320px-Dahlia_x_hybrida.jpg', photographer: 'Wikimedia', alt: 'Dahlia flower' },
  ],
  'fantasy': [
    { id: 'f1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/800px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/320px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg', photographer: 'Vincent van Gogh', alt: 'Starry Night' },
    { id: 'f2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/VanGogh-starry_night_ballance1.jpg/800px-VanGogh-starry_night_ballance1.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/VanGogh-starry_night_ballance1.jpg/320px-VanGogh-starry_night_ballance1.jpg', photographer: 'Van Gogh', alt: 'Starry Night over the Rhone' },
  ],
  'food': [
    { id: 'fo1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/800px-Good_Food_Display_-_NCI_Visuals_Online.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/320px-Good_Food_Display_-_NCI_Visuals_Online.jpg', photographer: 'NCI', alt: 'Food display' },
    { id: 'fo2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Big_Mac_hamburger.jpg/800px-Big_Mac_hamburger.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Big_Mac_hamburger.jpg/320px-Big_Mac_hamburger.jpg', photographer: 'Wikimedia', alt: 'Hamburger' },
  ],
  'architecture': [
    { id: 'ar1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/800px-Empire_State_Building_%28aerial_view%29.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/320px-Empire_State_Building_%28aerial_view%29.jpg', photographer: 'Sam Valadi', alt: 'Empire State Building' },
    { id: 'ar2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sydney_Australia._%2821339175489%29.jpg/800px-Sydney_Australia._%2821339175489%29.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sydney_Australia._%2821339175489%29.jpg/320px-Sydney_Australia._%2821339175489%29.jpg', photographer: 'Wikimedia', alt: 'Sydney Opera House' },
  ],
  'patterns': [
    { id: 'pa1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Alhambra_-_Patio_de_los_Leones.jpg/800px-Alhambra_-_Patio_de_los_Leones.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Alhambra_-_Patio_de_los_Leones.jpg/320px-Alhambra_-_Patio_de_los_Leones.jpg', photographer: 'Wikimedia', alt: 'Alhambra patterns' },
    { id: 'pa2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Kandinsky_-_Jaune_Rouge_Bleu.jpg/800px-Kandinsky_-_Jaune_Rouge_Bleu.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Kandinsky_-_Jaune_Rouge_Bleu.jpg/320px-Kandinsky_-_Jaune_Rouge_Bleu.jpg', photographer: 'Kandinsky', alt: 'Abstract pattern' },
  ],
  'mythology': [
    { id: 'm1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg/800px-Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg/320px-Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg', photographer: 'Sandro Botticelli', alt: 'Birth of Venus' },
    { id: 'm2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg/800px-Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg', thumbUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg/320px-Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg', photographer: 'Michelangelo', alt: 'Creation of Adam' },
  ],
};

/**
 * Shuffle an array (Fisher-Yates)
 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Fetch reference images for a prompt
 * Uses Unsplash API if key is available, otherwise returns curated public domain images
 */
export async function fetchReferenceImages(
  subject: string,
  _medium: string,
  count: number = 3
): Promise<ReferenceImage[]> {
  // Try Unsplash API first if key is available
  if (UNSPLASH_ACCESS_KEY) {
    try {
      return await fetchFromUnsplash(subject, _medium, count);
    } catch {
      // Fall through to curated images
    }
  }

  // Use curated public domain images
  const images = CURATED_IMAGES[subject] || CURATED_IMAGES['landscapes'];
  return shuffle(images).slice(0, count);
}

async function fetchFromUnsplash(
  subject: string,
  medium: string,
  count: number
): Promise<ReferenceImage[]> {
  const SUBJECT_SEARCH_MAP: Record<string, string> = {
    'animals': 'animals wildlife', 'landscapes': 'landscape nature',
    'people-portraits': 'portrait', 'still-life': 'still life objects',
    'abstract': 'abstract art', 'urban': 'city urban street',
    'botanicals': 'flowers plants', 'fantasy': 'fantasy surreal',
    'food': 'food cuisine', 'architecture': 'architecture building',
    'patterns': 'patterns texture', 'mythology': 'mythology classical sculpture',
  };

  const query = SUBJECT_SEARCH_MAP[subject] || subject;
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

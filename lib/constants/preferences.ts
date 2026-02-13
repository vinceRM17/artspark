/**
 * Preference option lists for onboarding flow
 * Each option has an id (stored in database) and a user-facing label
 */

export type PreferenceOption = {
  id: string;
  label: string;
};

export const MEDIUM_OPTIONS: PreferenceOption[] = [
  { id: 'watercolor', label: 'Watercolor' },
  { id: 'gouache', label: 'Gouache' },
  { id: 'acrylic', label: 'Acrylic' },
  { id: 'oil', label: 'Oil Paint' },
  { id: 'pencil', label: 'Pencil' },
  { id: 'ink', label: 'Ink' },
  { id: 'digital', label: 'Digital' },
  { id: 'collage', label: 'Collage' },
  { id: 'paper-art', label: 'Paper Art' },
  { id: 'pastel', label: 'Pastel' },
  { id: 'charcoal', label: 'Charcoal' },
  { id: 'mixed-media', label: 'Mixed Media' },
];

export const COLOR_PALETTE_OPTIONS: PreferenceOption[] = [
  { id: 'earthy', label: 'Earthy' },
  { id: 'vibrant', label: 'Vibrant' },
  { id: 'monochrome', label: 'Monochrome' },
  { id: 'pastels', label: 'Pastels' },
  { id: 'complementary', label: 'Complementary' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'random-ok', label: "I'm okay with any" },
];

export const SUBJECT_OPTIONS: PreferenceOption[] = [
  { id: 'animals', label: 'Animals' },
  { id: 'landscapes', label: 'Landscapes' },
  { id: 'people-portraits', label: 'People & Portraits' },
  { id: 'still-life', label: 'Still Life' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'urban', label: 'Urban Scenes' },
  { id: 'botanicals', label: 'Botanicals' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'food', label: 'Food' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'mythology', label: 'Mythology' },
];

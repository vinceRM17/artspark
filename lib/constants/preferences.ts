/**
 * Preference option lists for onboarding flow
 * Each option has an id (stored in database) and a user-facing label
 *
 * Medium options are derived from the detailed medium definitions in mediums.ts
 */

import { MEDIUM_INFO } from './mediums';

export type PreferenceOption = {
  id: string;
  label: string;
};

export const MEDIUM_OPTIONS: PreferenceOption[] = Object.values(MEDIUM_INFO).map(m => ({
  id: m.id,
  label: m.label,
}));

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

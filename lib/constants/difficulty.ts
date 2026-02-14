/**
 * Difficulty level options
 *
 * Affects prompt complexity, twist frequency, and artistic direction.
 */

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type DifficultyOption = {
  id: DifficultyLevel;
  label: string;
  description: string;
  twistChance: number; // 0-1 probability of adding a twist
};

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'Simple subjects, gentle guidance, no extra challenges',
    twistChance: 0,
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: 'Varied subjects with occasional creative challenges',
    twistChance: 0.35,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Complex prompts with specific technique challenges',
    twistChance: 0.65,
  },
];

export function getDifficultyOption(id: string): DifficultyOption {
  return DIFFICULTY_OPTIONS.find(d => d.id === id) || DIFFICULTY_OPTIONS[1]; // default intermediate
}

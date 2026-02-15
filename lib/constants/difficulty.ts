/**
 * Difficulty level options
 *
 * Affects prompt complexity, twist frequency, template tier,
 * color rule chance, and artistic direction/tone.
 */

export type DifficultyLevel = 'kids' | 'explorer' | 'developing' | 'confident' | 'master';

export type TemplateTier = 'kids' | 'guided' | 'standard' | 'open';

export type DifficultyOption = {
  id: DifficultyLevel;
  label: string;
  description: string;
  twistChance: number;
  templateTier: TemplateTier;
  colorRuleChance: number;
  promptTone: string;
};

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    id: 'kids',
    label: 'Kids',
    description: 'Fun, simple prompts perfect for young artists and families',
    twistChance: 0,
    templateTier: 'kids',
    colorRuleChance: 0.1,
    promptTone: 'Fun, playful, encouraging',
  },
  {
    id: 'explorer',
    label: 'Explorer',
    description: 'Encouraging, step-by-step hints — perfect for getting started',
    twistChance: 0,
    templateTier: 'guided',
    colorRuleChance: 0.2,
    promptTone: 'Encouraging, step-by-step hints',
  },
  {
    id: 'developing',
    label: 'Developing Artist',
    description: 'Supportive prompts with light creative challenges',
    twistChance: 0.25,
    templateTier: 'standard',
    colorRuleChance: 0.35,
    promptTone: 'Supportive with light challenges',
  },
  {
    id: 'confident',
    label: 'Confident Artist',
    description: 'Direct, technique-focused prompts that push your skills',
    twistChance: 0.5,
    templateTier: 'standard',
    colorRuleChance: 0.4,
    promptTone: 'Direct, technique-focused',
  },
  {
    id: 'master',
    label: 'Master',
    description: 'Concise prompts that assume expertise — explore freely',
    twistChance: 0.7,
    templateTier: 'open',
    colorRuleChance: 0.5,
    promptTone: 'Concise, assumes expertise',
  },
];

/**
 * Legacy difficulty mapping for migration from old 3-level system
 */
const LEGACY_MAP: Record<string, DifficultyLevel> = {
  beginner: 'explorer',
  intermediate: 'developing',
  advanced: 'confident',
};

/**
 * Get difficulty option by ID with legacy fallback
 */
export function getDifficultyOption(id: string): DifficultyOption {
  // Check new levels first
  const direct = DIFFICULTY_OPTIONS.find(d => d.id === id);
  if (direct) return direct;

  // Try legacy mapping
  const mapped = LEGACY_MAP[id];
  if (mapped) {
    return DIFFICULTY_OPTIONS.find(d => d.id === mapped)!;
  }

  // Default to developing
  return DIFFICULTY_OPTIONS[2];
}

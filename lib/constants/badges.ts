/**
 * Badge definitions
 *
 * Achievement badges users can unlock through various activities.
 * Badges are computed from existing data (no new DB table needed).
 */

export type BadgeCategory = 'milestone' | 'streak' | 'exploration' | 'challenge';

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  /** Function to check if badge is unlocked */
  check: (stats: BadgeStats) => boolean;
};

export type BadgeStats = {
  totalArtworks: number;
  currentStreak: number;
  longestStreak: number;
  mediumsUsed: number;
  challengesCompleted: number;
  challengeDaysCompleted: number;
};

export const BADGES: BadgeDefinition[] = [
  // Milestone badges (artwork count)
  {
    id: 'first-spark',
    name: 'First Spark',
    description: 'Create your first artwork',
    icon: '\u2728',
    category: 'milestone',
    check: (s) => s.totalArtworks >= 1,
  },
  {
    id: 'prolific',
    name: 'Prolific',
    description: 'Create 10 artworks',
    icon: '\uD83C\uDFA8',
    category: 'milestone',
    check: (s) => s.totalArtworks >= 10,
  },
  {
    id: 'portfolio-builder',
    name: 'Portfolio Builder',
    description: 'Create 25 artworks',
    icon: '\uD83D\uDDBC\uFE0F',
    category: 'milestone',
    check: (s) => s.totalArtworks >= 25,
  },
  {
    id: 'master-creator',
    name: 'Master Creator',
    description: 'Create 50 artworks',
    icon: '\uD83C\uDFC6',
    category: 'milestone',
    check: (s) => s.totalArtworks >= 50,
  },

  // Streak badges
  {
    id: 'on-fire',
    name: 'On Fire',
    description: 'Reach a 7-day streak',
    icon: '\uD83D\uDD25',
    category: 'streak',
    check: (s) => s.longestStreak >= 7,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Reach a 14-day streak',
    icon: '\u26A1',
    category: 'streak',
    check: (s) => s.longestStreak >= 14,
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Reach a 30-day streak',
    icon: '\uD83D\uDCAA',
    category: 'streak',
    check: (s) => s.longestStreak >= 30,
  },

  // Exploration badges (mediums tried)
  {
    id: 'experimenter',
    name: 'Experimenter',
    description: 'Try 3 different mediums',
    icon: '\uD83E\uDDEA',
    category: 'exploration',
    check: (s) => s.mediumsUsed >= 3,
  },
  {
    id: 'renaissance',
    name: 'Renaissance',
    description: 'Try 5 different mediums',
    icon: '\uD83C\uDF1F',
    category: 'exploration',
    check: (s) => s.mediumsUsed >= 5,
  },
  {
    id: 'polymath',
    name: 'Polymath',
    description: 'Try 8 different mediums',
    icon: '\uD83C\uDF08',
    category: 'exploration',
    check: (s) => s.mediumsUsed >= 8,
  },

  // Challenge badges
  {
    id: 'challenger',
    name: 'Challenger',
    description: 'Complete your first challenge',
    icon: '\uD83C\uDFF3\uFE0F',
    category: 'challenge',
    check: (s) => s.challengesCompleted >= 1,
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Complete 3 challenges',
    icon: '\uD83E\uDD47',
    category: 'challenge',
    check: (s) => s.challengesCompleted >= 3,
  },
];

export const TOTAL_BADGES = BADGES.length;

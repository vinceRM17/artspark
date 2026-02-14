/**
 * Challenge definitions
 *
 * Static challenge content for weekly and monthly themed art challenges.
 * Each challenge has a series of daily prompts that guide the artist
 * through a progression of skills or themes.
 */

export type ChallengeType = 'weekly' | 'monthly';

export type ChallengeDefinition = {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  duration: number; // days
  dailyPrompts: string[];
  medium?: string; // optional medium constraint
  subject?: string; // optional subject constraint
  icon: string;
};

export const CHALLENGES: ChallengeDefinition[] = [
  // --- Weekly Challenges (7 days) ---
  {
    id: 'watercolor-week',
    title: 'Watercolor Week',
    description:
      'Seven days of watercolor exercises progressing from basic washes to layered compositions.',
    type: 'weekly',
    duration: 7,
    medium: 'watercolor',
    icon: '\uD83C\uDF0A', // wave
    dailyPrompts: [
      'Day 1: Practice flat washes — paint a simple sky gradient from light to dark.',
      'Day 2: Wet-on-wet technique — create an abstract bloom of two colors merging on wet paper.',
      'Day 3: Dry brush texture — paint tree bark or stone using dry brush strokes.',
      'Day 4: Negative painting — paint the space around a simple leaf shape to reveal it.',
      'Day 5: Color mixing — paint a color wheel using only your three primary tubes.',
      'Day 6: Simple landscape — combine washes and dry brush for a basic landscape scene.',
      'Day 7: Final piece — create a finished watercolor painting using all techniques practiced this week.',
    ],
  },
  {
    id: 'sketch-a-day',
    title: 'Sketch-a-Day',
    description:
      'Daily pencil sketching to build observation skills and drawing confidence.',
    type: 'weekly',
    duration: 7,
    medium: 'pencil',
    icon: '\u270F\uFE0F', // pencil
    dailyPrompts: [
      'Day 1: Contour drawing — sketch your non-dominant hand without lifting the pencil.',
      'Day 2: Shapes study — draw 5 everyday objects as basic geometric shapes.',
      'Day 3: Light & shadow — sketch a single object with strong directional lighting.',
      'Day 4: Texture practice — draw three different textures (fabric, wood, metal).',
      'Day 5: Perspective — sketch a hallway or road receding into the distance.',
      'Day 6: Quick gestures — do ten 60-second gesture sketches of people or animals.',
      'Day 7: Detailed study — spend 30+ minutes on a careful observational drawing.',
    ],
  },
  {
    id: 'color-study-week',
    title: 'Color Study Week',
    description:
      'Explore color theory through daily exercises in any medium you choose.',
    type: 'weekly',
    duration: 7,
    icon: '\uD83C\uDFA8', // palette
    dailyPrompts: [
      'Day 1: Monochrome — create a piece using only one color in different values.',
      'Day 2: Complementary — paint using a complementary pair (red/green, blue/orange, yellow/purple).',
      'Day 3: Warm palette — create something using only warm colors (reds, oranges, yellows).',
      'Day 4: Cool palette — create something using only cool colors (blues, greens, purples).',
      'Day 5: Analogous — use three colors next to each other on the color wheel.',
      'Day 6: Limited palette — create a piece with exactly three colors plus white.',
      'Day 7: Color from life — paint an object matching its colors as accurately as possible.',
    ],
  },

  // --- Monthly Challenges (30 days) ---
  {
    id: 'inktober-inspired',
    title: 'Inktober Inspired',
    description:
      'Thirty days of ink drawing exploring different subjects and techniques.',
    type: 'monthly',
    duration: 30,
    medium: 'ink',
    icon: '\uD83D\uDD8B\uFE0F', // fountain pen
    dailyPrompts: [
      'Day 1: Ring — draw something circular or ring-shaped.',
      'Day 2: Mindless — draw without planning, let the pen wander.',
      'Day 3: Path — illustrate a winding path or trail.',
      'Day 4: Dodge — draw something in motion, avoiding an obstacle.',
      'Day 5: Map — create an illustrated map of a real or imaginary place.',
      'Day 6: Golden — draw something associated with the color gold.',
      'Day 7: Drip — incorporate dripping ink into your drawing.',
      'Day 8: Flame — draw fire, candles, or warmth.',
      'Day 9: Bounce — illustrate something bouncing or elastic.',
      'Day 10: Fortune — draw something related to luck or fortune.',
      'Day 11: Rust — illustrate decay, age, or patina.',
      'Day 12: Spicy — draw food, peppers, or something "hot".',
      'Day 13: Rise — illustrate something ascending or rising.',
      'Day 14: Castle — draw architecture, towers, or fortifications.',
      'Day 15: Halfway! Dagger — draw a blade, weapon, or sharp object.',
      'Day 16: Angel — illustrate wings, halos, or heavenly figures.',
      'Day 17: Demon — draw something dark, mysterious, or mischievous.',
      'Day 18: Saddle — illustrate horses, riding, or western themes.',
      'Day 19: Plump — draw round, full, or voluptuous forms.',
      'Day 20: Frost — illustrate cold, ice crystals, or winter.',
      'Day 21: Chains — draw links, connections, or restraints.',
      'Day 22: Open — illustrate openness, doors, or revelation.',
      'Day 23: Celestial — draw stars, planets, or cosmic scenes.',
      'Day 24: Shallow — illustrate water, puddles, or surface-level themes.',
      'Day 25: Dangerous — draw something risky or threatening.',
      'Day 26: Remove — illustrate subtraction, absence, or erasure.',
      'Day 27: Beast — draw a creature, real or imagined.',
      'Day 28: Sparkle — illustrate light, glitter, or brilliance.',
      'Day 29: Massive — draw something enormous or grand in scale.',
      'Day 30: Final piece — create your best ink drawing incorporating your favorite techniques from the month.',
    ],
  },
  {
    id: '30-days-botanicals',
    title: '30 Days of Botanicals',
    description:
      'A month-long journey through botanical illustration in any medium.',
    type: 'monthly',
    duration: 30,
    subject: 'botanicals',
    icon: '\uD83C\uDF3F', // herb
    dailyPrompts: [
      'Day 1: Single leaf — study and draw one leaf in detail.',
      'Day 2: Flower bud — capture a flower before it opens.',
      'Day 3: Stem study — draw a plant stem with nodes and texture.',
      'Day 4: Petal shapes — paint or draw 5 different petal shapes.',
      'Day 5: Root system — illustrate roots, bulbs, or underground growth.',
      'Day 6: Seed pod — draw a seed, pod, or fruit in cross-section.',
      'Day 7: Week review — revisit your favorite from this week and refine it.',
      'Day 8: Succulent — draw a succulent or cactus with geometric patterns.',
      'Day 9: Wildflower — paint a wildflower you find outdoors or in a photo.',
      'Day 10: Tree bark — study and draw the texture of tree bark.',
      'Day 11: Fern — capture the fractal patterns of a fern frond.',
      'Day 12: Herb sprig — draw a culinary herb (basil, rosemary, thyme).',
      'Day 13: Mushroom — illustrate a mushroom or fungi.',
      'Day 14: Week review — create a small composition from week 2 subjects.',
      'Day 15: Tropical leaf — draw a monstera, palm, or banana leaf.',
      'Day 16: Berry cluster — paint berries on a branch.',
      'Day 17: Dried flower — draw a pressed or dried flower arrangement.',
      'Day 18: Pine cone — study the spiral patterns of a pine cone.',
      'Day 19: Moss & lichen — illustrate these tiny plant forms.',
      'Day 20: Vine — draw a climbing or trailing vine.',
      'Day 21: Week review — combine three subjects into one composition.',
      'Day 22: Rose — paint a classic rose study.',
      'Day 23: Leaf veins — zoom in on the vein patterns of a leaf.',
      'Day 24: Botanical pattern — create a repeating pattern from plant elements.',
      'Day 25: Wreath — arrange botanical elements in a circular wreath.',
      'Day 26: Garden scene — draw a corner of a garden.',
      'Day 27: Seasonal — capture a plant showing signs of the current season.',
      'Day 28: Week review — refine your favorite botanical from the month.',
      'Day 29: Botanical alphabet — draw a letter formed from plants and flowers.',
      'Day 30: Final piece — create a finished botanical illustration showcasing your growth.',
    ],
  },
  {
    id: 'portrait-journey',
    title: 'Portrait Journey',
    description:
      'Build portrait skills progressively over 30 days, from basic proportions to expressive faces.',
    type: 'monthly',
    duration: 30,
    subject: 'portraits',
    icon: '\uD83D\uDC64', // bust silhouette
    dailyPrompts: [
      'Day 1: Egg shape — practice the basic head shape from front and side.',
      'Day 2: Eye study — draw a single realistic eye with detail.',
      'Day 3: Nose study — draw noses from front, side, and 3/4 view.',
      'Day 4: Mouth study — draw lips in different expressions.',
      'Day 5: Ear study — draw ears from different angles.',
      'Day 6: Proportions — draw a face using the classic proportion grid.',
      'Day 7: Week review — draw a complete face using this week\'s studies.',
      'Day 8: Hair texture — practice drawing straight, wavy, and curly hair.',
      'Day 9: Expression: happy — draw a smiling face with crinkled eyes.',
      'Day 10: Expression: sad — capture downturned features and emotion.',
      'Day 11: Expression: surprised — draw wide eyes and raised brows.',
      'Day 12: Expression: thoughtful — capture a contemplative look.',
      'Day 13: Age study — draw the same face as child, adult, and elder.',
      'Day 14: Week review — draw an expressive portrait from this week.',
      'Day 15: 3/4 view — practice the most common portrait angle.',
      'Day 16: Profile — draw a side-view portrait.',
      'Day 17: Looking up — draw a face from a low angle.',
      'Day 18: Looking down — draw a face from above.',
      'Day 19: Glasses & accessories — add glasses, hats, or jewelry.',
      'Day 20: Hands near face — draw a portrait with hands in the composition.',
      'Day 21: Week review — your best angle study as a finished piece.',
      'Day 22: Light from left — draw a face with strong side lighting.',
      'Day 23: Backlit — capture a silhouette or rim-lit portrait.',
      'Day 24: Dramatic shadows — high-contrast, moody portrait lighting.',
      'Day 25: Soft light — even, gentle lighting portrait.',
      'Day 26: Self-portrait — draw yourself from a mirror or photo.',
      'Day 27: Someone you admire — draw a portrait of someone meaningful.',
      'Day 28: Stylized — draw a portrait in a non-realistic style.',
      'Day 29: From imagination — draw a face entirely from your mind.',
      'Day 30: Final piece — create your best portrait incorporating everything learned.',
    ],
  },
];

/**
 * Get a challenge by ID
 */
export function getChallengeById(id: string): ChallengeDefinition | undefined {
  return CHALLENGES.find(c => c.id === id);
}

/**
 * Get challenges filtered by type
 */
export function getChallengesByType(type: ChallengeType): ChallengeDefinition[] {
  return CHALLENGES.filter(c => c.type === type);
}

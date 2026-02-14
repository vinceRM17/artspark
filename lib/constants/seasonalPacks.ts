/**
 * Seasonal & themed prompt packs
 *
 * Curated prompt collections tied to seasons, holidays, or artistic themes.
 * Active packs are determined by date; themed packs are always available.
 */

export type PromptPack = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: 'seasonal' | 'themed';
  /** Months when this pack is active (1-12). null = always available */
  activeMonths: number[] | null;
  prompts: PackPrompt[];
};

export type PackPrompt = {
  text: string;
  medium?: string; // Suggested medium (optional, user's prefs used if not set)
  subject?: string;
};

export const PROMPT_PACKS: PromptPack[] = [
  // === SEASONAL ===
  {
    id: 'spring-bloom',
    name: 'Spring Bloom',
    description: 'Fresh starts, flowers, and new growth',
    emoji: '\uD83C\uDF38',
    type: 'seasonal',
    activeMonths: [3, 4, 5],
    prompts: [
      { text: 'Paint the first flower you see blooming this spring' },
      { text: 'Capture morning dew on a leaf in your preferred medium' },
      { text: 'Create a piece inspired by the transition from winter to spring' },
      { text: 'Study a tree branch with new buds forming', subject: 'botanicals' },
      { text: 'Illustrate a spring rain shower and its reflections' },
      { text: 'Draw a garden coming back to life', subject: 'botanicals' },
      { text: 'Paint cherry blossoms or any flowering tree you love', medium: 'watercolor' },
    ],
  },
  {
    id: 'summer-light',
    name: 'Summer Light',
    description: 'Golden hours, long shadows, and outdoor scenes',
    emoji: '\u2600\uFE0F',
    type: 'seasonal',
    activeMonths: [6, 7, 8],
    prompts: [
      { text: 'Capture golden hour light on any outdoor scene' },
      { text: 'Paint a summer thunderstorm approaching on the horizon', subject: 'landscapes' },
      { text: 'Study the shadow patterns cast by late afternoon sun' },
      { text: 'Create a piece inspired by the colors of summer produce', subject: 'food' },
      { text: 'Sketch a lazy summer afternoon scene' },
      { text: 'Paint water — a pool, lake, ocean, or rain puddle', subject: 'landscapes' },
      { text: 'Capture fireflies or twilight in your medium of choice' },
    ],
  },
  {
    id: 'autumn-palette',
    name: 'Autumn Palette',
    description: 'Warm tones, changing leaves, and cozy scenes',
    emoji: '\uD83C\uDF42',
    type: 'seasonal',
    activeMonths: [9, 10, 11],
    prompts: [
      { text: 'Study a leaf in three stages of turning — green, changing, fallen' },
      { text: 'Paint a cozy indoor scene with warm autumn light', subject: 'still-life' },
      { text: 'Create a piece using only warm tones — reds, oranges, golds' },
      { text: 'Sketch a harvest scene or autumn market', subject: 'food' },
      { text: 'Capture fog or mist in an early autumn morning', subject: 'landscapes' },
      { text: 'Draw texture: tree bark, fallen leaves, or dried flowers', subject: 'botanicals' },
      { text: 'Paint a window view looking out at changing seasons' },
    ],
  },
  {
    id: 'winter-quiet',
    name: 'Winter Quiet',
    description: 'Still scenes, cold light, and introspection',
    emoji: '\u2744\uFE0F',
    type: 'seasonal',
    activeMonths: [12, 1, 2],
    prompts: [
      { text: 'Study how light behaves on snow or frost' },
      { text: 'Paint a warm drink — coffee, tea, hot chocolate — in cold light', subject: 'still-life' },
      { text: 'Create a piece about stillness and quiet' },
      { text: 'Draw bare winter trees against a grey sky', subject: 'botanicals' },
      { text: 'Capture candle light or firelight in your preferred medium' },
      { text: 'Paint a cozy interior scene — blankets, books, warm colors', subject: 'still-life' },
      { text: 'Illustrate the beauty in something frozen or dormant' },
    ],
  },

  // === THEMED (always available) ===
  {
    id: 'monochrome',
    name: 'Monochrome Challenge',
    description: 'One color, infinite possibilities',
    emoji: '\u26AB',
    type: 'themed',
    activeMonths: null,
    prompts: [
      { text: 'Create a piece using only black and white — focus on value range' },
      { text: 'Use a single color and explore its full range from lightest tint to darkest shade' },
      { text: 'Draw the same subject three times using only different values of grey' },
      { text: 'Create a high-contrast piece with no mid-tones — only pure light and dark' },
      { text: 'Paint a portrait using sepia tones only', subject: 'people-portraits' },
    ],
  },
  {
    id: 'tiny-art',
    name: 'Tiny Art',
    description: 'Small-scale pieces, big impact',
    emoji: '\uD83D\uDD0D',
    type: 'themed',
    activeMonths: null,
    prompts: [
      { text: 'Create a complete piece no larger than a sticky note' },
      { text: 'Paint a miniature landscape on a 2-inch square', subject: 'landscapes' },
      { text: 'Draw a detailed study of something tiny — an insect, a seed, a button' },
      { text: 'Create an artist trading card (2.5 x 3.5 inches) of your favorite subject' },
      { text: 'Make the smallest piece of art you can — how much detail fits in a 1-inch circle?' },
    ],
  },
  {
    id: 'everyday-beauty',
    name: 'Everyday Beauty',
    description: 'Find art in the mundane',
    emoji: '\u2728',
    type: 'themed',
    activeMonths: null,
    prompts: [
      { text: 'Draw the view from your kitchen window', subject: 'landscapes' },
      { text: 'Paint your morning coffee or breakfast setup', subject: 'food' },
      { text: 'Sketch the contents of your desk or workspace', subject: 'still-life' },
      { text: 'Study the patterns and textures of everyday objects — keys, coins, fabric' },
      { text: 'Create a piece inspired by something you saw on your daily walk or commute' },
    ],
  },
  {
    id: 'emotional-color',
    name: 'Color & Emotion',
    description: 'Express feelings through color choices',
    emoji: '\uD83C\uDFA8',
    type: 'themed',
    activeMonths: null,
    prompts: [
      { text: 'Paint how you feel right now using only abstract color and shape', subject: 'abstract' },
      { text: 'Choose a song and translate its mood into colors on paper' },
      { text: 'Create a piece using colors that feel "calm" to you' },
      { text: 'Paint the same subject twice — once in warm tones, once in cool tones' },
      { text: 'Use only your three favorite colors to create a piece about joy' },
    ],
  },
];

/**
 * Get currently active packs (seasonal + always-available themed)
 */
export function getActivePacks(): PromptPack[] {
  const currentMonth = new Date().getMonth() + 1;
  return PROMPT_PACKS.filter(pack =>
    pack.activeMonths === null || pack.activeMonths.includes(currentMonth)
  );
}

/**
 * Get a random prompt from a specific pack
 */
export function getRandomPackPrompt(packId: string): PackPrompt | null {
  const pack = PROMPT_PACKS.find(p => p.id === packId);
  if (!pack || pack.prompts.length === 0) return null;
  return pack.prompts[Math.floor(Math.random() * pack.prompts.length)];
}

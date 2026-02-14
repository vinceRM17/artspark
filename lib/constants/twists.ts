/**
 * Creative twist options for prompts
 *
 * Each twist specifies which mediums it's compatible with.
 * "all" means it works with any medium.
 * Color-related twists only apply to color-capable mediums.
 */

export type CreativeTwist = {
  text: string;
  compatibleWith: 'all' | 'color' | 'dry' | 'wet' | string[];
};

// Mediums that support color
export const COLOR_MEDIUMS = ['watercolor', 'gouache', 'acrylic', 'oil', 'pastel', 'digital', 'collage', 'mixed-media'];
// Mediums that are inherently monochrome
export const MONO_MEDIUMS = ['pencil', 'charcoal', 'ink'];
// Wet mediums (longer setup/dry time)
export const WET_MEDIUMS = ['watercolor', 'gouache', 'acrylic', 'oil'];
// Dry mediums (quick to start)
export const DRY_MEDIUMS = ['pencil', 'charcoal', 'ink', 'pastel', 'digital', 'collage', 'paper-art'];

export const CREATIVE_TWISTS: CreativeTwist[] = [
  // Universal twists — work with any medium
  { text: "Work from memory, not reference", compatibleWith: 'all' },
  { text: "Focus on negative space", compatibleWith: 'all' },
  { text: "Emphasize light and shadow", compatibleWith: 'all' },
  { text: "Simplify to essential shapes only", compatibleWith: 'all' },
  { text: "Try a perspective you've never used", compatibleWith: 'all' },
  { text: "Work larger than usual", compatibleWith: 'all' },
  { text: "Work smaller than usual", compatibleWith: 'all' },
  { text: "Focus on movement and energy", compatibleWith: 'all' },
  { text: "Create a mood, not just a scene", compatibleWith: 'all' },
  { text: "Break one rule you usually follow", compatibleWith: 'all' },
  { text: "Spend extra time on composition before starting", compatibleWith: 'all' },
  { text: "Leave it intentionally unfinished", compatibleWith: 'all' },
  { text: "Work in a series — do 3 quick variations", compatibleWith: 'all' },

  // Color-only twists — only for mediums that support color
  { text: "Limit yourself to 3 colors plus white", compatibleWith: 'color' },
  { text: "Use complementary colors as your foundation", compatibleWith: 'color' },
  { text: "Build the entire piece from warm tones only", compatibleWith: 'color' },
  { text: "Build the entire piece from cool tones only", compatibleWith: 'color' },
  { text: "Start with the darkest values first", compatibleWith: 'color' },
  { text: "Use an unexpected color for your shadows", compatibleWith: 'color' },

  // Dry medium twists — pencil, charcoal, ink, pastel
  { text: "Complete it in under 15 minutes", compatibleWith: 'dry' },
  { text: "Use only continuous line — don't lift your tool", compatibleWith: 'dry' },
  { text: "Build form using only hatching and cross-hatching", compatibleWith: 'dry' },

  // Wet medium twists — watercolor, gouache, acrylic, oil
  { text: "Let the medium do the work — embrace happy accidents", compatibleWith: 'wet' },
  { text: "Work wet-on-wet for the entire piece", compatibleWith: 'wet' },
  { text: "Use a palette knife instead of brushes", compatibleWith: ['acrylic', 'oil', 'gouache'] },

  // Specific medium twists
  { text: "Use salt or alcohol for texture effects", compatibleWith: ['watercolor'] },
  { text: "Layer transparent washes — no opaque passages", compatibleWith: ['watercolor', 'ink'] },
  { text: "Smudge and blend with your fingers", compatibleWith: ['charcoal', 'pastel'] },
];

/**
 * Get twists compatible with a given medium
 */
export function getTwistsForMedium(medium: string): CreativeTwist[] {
  return CREATIVE_TWISTS.filter(twist => {
    if (twist.compatibleWith === 'all') return true;
    if (twist.compatibleWith === 'color') return COLOR_MEDIUMS.includes(medium);
    if (twist.compatibleWith === 'dry') return DRY_MEDIUMS.includes(medium);
    if (twist.compatibleWith === 'wet') return WET_MEDIUMS.includes(medium);
    if (Array.isArray(twist.compatibleWith)) return twist.compatibleWith.includes(medium);
    return false;
  });
}

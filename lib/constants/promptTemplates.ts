/**
 * Prompt templates — artistically meaningful prompt text generation
 *
 * Each template provides specific artistic direction that makes sense
 * for the given medium + subject combination. Templates use {medium}
 * and {subject} placeholders.
 *
 * Templates are tagged with a tier:
 * - 'guided': Step-by-step, encouraging (for Explorer level)
 * - 'standard': Balanced direction (for Developing/Confident levels)
 * - 'open': Minimal, assumes expertise (for Master level)
 */

import type { TemplateTier } from './difficulty';

type PromptTemplate = {
  template: string;
  tier: TemplateTier;
  mediums?: string[]; // If set, only use with these mediums. Otherwise universal.
  subjects?: string[]; // If set, only use with these subjects. Otherwise universal.
};

const TEMPLATES: PromptTemplate[] = [
  // === GUIDED TIER (Explorer) — step-by-step, encouraging ===

  // Watercolor guided
  { template: "Start by lightly sketching {subject} in pencil, then layer {medium} washes from lightest to darkest — let each layer dry before adding the next", tier: 'guided', mediums: ['watercolor'] },
  { template: "Begin with a simple {subject} outline, then practice {medium} wet-on-dry technique: paint a wash, let it dry, then add details on top", tier: 'guided', mediums: ['watercolor', 'gouache'] },

  // Drawing guided
  { template: "Start by drawing the basic shapes of {subject} in {medium} using light pressure — circles, ovals, rectangles — then gradually refine the details", tier: 'guided', mediums: ['pencil', 'charcoal'] },
  { template: "Practice drawing {subject} in {medium}: begin with a gesture sketch (30 seconds), then do a longer, more careful version (10 minutes)", tier: 'guided', mediums: ['pencil', 'charcoal', 'ink'] },

  // Painting guided
  { template: "Block in the main shapes of {subject} with large brushstrokes of {medium} first — don't worry about details until the whole canvas has color", tier: 'guided', mediums: ['acrylic', 'oil', 'gouache'] },

  // Digital guided
  { template: "Create {subject} digitally: start on one layer for your sketch, then add a new layer underneath for color blocking before refining", tier: 'guided', mediums: ['digital'] },

  // Universal guided
  { template: "Study {subject} in {medium} — take a full minute to observe your subject before making any marks, noticing shapes and values", tier: 'guided' },
  { template: "Create {subject} in {medium} today. Tip: start with the biggest shapes first, then work your way to smaller details", tier: 'guided' },
  { template: "Warm up with quick thumbnail sketches of {subject}, then create a finished {medium} piece from your favorite composition", tier: 'guided' },

  // Subject-specific guided
  { template: "Draw {subject} in {medium}: start by identifying the light source, then shade the shadow side to give your work a 3D feeling", tier: 'guided', subjects: ['animals', 'people-portraits', 'still-life', 'botanicals', 'food'] },
  { template: "Sketch {subject} in {medium}: use a viewfinder (your fingers in an L shape) to crop an interesting composition before you start", tier: 'guided', subjects: ['landscapes', 'urban', 'architecture'] },

  // === STANDARD TIER (Developing/Confident) — balanced direction ===

  // Watercolor-specific
  { template: "Paint a {subject} study in {medium}, letting the water guide your washes", tier: 'standard', mediums: ['watercolor'] },
  { template: "Create a loose {medium} {subject} sketch — capture the essence, not the details", tier: 'standard', mediums: ['watercolor', 'gouache'] },
  { template: "Explore {subject} in {medium}, building from light to dark in transparent layers", tier: 'standard', mediums: ['watercolor'] },

  // Pencil / Charcoal / Ink
  { template: "Draw {subject} in {medium}, focusing on the interplay of light and shadow", tier: 'standard', mediums: ['pencil', 'charcoal', 'ink'] },
  { template: "Create a {medium} study of {subject} using value alone to define form", tier: 'standard', mediums: ['pencil', 'charcoal'] },
  { template: "Sketch {subject} in {medium} — aim for gesture and feeling over precision", tier: 'standard', mediums: ['pencil', 'charcoal', 'ink'] },
  { template: "Render {subject} in {medium}, paying close attention to edges — where they're sharp, where they're lost", tier: 'standard', mediums: ['pencil', 'charcoal'] },

  // Oil / Acrylic
  { template: "Paint {subject} in {medium}, building up color with bold, confident strokes", tier: 'standard', mediums: ['oil', 'acrylic'] },
  { template: "Create a {medium} {subject} piece, exploring how thick and thin paint create texture", tier: 'standard', mediums: ['oil', 'acrylic'] },
  { template: "Paint {subject} in {medium} — block in large shapes first, then refine selectively", tier: 'standard', mediums: ['oil', 'acrylic', 'gouache'] },

  // Digital
  { template: "Create a {medium} {subject} piece exploring shape language and silhouette", tier: 'standard', mediums: ['digital'] },
  { template: "Design {subject} digitally, using a limited brush set to unify the piece", tier: 'standard', mediums: ['digital'] },

  // Collage / Mixed Media
  { template: "Compose {subject} in {medium}, combining found textures and materials", tier: 'standard', mediums: ['collage', 'mixed-media', 'paper-art'] },
  { template: "Create a {medium} {subject} piece — let unexpected material combinations tell the story", tier: 'standard', mediums: ['collage', 'mixed-media'] },

  // Subject-specific (any medium)
  { template: "Study {subject} in {medium} — observe how the form catches light from a single source", tier: 'standard', subjects: ['animals', 'people-portraits', 'still-life', 'botanicals', 'food'] },
  { template: "Create a {medium} {subject} piece that captures atmosphere and depth", tier: 'standard', subjects: ['landscapes', 'urban', 'architecture'] },
  { template: "Interpret {subject} in {medium}, emphasizing rhythm and visual flow", tier: 'standard', subjects: ['abstract', 'patterns'] },
  { template: "Explore {subject} in {medium} — tell a story through composition and detail", tier: 'standard', subjects: ['mythology', 'fantasy'] },
  { template: "Render {subject} in {medium}, focusing on the textures and surfaces you observe", tier: 'standard', subjects: ['still-life', 'food', 'botanicals'] },
  { template: "Capture the character of {subject} in {medium} — what makes this subject unique?", tier: 'standard', subjects: ['animals', 'people-portraits'] },
  { template: "Create a {medium} study of {subject} that plays with foreground and background relationships", tier: 'standard', subjects: ['landscapes', 'urban', 'architecture', 'botanicals'] },
  { template: "Express {subject} in {medium} through shapes and gesture rather than literal detail", tier: 'standard', subjects: ['abstract', 'fantasy', 'mythology'] },

  // Universal standard
  { template: "Create a {medium} piece inspired by {subject} — focus on what draws your eye first", tier: 'standard' },
  { template: "Study {subject} in {medium}, taking time to really observe before you begin", tier: 'standard' },
  { template: "Interpret {subject} through {medium} — bring your own perspective to the subject", tier: 'standard' },
  { template: "Explore {subject} in {medium}, paying attention to the shapes between objects", tier: 'standard' },
  { template: "Create {subject} in {medium}, challenging yourself to work more intuitively today", tier: 'standard' },

  // === OPEN TIER (Master) — minimal, assumes expertise ===

  { template: "Explore {subject} in {medium}", tier: 'open' },
  { template: "{subject}. {medium}. Your interpretation", tier: 'open' },
  { template: "Deconstruct {subject} through {medium} — find the unexpected", tier: 'open' },
  { template: "{medium} study: {subject}, emphasis on negative space", tier: 'open' },
  { template: "Reinterpret {subject} in {medium} — subvert one convention", tier: 'open' },
  { template: "{subject} in {medium}. Limit yourself to 30 minutes", tier: 'open' },
  { template: "Investigate the tension between form and void: {subject}, {medium}", tier: 'open' },

  // Medium-specific open
  { template: "{subject} — push {medium} to its extremes of wet and dry", tier: 'open', mediums: ['watercolor', 'ink'] },
  { template: "{subject} in {medium}: impasto vs. scumble", tier: 'open', mediums: ['oil', 'acrylic'] },
  { template: "{subject}. {medium}. One continuous line", tier: 'open', mediums: ['pencil', 'ink', 'charcoal'] },
  { template: "Layer, obscure, reveal: {subject} in {medium}", tier: 'open', mediums: ['collage', 'mixed-media'] },
];

/**
 * Get a random prompt template compatible with medium, subject, and skill tier
 */
export function getPromptTemplate(
  medium: string,
  subject: string,
  tier?: TemplateTier
): string {
  // Find templates that match this medium+subject+tier combo
  const compatible = TEMPLATES.filter(t => {
    const mediumOk = !t.mediums || t.mediums.includes(medium);
    const subjectOk = !t.subjects || t.subjects.includes(subject);
    const tierOk = !tier || t.tier === tier;
    return mediumOk && subjectOk && tierOk;
  });

  // Fallback: if tier filtering yields nothing, broaden to standard templates
  const pool = compatible.length > 0
    ? compatible
    : TEMPLATES.filter(t => {
        const mediumOk = !t.mediums || t.mediums.includes(medium);
        const subjectOk = !t.subjects || t.subjects.includes(subject);
        return mediumOk && subjectOk;
      });

  // Pick random template
  const template = pool[Math.floor(Math.random() * pool.length)];

  // Look up display labels
  const mediumLabels: Record<string, string> = {
    'watercolor': 'watercolor', 'gouache': 'gouache', 'acrylic': 'acrylic',
    'oil': 'oil paint', 'pencil': 'pencil', 'ink': 'ink', 'digital': 'digital',
    'collage': 'collage', 'paper-art': 'paper art', 'pastel': 'pastel',
    'charcoal': 'charcoal', 'mixed-media': 'mixed media',
  };
  const subjectLabels: Record<string, string> = {
    'animals': 'animals', 'landscapes': 'a landscape', 'people-portraits': 'a portrait',
    'still-life': 'a still life', 'abstract': 'an abstract composition',
    'urban': 'an urban scene', 'botanicals': 'botanicals', 'fantasy': 'a fantasy scene',
    'food': 'food', 'architecture': 'architecture', 'patterns': 'patterns',
    'mythology': 'a mythological scene',
  };

  const mediumLabel = mediumLabels[medium] || medium;
  const subjectLabel = subjectLabels[subject] || subject;

  return template.template
    .replace('{medium}', mediumLabel)
    .replace('{subject}', subjectLabel);
}

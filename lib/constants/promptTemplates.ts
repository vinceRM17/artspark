/**
 * Prompt templates — artistically meaningful prompt text generation
 *
 * Each template provides specific artistic direction that makes sense
 * for the given medium + subject combination. Templates use {medium}
 * and {subject} placeholders.
 *
 * Templates are tagged with a tier:
 * - 'kids': Fun, playful, simple (for Kids level)
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
  // === KIDS TIER — fun, playful, simple ===

  // Universal kids
  { template: "Draw your favorite {subject} using {medium} — make it as colorful as you want!", tier: 'kids' },
  { template: "Can you draw {subject} using {medium}? Add your own fun details!", tier: 'kids' },
  { template: "Use {medium} to create {subject} — there's no wrong way to do it!", tier: 'kids' },
  { template: "Let's make art! Draw {subject} with {medium} and see what happens", tier: 'kids' },
  { template: "Today's art adventure: create {subject} using {medium}!", tier: 'kids' },
  { template: "Grab your {medium} and draw {subject} — be as creative as you like!", tier: 'kids' },
  { template: "Time to get creative! Make {subject} with {medium} and add a fun background", tier: 'kids' },
  { template: "Draw {subject} using {medium} — what colors will you choose?", tier: 'kids' },

  // Subject-specific kids
  { template: "Draw your dream {subject} using {medium} — it can be silly or serious!", tier: 'kids', subjects: ['animals', 'fantasy', 'mythology'] },
  { template: "Use {medium} to draw {subject} you might see outside your window", tier: 'kids', subjects: ['landscapes', 'urban', 'botanicals', 'architecture'] },
  { template: "Draw {subject} using {medium} — what would you put on the table?", tier: 'kids', subjects: ['still-life', 'food'] },
  { template: "Create a fun {subject} pattern with {medium} — repeat shapes and colors!", tier: 'kids', subjects: ['abstract', 'patterns'] },

  // Medium-specific kids
  { template: "Splash some {medium} on your paper and turn {subject} into something magical!", tier: 'kids', mediums: ['watercolor', 'gouache'] },
  { template: "Use your {medium} to sketch {subject} — start with big shapes, then add details!", tier: 'kids', mediums: ['pencil', 'charcoal'] },
  { template: "Get your {medium} ready and paint {subject} with your brightest colors!", tier: 'kids', mediums: ['acrylic', 'oil', 'gouache'] },
  { template: "Create {subject} with {medium} on your screen — try out different brushes!", tier: 'kids', mediums: ['digital'] },

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

  // Specific, evocative subject variations — a random one is picked each time
  const subjectVariations: Record<string, string[]> = {
    'animals': [
      'a cat curled up in a sunbeam',
      'a bird perched on a branch',
      'a dog mid-stride on a walk',
      'a rabbit nibbling clover',
      'a horse grazing in a misty field',
      'a butterfly resting on a flower',
      'a fox peering through tall grass',
      'a goldfish in a glass bowl',
      'a deer at the edge of a forest',
      'a turtle basking on a warm rock',
    ],
    'landscapes': [
      'a winding path through autumn woods',
      'rolling hills under a stormy sky',
      'a quiet lake reflecting the mountains',
      'a sunlit meadow with wildflowers',
      'a coastal cliff at golden hour',
      'a misty river valley at dawn',
      'a snow-dusted field at twilight',
      'a desert canyon bathed in warm light',
      'a vineyard stretching toward the horizon',
      'a lone tree on a hilltop at sunset',
    ],
    'people-portraits': [
      'a person reading by a window',
      'hands cradling a warm cup of coffee',
      'a musician lost in their instrument',
      'a child blowing dandelion seeds',
      'an elderly person with kind, weathered hands',
      'a dancer mid-movement',
      'a person gazing out at the rain',
      'a gardener kneeling in the dirt',
      'a face half-lit by candlelight',
      'a person laughing with their whole body',
    ],
    'still-life': [
      'a worn pair of shoes by the door',
      'a stack of old books and a reading lamp',
      'a window sill with potted herbs',
      'a collection of seashells on a plate',
      'an open sketchbook beside a cup of tea',
      'a glass bottle catching the afternoon light',
      'a bowl of lemons on a linen cloth',
      'a vintage camera on a wooden shelf',
      'keys and pocket treasures on a table',
      'a jar of paintbrushes beside a palette',
    ],
    'abstract': [
      'the feeling of a deep breath on a cold morning',
      'overlapping shapes that suggest movement and rhythm',
      'the energy of a thunderstorm',
      'a conversation between warm and cool colors',
      'the quiet tension between order and chaos',
      'layers that reveal and conceal',
      'the space between two musical notes',
      'shadows cast by something unseen',
      'the ripple effect of a single drop of water',
      'a memory dissolving at the edges',
    ],
    'urban': [
      'a rain-slicked city street at night',
      'a corner cafe with chairs stacked outside',
      'laundry hanging between apartment buildings',
      'a neon sign glowing in a foggy alley',
      'a street musician playing to passersby',
      'a fire escape draped in morning light',
      'an old bicycle chained to a railing',
      'a bustling farmers market stall',
      'a quiet park bench under a streetlamp',
      'a row of brownstones in golden hour light',
    ],
    'botanicals': [
      'a single peony in full bloom',
      'a fern unfurling its first frond',
      'a cluster of wildflowers in a mason jar',
      'a succulent with morning dew drops',
      'dried lavender tied with twine',
      'a vine creeping along a garden wall',
      'a sunflower turning toward the light',
      'mushrooms growing on a mossy log',
      'a branch of cherry blossoms',
      'autumn leaves in shades of amber and rust',
    ],
    'fantasy': [
      'a hidden door in the roots of an ancient tree',
      'a lantern-lit path through an enchanted forest',
      'a floating island above the clouds',
      'a dragon curled around a tower',
      'a magical garden that glows at dusk',
      'a ship sailing across a sky full of stars',
      'a crystal cave reflecting prismatic light',
      'a wizard\'s cluttered study',
      'a bridge made of woven moonlight',
      'a creature emerging from the morning mist',
    ],
    'food': [
      'a rustic loaf of bread, freshly sliced',
      'a bowl of ripe summer berries',
      'a steaming cup of cocoa with marshmallows',
      'a farmers market display of heirloom tomatoes',
      'a slice of pie on a vintage plate',
      'a cheese board with figs and honey',
      'a citrus fruit cut open, catching the light',
      'a plate of pasta twirled on a fork',
      'a stack of pancakes dripping with syrup',
      'a basket of fresh-picked apples',
    ],
    'architecture': [
      'a grand staircase spiraling upward',
      'a crumbling stone archway overgrown with ivy',
      'a cathedral window casting colored light',
      'a cozy front porch with a rocking chair',
      'a lighthouse perched on a rocky coast',
      'a wooden covered bridge over a stream',
      'an ornate iron balcony in an old city',
      'a barn weathered silver by years of sun',
      'a row of columns in a classical ruin',
      'a tiny cottage with a thatched roof',
    ],
    'patterns': [
      'the intricate veins of a leaf held to the light',
      'ripples radiating across still water',
      'the scales of a pinecone, up close',
      'honeycomb cells in golden wax',
      'the bark of a birch tree, peeling in layers',
      'frost crystals forming on a cold window',
      'the repeating arches of a Roman aqueduct',
      'tessellating tiles in a Moorish courtyard',
      'the spiral of a nautilus shell',
      'woven fabric threads at macro scale',
    ],
    'mythology': [
      'Icarus moments before the fall',
      'a phoenix rising from glowing embers',
      'Medusa\'s gaze turned toward the viewer',
      'a centaur galloping through a forest',
      'the Minotaur\'s labyrinth from above',
      'Athena\'s owl perched on an olive branch',
      'a siren singing from the rocks',
      'Thor\'s hammer amid a lightning storm',
      'a Japanese kitsune under a full moon',
      'Anubis weighing a feather against a heart',
    ],
  };

  const mediumLabel = mediumLabels[medium] || medium;
  const variations = subjectVariations[subject];
  const subjectLabel = variations
    ? variations[Math.floor(Math.random() * variations.length)]
    : subject;

  let text = template.template
    .replace('{medium}', mediumLabel)
    .replace('{subject}', subjectLabel);

  // Fix a/an: "a ink" → "an ink", "a oil paint" → "an oil paint", etc.
  text = text.replace(/\b(a) ([aeiou])/gi, (_match, article, vowel) => {
    const an = article[0] === 'A' ? 'An' : 'an';
    return `${an} ${vowel}`;
  });

  return text;
}

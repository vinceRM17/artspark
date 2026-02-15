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

  // Drawing mediums
  { template: "Draw {subject} using {medium} — make it as colorful as you want!", tier: 'kids', mediums: ['pencil', 'charcoal', 'ink', 'pastel'] },
  { template: "Can you draw {subject} with {medium}? Add your own fun details!", tier: 'kids', mediums: ['pencil', 'charcoal', 'ink', 'pastel'] },
  { template: "Grab your {medium} and draw {subject} — be as creative as you like!", tier: 'kids', mediums: ['pencil', 'charcoal', 'ink', 'pastel'] },
  { template: "Time to get creative! Draw {subject} with {medium} and add a fun background", tier: 'kids', mediums: ['pencil', 'charcoal', 'ink', 'pastel'] },
  { template: "Draw {subject} using {medium} — what colors will you choose?", tier: 'kids', mediums: ['pencil', 'charcoal', 'ink', 'pastel'] },

  // Painting mediums
  { template: "Paint {subject} using {medium} — make it as colorful as you want!", tier: 'kids', mediums: ['watercolor', 'oil', 'acrylic', 'gouache'] },
  { template: "Can you paint {subject} with {medium}? Add your own fun details!", tier: 'kids', mediums: ['watercolor', 'oil', 'acrylic', 'gouache'] },
  { template: "Grab your {medium} and paint {subject} — be as creative as you like!", tier: 'kids', mediums: ['watercolor', 'oil', 'acrylic', 'gouache'] },
  { template: "Time to get creative! Paint {subject} with {medium} and add a fun background", tier: 'kids', mediums: ['watercolor', 'oil', 'acrylic', 'gouache'] },
  { template: "Paint {subject} using {medium} — what colors will you choose?", tier: 'kids', mediums: ['watercolor', 'oil', 'acrylic', 'gouache'] },

  // Photography
  { template: "Photograph {subject} — try to capture it in a fun and surprising way!", tier: 'kids', mediums: ['photography'] },
  { template: "Grab your camera and shoot {subject} — what makes it interesting to you?", tier: 'kids', mediums: ['photography'] },

  // Universal (verb-neutral — works for any medium)
  { template: "Use {medium} to create {subject} — there's no wrong way to do it!", tier: 'kids' },
  { template: "Let's make art! Create {subject} with {medium} and see what happens", tier: 'kids' },
  { template: "Today's art adventure: create {subject} using {medium}!", tier: 'kids' },
  { template: "Imagine {subject} and bring it to life with {medium}!", tier: 'kids' },
  { template: "Use {medium} to create {subject} — make it your own!", tier: 'kids' },

  // === GUIDED TIER (Explorer) — encouraging, with simple tips ===

  // Watercolor guided
  { template: "Sketch {subject} lightly in pencil first, then paint over it with {medium} — start with the lightest colors and build up", tier: 'guided', mediums: ['watercolor'] },
  { template: "Paint {subject} with {medium} — try wetting the paper first for soft, dreamy edges", tier: 'guided', mediums: ['watercolor', 'gouache'] },

  // Drawing guided
  { template: "Draw {subject} with {medium} — start with simple shapes like circles and ovals, then add details on top", tier: 'guided', mediums: ['pencil', 'charcoal'] },
  { template: "Try drawing {subject} with {medium}: do a quick 30-second version first, then a slower, more careful one", tier: 'guided', mediums: ['pencil', 'charcoal', 'ink'] },

  // Painting guided
  { template: "Paint {subject} with {medium} using big brushstrokes first — fill the whole canvas with color before adding any details", tier: 'guided', mediums: ['acrylic', 'oil', 'gouache'] },

  // Digital guided
  { template: "Create {subject} digitally — start with a rough sketch on one layer, then add color on a layer underneath", tier: 'guided', mediums: ['digital'] },

  // Photography guided
  { template: "Photograph {subject} — try framing it from three different angles and pick your favorite", tier: 'guided', mediums: ['photography'] },
  { template: "Capture {subject} with your camera — pay attention to where the light is coming from", tier: 'guided', mediums: ['photography'] },
  { template: "Photograph {subject} — try getting closer than you think you should, then take a step back and compare", tier: 'guided', mediums: ['photography'] },

  // Universal guided
  { template: "Create {subject} with {medium} today — close your eyes and picture it for a moment before you begin", tier: 'guided' },
  { template: "Create {subject} with {medium} — start with the biggest shapes first, then work your way to smaller details", tier: 'guided' },
  { template: "Create {subject} using {medium} — don't worry about making it perfect, just enjoy the process", tier: 'guided' },
  { template: "Create {subject} with {medium} — use a reference photo to study the shapes before you start", tier: 'guided' },

  // Subject-specific guided
  { template: "Create {subject} with {medium} — notice where the light is coming from and make one side a little darker", tier: 'guided', subjects: ['animals', 'people-portraits', 'still-life', 'botanicals', 'food'] },
  { template: "Create {subject} with {medium} — use your fingers to frame the scene and find the most interesting view before you start", tier: 'guided', subjects: ['landscapes', 'urban', 'architecture'] },

  // === STANDARD TIER (Developing/Confident) — clear direction, no jargon ===

  // Watercolor
  { template: "Paint {subject} with {medium}, letting the water move the paint in unexpected ways", tier: 'standard', mediums: ['watercolor'] },
  { template: "Create {subject} with {medium} — keep it loose and focus on the feeling, not the details", tier: 'standard', mediums: ['watercolor', 'gouache'] },
  { template: "Paint {subject} with {medium}, building up from light colors to dark", tier: 'standard', mediums: ['watercolor'] },

  // Pencil / Charcoal / Ink
  { template: "Draw {subject} with {medium}, focusing on the contrast between light and shadow", tier: 'standard', mediums: ['pencil', 'charcoal', 'ink'] },
  { template: "Draw {subject} using only {medium} — see how much you can express with just light and dark", tier: 'standard', mediums: ['pencil', 'charcoal'] },
  { template: "Sketch {subject} with {medium} — go for energy and feeling over perfection", tier: 'standard', mediums: ['pencil', 'charcoal', 'ink'] },
  { template: "Draw {subject} with {medium}, paying attention to where the edges are sharp and where they fade away", tier: 'standard', mediums: ['pencil', 'charcoal'] },

  // Oil / Acrylic
  { template: "Paint {subject} with {medium}, using bold and confident brushstrokes", tier: 'standard', mediums: ['oil', 'acrylic'] },
  { template: "Create {subject} with {medium} — experiment with thick and thin layers of paint", tier: 'standard', mediums: ['oil', 'acrylic'] },
  { template: "Paint {subject} with {medium} — start with big areas of color, then add detail where it matters most", tier: 'standard', mediums: ['oil', 'acrylic', 'gouache'] },

  // Digital
  { template: "Create {subject} digitally — focus on the overall shape and silhouette first", tier: 'standard', mediums: ['digital'] },
  { template: "Create {subject} digitally, limiting yourself to just 3-4 brushes", tier: 'standard', mediums: ['digital'] },

  // Collage / Mixed Media
  { template: "Create {subject} with {medium}, combining different textures and materials", tier: 'standard', mediums: ['collage', 'mixed-media', 'paper-art'] },
  { template: "Build {subject} with {medium} — let unexpected combinations surprise you", tier: 'standard', mediums: ['collage', 'mixed-media'] },

  // Subject-specific
  { template: "Create {subject} with {medium} — notice how the light falls and let that guide you", tier: 'standard', subjects: ['animals', 'people-portraits', 'still-life', 'botanicals', 'food'] },
  { template: "Create {subject} with {medium} — try to capture the mood and atmosphere", tier: 'standard', subjects: ['landscapes', 'urban', 'architecture'] },
  { template: "Interpret {subject} with {medium} — let the colors and shapes express the feeling", tier: 'standard', subjects: ['abstract', 'patterns'] },
  { template: "Bring {subject} to life with {medium} — tell a story with your piece", tier: 'standard', subjects: ['mythology', 'fantasy'] },
  { template: "Create {subject} with {medium} — focus on the textures and surfaces you see", tier: 'standard', subjects: ['still-life', 'food', 'botanicals'] },
  { template: "Capture {subject} with {medium} — what makes this moment special?", tier: 'standard', subjects: ['animals', 'people-portraits'] },
  { template: "Create {subject} with {medium} — play with what's close up and what's far away", tier: 'standard', subjects: ['landscapes', 'urban', 'architecture', 'botanicals'] },

  // Photography
  { template: "Photograph {subject}, focusing on composition and the interplay of light and shadow", tier: 'standard', mediums: ['photography'] },
  { template: "Shoot {subject} with intention — find the angle that tells the most compelling story", tier: 'standard', mediums: ['photography'] },
  { template: "Capture {subject} — experiment with depth of field to draw the viewer's eye", tier: 'standard', mediums: ['photography'] },
  { template: "Photograph {subject} at an unexpected time of day — how does the light change the mood?", tier: 'standard', mediums: ['photography'] },

  // Universal standard
  { template: "Create {subject} with {medium} — focus on what catches your eye first", tier: 'standard' },
  { template: "Create {subject} with {medium} — take a moment to really look before you begin", tier: 'standard' },
  { template: "Interpret {subject} with {medium} — bring your own perspective to it", tier: 'standard' },
  { template: "Create {subject} with {medium}, trusting your instincts today", tier: 'standard' },
  { template: "Explore {subject} with {medium} — what do you notice that others might miss?", tier: 'standard' },

  // === OPEN TIER (Master) — concise, assumes skill ===

  { template: "{subject}. {medium}. Your interpretation", tier: 'open' },
  { template: "Reimagine {subject} through {medium} — find what's unexpected", tier: 'open' },
  { template: "Create {subject} with {medium} — focus on the spaces in between", tier: 'open' },
  { template: "Reinterpret {subject} with {medium} — break one rule on purpose", tier: 'open' },
  { template: "{subject} in {medium}. Give yourself just 30 minutes", tier: 'open' },
  { template: "{subject} with {medium} — explore the tension between control and chance", tier: 'open' },
  { template: "Distill {subject} to its essence using {medium}", tier: 'open' },

  // Medium-specific open
  { template: "{subject} — one frame, no editing. Capture it in-camera", tier: 'open', mediums: ['photography'] },
  { template: "Photograph {subject} — find the light that makes it extraordinary", tier: 'open', mediums: ['photography'] },
  { template: "{subject}. One lens. Tell the whole story in a single shot", tier: 'open', mediums: ['photography'] },
  { template: "{subject} — push your {medium} between very wet and very dry", tier: 'open', mediums: ['watercolor', 'ink'] },
  { template: "{subject} with {medium} — contrast thick, heavy strokes with thin, delicate ones", tier: 'open', mediums: ['oil', 'acrylic'] },
  { template: "{subject} with {medium}. One continuous line, no lifting", tier: 'open', mediums: ['pencil', 'ink', 'charcoal'] },
  { template: "Layer, cover, and reveal: {subject} with {medium}", tier: 'open', mediums: ['collage', 'mixed-media'] },
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
    'charcoal': 'charcoal', 'mixed-media': 'mixed media', 'photography': 'photography',
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

  // Fix a/an: "a ink" → "an ink", "a oil paint" → "an oil paint"
  // Only match "a" followed by a vowel-starting word of 2+ chars (avoids "a a" → "an a")
  text = text.replace(/\b(a) ([aeiou]\w)/gi, (_match, article, rest) => {
    const an = article[0] === 'A' ? 'An' : 'an';
    return `${an} ${rest}`;
  });

  return text;
}

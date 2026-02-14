/**
 * Prompt templates — artistically meaningful prompt text generation
 *
 * Each template provides specific artistic direction that makes sense
 * for the given medium + subject combination. Templates use {medium}
 * and {subject} placeholders.
 */

type PromptTemplate = {
  template: string;
  mediums?: string[]; // If set, only use with these mediums. Otherwise universal.
  subjects?: string[]; // If set, only use with these subjects. Otherwise universal.
};

const TEMPLATES: PromptTemplate[] = [
  // --- Watercolor-specific ---
  { template: "Paint a {subject} study in {medium}, letting the water guide your washes", mediums: ['watercolor'] },
  { template: "Create a loose {medium} {subject} sketch — capture the essence, not the details", mediums: ['watercolor', 'gouache'] },
  { template: "Explore {subject} in {medium}, building from light to dark in transparent layers", mediums: ['watercolor'] },

  // --- Pencil / Charcoal / Ink ---
  { template: "Draw {subject} in {medium}, focusing on the interplay of light and shadow", mediums: ['pencil', 'charcoal', 'ink'] },
  { template: "Create a {medium} study of {subject} using value alone to define form", mediums: ['pencil', 'charcoal'] },
  { template: "Sketch {subject} in {medium} — aim for gesture and feeling over precision", mediums: ['pencil', 'charcoal', 'ink'] },
  { template: "Render {subject} in {medium}, paying close attention to edges — where they're sharp, where they're lost", mediums: ['pencil', 'charcoal'] },

  // --- Oil / Acrylic ---
  { template: "Paint {subject} in {medium}, building up color with bold, confident strokes", mediums: ['oil', 'acrylic'] },
  { template: "Create a {medium} {subject} piece, exploring how thick and thin paint create texture", mediums: ['oil', 'acrylic'] },
  { template: "Paint {subject} in {medium} — block in large shapes first, then refine selectively", mediums: ['oil', 'acrylic', 'gouache'] },

  // --- Digital ---
  { template: "Create a {medium} {subject} piece exploring shape language and silhouette", mediums: ['digital'] },
  { template: "Design {subject} digitally, using a limited brush set to unify the piece", mediums: ['digital'] },

  // --- Collage / Mixed Media ---
  { template: "Compose {subject} in {medium}, combining found textures and materials", mediums: ['collage', 'mixed-media', 'paper-art'] },
  { template: "Create a {medium} {subject} piece — let unexpected material combinations tell the story", mediums: ['collage', 'mixed-media'] },

  // --- Subject-specific (any medium) ---
  { template: "Study {subject} in {medium} — observe how the form catches light from a single source", subjects: ['animals', 'people-portraits', 'still-life', 'botanicals', 'food'] },
  { template: "Create a {medium} {subject} piece that captures atmosphere and depth", subjects: ['landscapes', 'urban', 'architecture'] },
  { template: "Interpret {subject} in {medium}, emphasizing rhythm and visual flow", subjects: ['abstract', 'patterns'] },
  { template: "Explore {subject} in {medium} — tell a story through composition and detail", subjects: ['mythology', 'fantasy'] },
  { template: "Render {subject} in {medium}, focusing on the textures and surfaces you observe", subjects: ['still-life', 'food', 'botanicals'] },
  { template: "Capture the character of {subject} in {medium} — what makes this subject unique?", subjects: ['animals', 'people-portraits'] },
  { template: "Create a {medium} study of {subject} that plays with foreground and background relationships", subjects: ['landscapes', 'urban', 'architecture', 'botanicals'] },
  { template: "Express {subject} in {medium} through shapes and gesture rather than literal detail", subjects: ['abstract', 'fantasy', 'mythology'] },

  // --- Universal (any medium + any subject) ---
  { template: "Create a {medium} piece inspired by {subject} — focus on what draws your eye first" },
  { template: "Study {subject} in {medium}, taking time to really observe before you begin" },
  { template: "Interpret {subject} through {medium} — bring your own perspective to the subject" },
  { template: "Explore {subject} in {medium}, paying attention to the shapes between objects" },
  { template: "Create {subject} in {medium}, challenging yourself to work more intuitively today" },
];

/**
 * Get a random prompt template that's compatible with the given medium and subject
 */
export function getPromptTemplate(medium: string, subject: string): string {
  // Find templates that match this medium+subject combo
  const compatible = TEMPLATES.filter(t => {
    const mediumOk = !t.mediums || t.mediums.includes(medium);
    const subjectOk = !t.subjects || t.subjects.includes(subject);
    return mediumOk && subjectOk;
  });

  // Pick random template
  const template = compatible[Math.floor(Math.random() * compatible.length)];

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

/**
 * Medium definitions with materials lists and tutorial links
 *
 * Each medium includes a description, required materials, and curated
 * beginner tutorial links (YouTube + written guides).
 */

export type TutorialLink = {
  title: string;
  url: string;
};

export type MediumInfo = {
  id: string;
  label: string;
  description: string;
  materialsNeeded: string[];
  tutorialLinks: TutorialLink[];
};

export const MEDIUM_INFO: Record<string, MediumInfo> = {
  watercolor: {
    id: 'watercolor',
    label: 'Watercolor',
    description: 'Transparent paint applied in washes, building from light to dark. Known for luminous, flowing effects.',
    materialsNeeded: [
      'Watercolor pan or tube set',
      'Watercolor paper (140lb / 300gsm)',
      'Round brushes (#6, #10)',
      'Palette for mixing',
      'Water containers (2)',
      'Paper towels or rag',
    ],
    tutorialLinks: [
      { title: 'Watercolor Basics for Beginners', url: 'https://www.youtube.com/watch?v=fMq0yQ5V7Hs' },
      { title: 'How to Paint with Watercolors', url: 'https://www.wikihow.com/Paint-With-Watercolors' },
    ],
  },
  gouache: {
    id: 'gouache',
    label: 'Gouache',
    description: 'Opaque watercolor that dries matte. Great for bold, flat color work and illustration.',
    materialsNeeded: [
      'Gouache paint set (primary colors + white)',
      'Watercolor or mixed-media paper',
      'Flat and round brushes',
      'Palette for mixing',
      'Water container',
    ],
    tutorialLinks: [
      { title: 'Gouache Painting for Beginners', url: 'https://www.youtube.com/watch?v=Ex31ln_xGTY' },
      { title: 'Complete Beginner Guide to Gouache', url: 'https://www.artistsnetwork.com/art-mediums/gouache-painting/' },
    ],
  },
  acrylic: {
    id: 'acrylic',
    label: 'Acrylic',
    description: 'Fast-drying, versatile paint that can mimic both watercolor and oil techniques.',
    materialsNeeded: [
      'Acrylic paint set (6-12 colors)',
      'Canvas or canvas board',
      'Flat and round brushes (synthetic)',
      'Palette (stay-wet palette recommended)',
      'Water container',
      'Paper towels',
    ],
    tutorialLinks: [
      { title: 'Acrylic Painting for Beginners', url: 'https://www.youtube.com/watch?v=oCBkMpuWtUU' },
      { title: 'How to Paint with Acrylics', url: 'https://www.wikihow.com/Paint-With-Acrylics' },
    ],
  },
  oil: {
    id: 'oil',
    label: 'Oil Paint',
    description: 'Rich, slow-drying paint with deep color and smooth blending. The classic fine art medium.',
    materialsNeeded: [
      'Oil paint set (6+ colors)',
      'Primed canvas or canvas board',
      'Hog bristle brushes (flats, rounds)',
      'Palette knife',
      'Odorless mineral spirits or walnut oil',
      'Palette (wood or glass)',
      'Rags or paper towels',
    ],
    tutorialLinks: [
      { title: 'Bob Ross - Happy Little Trees', url: 'https://www.youtube.com/watch?v=lLWEXRAnQd0' },
      { title: 'Oil Painting Basics for Beginners', url: 'https://www.youtube.com/watch?v=wnhVZGBpngQ' },
    ],
  },
  pencil: {
    id: 'pencil',
    label: 'Pencil',
    description: 'Graphite drawing, from light sketches to highly detailed renderings. The most accessible medium.',
    materialsNeeded: [
      'Drawing pencils (HB, 2B, 4B, 6B)',
      'Sketchbook or drawing paper',
      'Eraser (kneaded + vinyl)',
      'Sharpener',
      'Blending stump (optional)',
    ],
    tutorialLinks: [
      { title: 'Drawing Fundamentals - Proko', url: 'https://www.youtube.com/watch?v=1EPNYWeEf1U' },
      { title: 'How to Draw for Beginners', url: 'https://www.wikihow.com/Draw' },
    ],
  },
  ink: {
    id: 'ink',
    label: 'Ink',
    description: 'Bold, permanent marks with pens or brushes. Great for line work, cross-hatching, and washes.',
    materialsNeeded: [
      'Fine-tip pens (0.1, 0.3, 0.5mm)',
      'India ink and dip pen or brush (optional)',
      'Smooth drawing paper or Bristol board',
      'Pencil for light underdrawing',
      'Eraser',
    ],
    tutorialLinks: [
      { title: 'Ink Drawing for Beginners - Alphonso Dunn', url: 'https://www.youtube.com/watch?v=KsNmIJlGVEo' },
      { title: 'How to Draw with Ink', url: 'https://www.wikihow.com/Draw-With-Ink' },
    ],
  },
  digital: {
    id: 'digital',
    label: 'Digital',
    description: 'Art created on tablet or computer. Infinite undo, layers, and brushes at your fingertips.',
    materialsNeeded: [
      'Tablet (iPad, Wacom, etc.)',
      'Drawing app (Procreate, Clip Studio, Krita)',
      'Stylus or pen',
    ],
    tutorialLinks: [
      { title: 'Procreate for Beginners - Art with Flo', url: 'https://www.youtube.com/watch?v=jhRY-_BIYBI' },
      { title: 'Digital Art for Beginners', url: 'https://www.youtube.com/watch?v=7QLXGX_3kqE' },
    ],
  },
  collage: {
    id: 'collage',
    label: 'Collage',
    description: 'Assembling found materials — paper, photos, fabric — into unified compositions.',
    materialsNeeded: [
      'Scissors and/or craft knife',
      'Glue stick or matte medium',
      'Found materials (magazines, paper, fabric)',
      'Heavy paper or cardboard base',
      'Ruler (optional)',
    ],
    tutorialLinks: [
      { title: 'Collage Art for Beginners', url: 'https://www.youtube.com/watch?v=1cKGiSd-mDQ' },
      { title: 'How to Make a Collage', url: 'https://www.wikihow.com/Make-a-Collage' },
    ],
  },
  'paper-art': {
    id: 'paper-art',
    label: 'Paper Art',
    description: 'Three-dimensional art from paper — origami, paper cutting, quilling, and sculptural forms.',
    materialsNeeded: [
      'Colored or textured paper',
      'Scissors and craft knife',
      'Cutting mat',
      'Bone folder (for crisp folds)',
      'Glue',
      'Ruler',
    ],
    tutorialLinks: [
      { title: 'Paper Cutting Art for Beginners', url: 'https://www.youtube.com/watch?v=ydHRESPlCOE' },
      { title: 'How to Do Paper Art', url: 'https://www.wikihow.com/Make-Paper-Art' },
    ],
  },
  pastel: {
    id: 'pastel',
    label: 'Pastel',
    description: 'Dry sticks of pure pigment for vibrant, velvety color. Blend with fingers or tools.',
    materialsNeeded: [
      'Soft pastels (set of 24+)',
      'Pastel paper (toned, textured)',
      'Blending stumps or fingers',
      'Fixative spray',
      'Paper towels or baby wipes',
    ],
    tutorialLinks: [
      { title: 'Pastel Painting for Beginners', url: 'https://www.youtube.com/watch?v=XT6MZFBDnp8' },
      { title: 'How to Use Pastels', url: 'https://www.wikihow.com/Use-Pastels' },
    ],
  },
  charcoal: {
    id: 'charcoal',
    label: 'Charcoal',
    description: 'Rich, dark marks with dramatic value range. Perfect for expressive, gestural drawing.',
    materialsNeeded: [
      'Vine charcoal (thin sticks)',
      'Compressed charcoal (for darks)',
      'Charcoal pencil',
      'Newsprint or charcoal paper',
      'Kneaded eraser',
      'Fixative spray',
    ],
    tutorialLinks: [
      { title: 'Charcoal Drawing for Beginners', url: 'https://www.youtube.com/watch?v=0OvIuicNnOk' },
      { title: 'How to Draw with Charcoal', url: 'https://www.wikihow.com/Draw-With-Charcoal' },
    ],
  },
  'mixed-media': {
    id: 'mixed-media',
    label: 'Mixed Media',
    description: 'Combining multiple materials in one piece — paint, paper, found objects, ink, and more.',
    materialsNeeded: [
      'Mixed media paper or canvas',
      'Assorted paints (acrylic works best)',
      'Collage materials',
      'Gel medium or glue',
      'Various mark-making tools',
      'Scissors, craft knife',
    ],
    tutorialLinks: [
      { title: 'Mixed Media Art for Beginners', url: 'https://www.youtube.com/watch?v=rW1VFJRsJDM' },
      { title: 'How to Create Mixed Media Art', url: 'https://www.wikihow.com/Create-Mixed-Media-Art' },
    ],
  },
};

/**
 * Get medium info by ID
 * Returns undefined for custom mediums (custom:xxx)
 */
export function getMediumInfo(id: string): MediumInfo | undefined {
  return MEDIUM_INFO[id];
}

/**
 * Get tutorial links for a medium
 * Returns empty array for unknown/custom mediums
 */
export function getTutorialLinks(mediumId: string): TutorialLink[] {
  return MEDIUM_INFO[mediumId]?.tutorialLinks || [];
}

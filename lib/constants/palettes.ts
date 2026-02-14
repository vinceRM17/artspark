/**
 * Color palette definitions with visual hex swatches
 *
 * Each palette includes a description and 4-5 hex colors
 * for rendering visual swatch previews.
 */

export type PaletteInfo = {
  id: string;
  label: string;
  description: string;
  hexColors: string[];
};

export const PALETTE_INFO: Record<string, PaletteInfo> = {
  earthy: {
    id: 'earthy',
    label: 'Earthy',
    description: 'Warm browns, greens, and golds inspired by nature',
    hexColors: ['#8B7355', '#A0522D', '#6B8E23', '#DAA520', '#F5DEB3'],
  },
  vibrant: {
    id: 'vibrant',
    label: 'Vibrant',
    description: 'Bold, saturated colors that pop off the page',
    hexColors: ['#FF1493', '#00BFFF', '#FFD700', '#32CD32', '#FF6347'],
  },
  monochrome: {
    id: 'monochrome',
    label: 'Monochrome',
    description: 'Single-hue work using values from light to dark',
    hexColors: ['#1A1A1A', '#4D4D4D', '#808080', '#B3B3B3', '#E6E6E6'],
  },
  pastels: {
    id: 'pastels',
    label: 'Pastels',
    description: 'Soft, light-washed tones with gentle contrast',
    hexColors: ['#FFB6C1', '#B0E0E6', '#FFDAB9', '#D8BFD8', '#98FB98'],
  },
  complementary: {
    id: 'complementary',
    label: 'Complementary',
    description: 'Opposite colors on the wheel for maximum contrast',
    hexColors: ['#FF6347', '#4682B4', '#FFD700', '#6A5ACD'],
  },
  warm: {
    id: 'warm',
    label: 'Warm',
    description: 'Reds, oranges, and yellows for energy and warmth',
    hexColors: ['#FF6347', '#FF8C00', '#FFD700', '#FF4500', '#DC143C'],
  },
  cool: {
    id: 'cool',
    label: 'Cool',
    description: 'Blues, greens, and purples for calm and depth',
    hexColors: ['#4169E1', '#2E8B57', '#7B68EE', '#20B2AA', '#6495ED'],
  },
  'random-ok': {
    id: 'random-ok',
    label: "I'm okay with any",
    description: "We'll surprise you with any palette",
    hexColors: ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#9370DB'],
  },
};

/**
 * Get palette info by ID
 */
export function getPaletteInfo(id: string): PaletteInfo | undefined {
  return PALETTE_INFO[id];
}

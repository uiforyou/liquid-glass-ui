// Liquid Glass Design Tokens

export const GLASS_TOKENS = {
  // Material variants
  regular: {
    background: 'rgba(28, 28, 30, 0.72)',
    backdropBlur: '26px',
    backdropSaturate: '160%',
    backdropBrightness: '95%',
    tint: 'rgba(18, 18, 20, 0.55)',
  },
  clear: {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropBlur: '20px',
    backdropSaturate: '180%',
    backdropBrightness: '105%',
    tint: 'rgba(255, 255, 255, 0.04)',
  },

  // Optical edges: Hairline + Specular Directional Highlight
  edge: {
    // 180deg vertical light falloff: brighter at top edge, translucent at sides, subtle at bottom
    hairlineGradient: 'linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 45%, rgba(255, 255, 255, 0.03) 100%)',
    hairlineWidth: '1px',
    innerHighlight: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 0 rgba(0, 0, 0, 0.35)',
    curvedGlow: '0 0 0 1px rgba(255, 255, 255, 0.06)',
  },

  // Elevation Shadows: Separation without muddy wide black blur
  shadow: {
    floatingInput: '0 8px 32px rgba(0, 0, 0, 0.36), 0 2px 6px rgba(0, 0, 0, 0.45)',
    floatingButton: '0 4px 20px rgba(0, 0, 0, 0.28), 0 1px 3px rgba(0, 0, 0, 0.35)',
    sidebar: '12px 0 40px rgba(0, 0, 0, 0.55)',
    popover: '0 12px 36px rgba(0, 0, 0, 0.42), 0 2px 8px rgba(0, 0, 0, 0.38)',
  },

  // Optical Refraction defaults
  optics: {
    ior: 1.48,             // Glass Index of Refraction
    dispersion: 0.04,      // Chromatic fringing near high curvature
    bevelDepth: 18,        // Pixel depth of refractive curve
    refractStrength: 1.2,
  },

  // Geometry
  geometry: {
    pillRadius: '9999px',
    cardRadius: '24px',
    popoverRadius: '20px',
    sidebarRadius: '0 28px 28px 0',
  }
};

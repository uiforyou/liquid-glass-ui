// Liquid Glass Physical & Optical Design Tokens

export const GLASS_TOKENS = {
  optics: {
    ior: 1.88,
    dispersion: 0.085,
    bevelHeight: 30,
    thickness: 8,
    absorption: 0.035,
    fresnelF0: 0.04
  },
  hairline: {
    gradient: 'linear-gradient(180deg, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.03) 100%)',
    innerHighlight: 'inset 0 1px 0 rgba(255, 255, 255, 0.22), inset 0 -1px 0 rgba(0, 0, 0, 0.35)',
    shadow: '0 20px 60px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.35)'
  }
};

// 3D Vector Snell's Law & Liquid Glass Optical Raytracer Engine

export interface RaytracerBody {
  id: string;
  cx: number;
  cy: number;
  halfW: number;
  halfH: number;
  r: number;
  bevelHeight?: number;
  thickness?: number;
  ior?: number;
  dispersion?: number;
  specularMultiplier?: number;
  blackTint?: number; // 0.0 to 1.0 deep optical smoked glass tint
  blurRadius?: number; // 0 = crystal clear liquid, 1-2 = gentle optical frost
}

export interface RaytracerOptions {
  lightDir?: [number, number, number];
  absorption?: number;
  volumetricTint?: [number, number, number];
}

// 3D Vector Snell's Law Refraction: T = eta * I + (eta * cosI - cosT) * N
export function refractRay(
  I: [number, number, number],
  N: [number, number, number],
  eta: number
): [number, number, number] | null {
  const cosI = -(I[0] * N[0] + I[1] * N[1] + I[2] * N[2]);
  const sinT2 = eta * eta * (1.0 - cosI * cosI);
  if (sinT2 > 1.0) return null; // Total Internal Reflection (TIR)
  const cosT = Math.sqrt(1.0 - sinT2);
  return [
    eta * I[0] + (eta * cosI - cosT) * N[0],
    eta * I[1] + (eta * cosI - cosT) * N[1],
    eta * I[2] + (eta * cosI - cosT) * N[2]
  ];
}

// Signed Distance to a 2D Capsule / Pill / Rounded Box
export function sdPill(x: number, y: number, halfW: number, halfH: number, r: number): number {
  const dx = halfW - r;
  const dy = halfH - r;
  const qx = Math.max(0, Math.abs(x) - Math.max(0, dx));
  const qy = Math.max(0, Math.abs(y) - Math.max(0, dy));
  return Math.hypot(qx, qy) - r;
}

// Subpixel Bilinear Interpolator
export function sampleBilinear(
  pixels: Uint8ClampedArray,
  W: number,
  H: number,
  px: number,
  py: number,
  c: number
): number {
  const sx = px < 0 ? 0 : px >= W - 1 ? W - 1.001 : px;
  const sy = py < 0 ? 0 : py >= H - 1 ? H - 1.001 : py;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const fx = sx - x0;
  const fy = sy - y0;

  const idx00 = (y0 * W + x0) * 4 + c;
  const idx10 = (y0 * W + x1) * 4 + c;
  const idx01 = (y1 * W + x0) * 4 + c;
  const idx11 = (y1 * W + x1) * 4 + c;

  const top = pixels[idx00] * (1 - fx) + pixels[idx10] * fx;
  const bot = pixels[idx01] * (1 - fx) + pixels[idx11] * fx;
  return top * (1 - fy) + bot * fy;
}

// Render all registered glass bodies onto output ImageData
export function renderLiquidGlassFrame(
  outPixels: Uint8ClampedArray,
  bgPixels: Uint8ClampedArray,
  W: number,
  H: number,
  bodies: RaytracerBody[],
  options: RaytracerOptions = {}
) {
  // Eye vector looking down -Z axis
  const eyeDir: [number, number, number] = [0, 0, -1];
  
  // Overhead directional light
  const lightDir = options.lightDir || [-0.45, -0.75, 0.48];
  const lLen = Math.hypot(...lightDir) || 1;
  const normLight: [number, number, number] = [lightDir[0] / lLen, lightDir[1] / lLen, lightDir[2] / lLen];

  const baseAbsorption = options.absorption ?? 0.035;

  for (const body of bodies) {
    const {
      cx,
      cy,
      halfW,
      halfH,
      r,
      bevelHeight = 28,
      thickness = 8,
      ior = 1.88,
      dispersion = 0.085,
      specularMultiplier = 1.0,
      blackTint = 0.0,
      blurRadius = 0.0
    } = body;

    const minX = Math.max(0, Math.floor(cx - halfW - 8));
    const maxX = Math.min(W - 1, Math.ceil(cx + halfW + 8));
    const minY = Math.max(0, Math.floor(cy - halfH - 8));
    const maxY = Math.min(H - 1, Math.ceil(cy + halfH + 8));

    // Cauchy indices for Green, Red, and Blue channels
    const etaG = 1.0 / ior;
    const etaR = 1.0 / (ior - dispersion);
    const etaB = 1.0 / (ior + dispersion);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const rx = x - cx;
        const ry = y - cy;

        const dist = sdPill(rx, ry, halfW, halfH, r);
        if (dist > 0) continue; // Outside lens boundary

        const outIdx = (y * W + x) * 4;

        // Analytical 2D normal of sdPill (avoids finite difference overhead)
        const dx = halfW - r;
        const dy = halfH - r;
        const ax = Math.abs(rx);
        const ay = Math.abs(ry);
        const qx = Math.max(0, ax - Math.max(0, dx));
        const qy = Math.max(0, ay - Math.max(0, dy));
        const qLen = Math.hypot(qx, qy) || 1;
        const nx2d = (rx < 0 ? -1 : 1) * (qx / qLen);
        const ny2d = (ry < 0 ? -1 : 1) * (qy / qLen);

        const lensMax = halfH;
        const t = Math.min(1.0, Math.max(0.0, (-dist) / lensMax));
        
        // Smooth cubic-bezier-like bevel curve with clamped finite slope at the very boundary
        // When t -> 0 (very edge of lens), smoothstep transition prevents infinite slope & normal spike
        const edgeFactor = Math.min(1.0, (-dist) / 2.0); // 0 at outer perimeter, 1 at 2px inset
        const safeOneMinusT = Math.min(0.992, 1.0 - t);
        const rawSlope = safeOneMinusT / Math.sqrt(1.0 - safeOneMinusT * safeOneMinusT);
        const profileSlope = Math.min(3.5, rawSlope) * edgeFactor;

        // Reconstruct 3D surface normal N = (nx, ny, nz)
        const nz = 1.0;
        const slopeScale = profileSlope * (bevelHeight / lensMax);
        const nx = nx2d * slopeScale;
        const ny = ny2d * slopeScale;
        const nLen = Math.hypot(nx, ny, nz);
        const invNLen = 1.0 / nLen;
        const N: [number, number, number] = [nx * invNLen, ny * invNLen, nz * invNLen];

        // 3D Vector Refraction for R, G, B channels
        const rayR = refractRay(eyeDir, N, etaR);
        const rayG = refractRay(eyeDir, N, etaG);
        const rayB = refractRay(eyeDir, N, etaB);

        const tirDarken = !rayG ? 0.6 : 1.0;
        const distZ = thickness + bevelHeight * (1.0 - t) + 10;

        const hitRx = rayR ? x + (rayR[0] / -rayR[2]) * distZ : x;
        const hitRy = rayR ? y + (rayR[1] / -rayR[2]) * distZ : y;
        const hitGx = rayG ? x + (rayG[0] / -rayG[2]) * distZ : x;
        const hitGy = rayG ? y + (rayG[1] / -rayG[2]) * distZ : y;
        const hitBx = rayB ? x + (rayB[0] / -rayB[2]) * distZ : x;
        const hitBy = rayB ? y + (rayB[1] / -rayB[2]) * distZ : y;

        let red: number;
        let green: number;
        let blue: number;

        if (blurRadius > 0.0) {
          const br = blurRadius;
          const diag = br * 0.707;
          red = (
            sampleBilinear(bgPixels, W, H, hitRx, hitRy, 0) * 0.28 +
            sampleBilinear(bgPixels, W, H, hitRx - br, hitRy, 0) * 0.11 +
            sampleBilinear(bgPixels, W, H, hitRx + br, hitRy, 0) * 0.11 +
            sampleBilinear(bgPixels, W, H, hitRx, hitRy - br, 0) * 0.11 +
            sampleBilinear(bgPixels, W, H, hitRx, hitRy + br, 0) * 0.11 +
            sampleBilinear(bgPixels, W, H, hitRx - diag, hitRy - diag, 0) * 0.07 +
            sampleBilinear(bgPixels, W, H, hitRx + diag, hitRy - diag, 0) * 0.07 +
            sampleBilinear(bgPixels, W, H, hitRx - diag, hitRy + diag, 0) * 0.07 +
            sampleBilinear(bgPixels, W, H, hitRx + diag, hitRy + diag, 0) * 0.07
          );
          green = (
            sampleBilinear(bgPixels, W, H, hitGx, hitGy, 1) * 0.28 +
            sampleBilinear(bgPixels, W, H, hitGx - br, hitGy, 1) * 0.11 +
            sampleBilinear(bgPixels, W, H, hitGx + br, hitGy, 1) * 0.11 +
            sampleBilinear(bgPixels, W, H, hitGx, hitGy - br, 1) * 0.11 +
            sampleBilinear(bgPixels, W, H, hitGx, hitGy + br, 1) * 0.11 +
            sampleBilinear(bgPixels, W, H, hitGx - diag, hitGy - diag, 1) * 0.07 +
            sampleBilinear(bgPixels, W, H, hitGx + diag, hitGy - diag, 1) * 0.07 +
            sampleBilinear(bgPixels, W, H, hitGx - diag, hitGy + diag, 1) * 0.07 +
            sampleBilinear(bgPixels, W, H, hitGx + diag, hitGy + diag, 1) * 0.07
          );
          blue = (
            sampleBilinear(bgPixels, W, H, hitBx, hitBy, 2) * 0.28 +
            sampleBilinear(bgPixels, W, H, hitBx - br, hitBy, 2) * 0.11 +
            sampleBilinear(bgPixels, W, H, hitBx + br, hitBy, 2) * 0.11 +
            sampleBilinear(bgPixels, W, H, hitBx, hitBy - br, 2) * 0.11 +
            sampleBilinear(bgPixels, W, H, hitBx, hitBy + br, 2) * 0.11 +
            sampleBilinear(bgPixels, W, H, hitBx - diag, hitGy - diag, 2) * 0.07 +
            sampleBilinear(bgPixels, W, H, hitBx + diag, hitRy - diag, 2) * 0.07 +
            sampleBilinear(bgPixels, W, H, hitBx - diag, hitRy + diag, 2) * 0.07 +
            sampleBilinear(bgPixels, W, H, hitBx + diag, hitRy + diag, 2) * 0.07
          );
        } else {
          red = sampleBilinear(bgPixels, W, H, hitRx, hitRy, 0);
          green = sampleBilinear(bgPixels, W, H, hitGx, hitGy, 1);
          blue = sampleBilinear(bgPixels, W, H, hitBx, hitBy, 2);
        }

        // Volumetric Beer-Lambert absorption
        const path = distZ / (rayG ? -rayG[2] : 1.0);
        const absorb = Math.exp(-baseAbsorption * path * 0.08);
        red *= absorb * 0.96;
        green *= absorb * 0.99;
        blue *= absorb;

        // Subtle optical black smoked glass tint if requested (retaining pure liquid glass reflections & dispersion)
        if (blackTint > 0.0) {
          const factor = Math.max(0.0, 1.0 - blackTint);
          red *= factor;
          green *= factor;
          blue *= factor;
        }

        // Blinn-Phong Specular Highlights & Schlick Fresnel
        const Hx = normLight[0] - eyeDir[0];
        const Hy = normLight[1] - eyeDir[1];
        const Hz = normLight[2] - eyeDir[2];
        const hLen = Math.hypot(Hx, Hy, Hz) || 1;
        const NdotH = Math.max(0, (N[0] * Hx + N[1] * Hy + N[2] * Hz) / hLen);

        const VdotN = Math.max(0, -(eyeDir[0] * N[0] + eyeDir[1] * N[1] + eyeDir[2] * N[2]));
        const F0 = 0.04;
        const fresnel = F0 + (1.0 - F0) * Math.pow(1.0 - VdotN, 5.0);

        const broadSpec = Math.pow(NdotH, 14.0) * 45 * specularMultiplier;
        const sharpSpec = Math.pow(NdotH, 90.0) * 180 * specularMultiplier;
        const totalSpec = (broadSpec + sharpSpec) * fresnel * edgeFactor;

        // Smooth subpixel antialiasing at the boundary
        const bgR = bgPixels[outIdx];
        const bgG = bgPixels[outIdx + 1];
        const bgB = bgPixels[outIdx + 2];

        const glassR = Math.min(255, red * tirDarken + totalSpec);
        const glassG = Math.min(255, green * tirDarken + totalSpec);
        const glassB = Math.min(255, blue * tirDarken + totalSpec * 1.1);

        // Alpha blend at the 1px perimeter
        const edgeAlpha = Math.min(1.0, Math.max(0.0, -dist));
        outPixels[outIdx] = Math.round(glassR * edgeAlpha + bgR * (1.0 - edgeAlpha));
        outPixels[outIdx + 1] = Math.round(glassG * edgeAlpha + bgG * (1.0 - edgeAlpha));
        outPixels[outIdx + 2] = Math.round(glassB * edgeAlpha + bgB * (1.0 - edgeAlpha));
      }
    }
  }
}

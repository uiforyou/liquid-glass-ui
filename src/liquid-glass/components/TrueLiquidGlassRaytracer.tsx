import React, { useRef, useEffect, useCallback } from 'react';

interface TrueLiquidGlassRaytracerProps {
  pillBounds: { x: number; y: number; width: number; height: number };
  containerWidth: number;
  containerHeight: number;
  drawBackdropContent: (bctx: CanvasRenderingContext2D, width: number, height: number) => void;
  renderTrigger?: number | string;
}

// 3D Vector Snell's Law Refraction
function refractRay(
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

// Signed distance to 2D capsule / pill
function sdPill(x: number, y: number, halfW: number, halfH: number, r: number): number {
  const dx = halfW - r;
  const dy = halfH - r;
  const qx = Math.max(0, Math.abs(x) - Math.max(0, dx));
  const qy = Math.max(0, Math.abs(y) - Math.max(0, dy));
  return Math.hypot(qx, qy) - r;
}

export const TrueLiquidGlassRaytracer: React.FC<TrueLiquidGlassRaytracerProps> = ({
  pillBounds,
  containerWidth,
  containerHeight,
  drawBackdropContent,
  renderTrigger
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Optical physical parameters for pure crystal liquid lens
  const optics = useRef({
    bevelHeight: 28,      // 3D lens dome elevation
    thickness: 8,         // Physical slab depth
    ior: 1.82,            // High refractive index for visible letter-bending
    dispersion: 0.085,    // Spectral chromatic dispersion (Cauchy prism separation)
    absorption: 0.035     // Beer-Lambert crystal transmission
  });

  const renderRaytracedScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerWidth === 0 || containerHeight === 0) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const W = containerWidth;
    const H = containerHeight;

    canvas.width = W;
    canvas.height = H;

    // 1. Render backdrop onto offscreen canvas buffer
    let bgCanvas = bgCanvasRef.current;
    if (!bgCanvas || bgCanvas.width !== W || bgCanvas.height !== H) {
      bgCanvas = document.createElement('canvas');
      bgCanvas.width = W;
      bgCanvas.height = H;
      bgCanvasRef.current = bgCanvas;
    }

    const bctx = bgCanvas.getContext('2d');
    if (!bctx) return;

    drawBackdropContent(bctx, W, H);
    const bgData = bctx.getImageData(0, 0, W, H);
    const bgPixels = bgData.data;

    // 2. Output image data
    const img = ctx.createImageData(W, H);
    const out = img.data;
    out.set(bgPixels); // Initially exact clone of backdrop

    // Pill geometry
    const { x, y, width: pw, height: ph } = pillBounds;
    const halfW = pw / 2;
    const halfH = ph / 2;
    const pillR = Math.min(halfW, halfH); // Capsule semicircular ends
    const centerX = x + halfW;
    const centerY = y + halfH;

    const { bevelHeight, thickness, ior, dispersion, absorption } = optics.current;

    const minX = Math.max(0, Math.floor(centerX - halfW - 8));
    const maxX = Math.min(W - 1, Math.ceil(centerX + halfW + 8));
    const minY = Math.max(0, Math.floor(centerY - halfH - 8));
    const maxY = Math.min(H - 1, Math.ceil(centerY + halfH + 8));

    // Direction vectors
    const eyeDir: [number, number, number] = [0, 0, -1]; // Eye looking down -Z
    const lightDir: [number, number, number] = [-0.4, -0.75, 0.52]; // Overhead directional light
    const lLen = Math.hypot(...lightDir);
    lightDir[0] /= lLen; lightDir[1] /= lLen; lightDir[2] /= lLen;

    // Bilinear Subpixel Sampler for smooth magnification and warping
    const sampleBilinear = (px: number, py: number, c: number) => {
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

      const top = bgPixels[idx00] * (1 - fx) + bgPixels[idx10] * fx;
      const bot = bgPixels[idx01] * (1 - fx) + bgPixels[idx11] * fx;
      return top * (1 - fy) + bot * fy;
    };

    const etaG = 1.0 / ior;
    const etaR = 1.0 / (ior - dispersion);
    const etaB = 1.0 / (ior + dispersion);

    // 3. Per-Pixel 3D Snell Raytracer loop across pill bounds
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const rx = px - centerX;
        const ry = py - centerY;

        const dist = sdPill(rx, ry, halfW, halfH, pillR);
        if (dist > 0) continue; // Outside pill boundary

        const outIdx = (py * W + px) * 4;

        // 3D Domed Convex Lens Gradient for surface normal
        const eps = 0.5;
        const dX = sdPill(rx + eps, ry, halfW, halfH, pillR) - sdPill(rx - eps, ry, halfW, halfH, pillR);
        const dY = sdPill(rx, ry + eps, halfW, halfH, pillR) - sdPill(rx, ry - eps, halfW, halfH, pillR);
        const gLen = Math.hypot(dX, dY) || 1;
        const nx2d = dX / gLen;
        const ny2d = dY / gLen;

        // Convex lens profile: 0 at outer boundary, 1 at center flat
        const lensMax = halfH;
        const t = Math.min(1.0, Math.max(0.0, (-dist) / lensMax));
        const profileSlope = (1.0 - t) / Math.max(0.001, Math.sqrt(Math.max(0.0001, 1.0 - Math.pow(1.0 - t, 2))));

        // Reconstruct 3D Surface Normal N
        const nz = 1.0;
        const nx = nx2d * profileSlope * (bevelHeight / lensMax);
        const ny = ny2d * profileSlope * (bevelHeight / lensMax);
        const nLen = Math.hypot(nx, ny, nz);
        const N: [number, number, number] = [nx / nLen, ny / nLen, nz / nLen];

        // Refract rays across R, G, B channels (Cauchy dispersion)
        const rayR = refractRay(eyeDir, N, etaR);
        const rayG = refractRay(eyeDir, N, etaG);
        const rayB = refractRay(eyeDir, N, etaB);

        const tirDarken = !rayG ? 0.28 : 1.0;
        const distZ = thickness + bevelHeight * (1.0 - t) + 12;

        const hitRx = rayR ? px + (rayR[0] / -rayR[2]) * distZ : px;
        const hitRy = rayR ? py + (rayR[1] / -rayR[2]) * distZ : py;
        const hitGx = rayG ? px + (rayG[0] / -rayG[2]) * distZ : px;
        const hitGy = rayG ? py + (rayG[1] / -rayG[2]) * distZ : py;
        const hitBx = rayB ? px + (rayB[0] / -rayB[2]) * distZ : px;
        const hitBy = rayB ? py + (rayB[1] / -rayB[2]) * distZ : py;

        let red = sampleBilinear(hitRx, hitRy, 0);
        let green = sampleBilinear(hitGx, hitGy, 1);
        let blue = sampleBilinear(hitBx, hitBy, 2);

        // Volumetric Beer-Lambert absorption
        const path = distZ / (rayG ? -rayG[2] : 1.0);
        const absorb = Math.exp(-absorption * path * 0.08);
        red *= absorb * 0.96;
        green *= absorb * 0.99;
        blue *= absorb;

        // Blinn-Phong Specular Highlights & Fresnel
        const Hx = lightDir[0] - eyeDir[0];
        const Hy = lightDir[1] - eyeDir[1];
        const Hz = lightDir[2] - eyeDir[2];
        const hLen = Math.hypot(Hx, Hy, Hz);
        const NdotH = Math.max(0, (N[0] * Hx + N[1] * Hy + N[2] * Hz) / hLen);

        const VdotN = Math.max(0, -(eyeDir[0] * N[0] + eyeDir[1] * N[1] + eyeDir[2] * N[2]));
        const F0 = 0.04;
        const fresnel = F0 + (1.0 - F0) * Math.pow(1.0 - VdotN, 5.0);

        const broadSpec = Math.pow(NdotH, 14.0) * 55;
        const sharpSpec = Math.pow(NdotH, 90.0) * 210;
        const totalSpec = (broadSpec + sharpSpec) * fresnel;

        // Output pure transparent optical lens (without muddy black fill)
        out[outIdx] = Math.min(255, red * tirDarken + totalSpec);
        out[outIdx + 1] = Math.min(255, green * tirDarken + totalSpec);
        out[outIdx + 2] = Math.min(255, blue * tirDarken + totalSpec * 1.08);
      }
    }

    ctx.putImageData(img, 0, 0);
  }, [pillBounds, containerWidth, containerHeight, drawBackdropContent]);

  useEffect(() => {
    renderRaytracedScene();
  }, [renderRaytracedScene, renderTrigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2
      }}
    />
  );
};

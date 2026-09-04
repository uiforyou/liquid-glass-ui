import React, { useRef, useEffect, useCallback } from 'react';

interface OpticalRefractorProps {
  containerRef: React.RefObject<HTMLElement>;
  pillBounds: { x: number; y: number; width: number; height: number } | null;
  velocity?: number;
  className?: string;
}

// 3D Snell's Law Vector Refraction
function refractVector(
  I: [number, number, number],
  N: [number, number, number],
  eta: number
): [number, number, number] | null {
  const dot = I[0] * N[0] + I[1] * N[1] + I[2] * N[2];
  const k = 1.0 - eta * eta * (1.0 - dot * dot);
  if (k < 0) return null; // Total internal reflection
  const sqrtK = Math.sqrt(k);
  return [
    eta * I[0] - (eta * dot + sqrtK) * N[0],
    eta * I[1] - (eta * dot + sqrtK) * N[1],
    eta * I[2] - (eta * dot + sqrtK) * N[2]
  ];
}

// Signed distance to rounded rectangle / capsule
function sdCapsule(px: number, py: number, cx: number, cy: number, halfW: number, halfH: number, radius: number): number {
  const dx = Math.abs(px - cx) - (halfW - radius);
  const dy = Math.abs(py - cy) - (halfH - radius);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(dx, dy), 0) - radius;
}

export const OpticalRefractor: React.FC<OpticalRefractorProps> = ({
  containerRef,
  pillBounds,
  velocity = 0,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  const drawOpticalWarp = useCallback(() => {
    const canvas = canvasRef.current;
    const parent = containerRef.current;
    if (!canvas || !parent || !pillBounds) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { x, y, width: pw, height: ph } = pillBounds;
    const halfW = pw / 2;
    const halfH = ph / 2;
    const cx = x + halfW;
    const cy = y + halfH;
    const radius = halfH; // Pill shaped ends

    const bevelWidth = 24 * dpr;
    const ior = 1.45; // Refractive index of optical liquid glass

    // Velocity stretch effect on displacement
    const velFactor = Math.min(Math.abs(velocity) / 800, 0.4);

    // Render refractive rim displacement overlay
    ctx.save();
    ctx.scale(dpr, dpr);

    // Subtle edge refraction gradient that simulates light deflection
    const radialGrad = ctx.createRadialGradient(
      cx, cy, Math.max(halfW - bevelWidth, 10),
      cx, cy, halfW + 4
    );
    radialGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    radialGrad.addColorStop(0.7, `rgba(255, 255, 255, ${0.04 + velFactor * 0.03})`);
    radialGrad.addColorStop(0.92, `rgba(255, 255, 255, ${0.12 + velFactor * 0.05})`);
    radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');

    // Clip to pill shape
    ctx.beginPath();
    ctx.roundRect(x, y, pw, ph, radius);
    ctx.fillStyle = radialGrad;
    ctx.fill();

    // Specular top light rim refraction
    const topHighlightGrad = ctx.createLinearGradient(x, y, x, y + ph);
    topHighlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    topHighlightGrad.addColorStop(0.15, 'rgba(255, 255, 255, 0.06)');
    topHighlightGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
    topHighlightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.18)');

    ctx.lineWidth = 1;
    ctx.strokeStyle = topHighlightGrad;
    ctx.stroke();

    ctx.restore();
  }, [containerRef, pillBounds, velocity]);

  useEffect(() => {
    drawOpticalWarp();
  }, [drawOpticalWarp]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    />
  );
};

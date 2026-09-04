import React, { useState, useRef, useEffect, useCallback, type PointerEvent as ReactPointerEvent } from 'react';
import './GlassMaterial.css';

// 3D Vector Snell's Law Refraction
function refractRay(I: [number, number, number], N: [number, number, number], eta: number): [number, number, number] | null {
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

// Signed distance to 2D capsule / pill / rounded squircle
function sdPill(x: number, y: number, halfW: number, halfH: number, r: number): number {
  const dx = halfW - r;
  const dy = halfH - r;
  const qx = Math.max(0, Math.abs(x) - Math.max(0, dx));
  const qy = Math.max(0, Math.abs(y) - Math.max(0, dy));
  return Math.hypot(qx, qy) - r;
}

interface GlassBody {
  id: string;
  cx: number;
  cy: number;
  halfW: number;
  halfH: number;
  r: number;
  bevelHeight: number;
  thickness: number;
  ior: number;
  dispersion: number;
  specularMultiplier: number;
}

export const LiquidGlassShowcase: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgDataRef = useRef<ImageData | null>(null);

  // Positions & state of all interactive Liquid Glass components
  const [inputPos, setInputPos] = useState({ x: 0, y: 150 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Refract, 1: Bevel, 2: Dispersion
  const [navLeft, setNavLeft] = useState(0); // pixel offset of active tab
  const [inputText, setInputText] = useState('');
  const [isDraggingInput, setIsDraggingInput] = useState(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, startX: 0, startY: 0 });

  const inputPosRef = useRef(inputPos);
  inputPosRef.current = inputPos;

  const sidebarOpenRef = useRef(sidebarOpen);
  sidebarOpenRef.current = sidebarOpen;

  const navTabRef = useRef(activeTab);
  navTabRef.current = activeTab;

  // Main Per-Pixel 3D Snell Raytracer across ALL active glass bodies
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const bgData = bgDataRef.current;
    if (!canvas || !bgData) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    if (W === 0 || H === 0) return;

    const bgPixels = bgData.data;
    const img = ctx.createImageData(W, H);
    const out = img.data;
    out.set(bgPixels);

    // Collect ALL glass objects currently floating in the viewport
    const bodies: GlassBody[] = [];

    // 1. Bottom Input Capsule
    const pillW = Math.min(W * 0.88, 540);
    const pillH = 68;
    const halfW = pillW / 2;
    const halfH = pillH / 2;
    bodies.push({
      id: 'input',
      cx: W / 2 + inputPosRef.current.x,
      cy: H / 2 + inputPosRef.current.y,
      halfW,
      halfH,
      r: halfH,
      bevelHeight: 30,
      thickness: 8,
      ior: 1.88,
      dispersion: 0.085,
      specularMultiplier: 1.0
    });

    // 2. Top Navigation Indicator Pill
    const navW = 340;
    const navH = 44;
    const tabIndicatorW = 100;
    const tabIndicatorH = 36;
    const tabCenterX = (W / 2 - 170) + 16 + tabIndicatorW / 2 + (navTabRef.current * 105);
    bodies.push({
      id: 'nav-indicator',
      cx: tabCenterX,
      cy: 42,
      halfW: tabIndicatorW / 2,
      halfH: tabIndicatorH / 2,
      r: tabIndicatorH / 2,
      bevelHeight: 18,
      thickness: 6,
      ior: 1.82,
      dispersion: 0.075,
      specularMultiplier: 0.9
    });

    // Top Navigation Outer Bar
    bodies.push({
      id: 'nav-bar',
      cx: W / 2,
      cy: 42,
      halfW: navW / 2,
      halfH: navH / 2,
      r: navH / 2,
      bevelHeight: 14,
      thickness: 5,
      ior: 1.48,
      dispersion: 0.03,
      specularMultiplier: 0.6
    });

    // 3. Top-Left Hamburger Circle Button
    bodies.push({
      id: 'hamburger',
      cx: 48,
      cy: 42,
      halfW: 24,
      halfH: 24,
      r: 24,
      bevelHeight: 18,
      thickness: 6,
      ior: 1.85,
      dispersion: 0.08,
      specularMultiplier: 1.1
    });

    // 4. Floating Contextual Popover Card
    bodies.push({
      id: 'popover',
      cx: W / 2,
      cy: 110,
      halfW: 210,
      halfH: 42,
      r: 20,
      bevelHeight: 20,
      thickness: 6,
      ior: 1.76,
      dispersion: 0.065,
      specularMultiplier: 0.8
    });

    // 5. Floating Sidebar Glass Surface (when open or entering)
    if (sidebarOpenRef.current) {
      const sbW = Math.min(320, W * 0.82);
      bodies.push({
        id: 'sidebar',
        cx: sbW / 2,
        cy: H / 2,
        halfW: sbW / 2,
        halfH: H / 2,
        r: 28,
        bevelHeight: 24,
        thickness: 7,
        ior: 1.75,
        dispersion: 0.06,
        specularMultiplier: 0.8
      });
    }

    // Direction vectors
    const eyeDir: [number, number, number] = [0, 0, -1];
    const lightDir: [number, number, number] = [-0.45, -0.75, 0.48];
    const lLen = Math.hypot(...lightDir);
    lightDir[0] /= lLen; lightDir[1] /= lLen; lightDir[2] /= lLen;

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

    // Process all glass bodies
    for (const body of bodies) {
      const { cx, cy, halfW, halfH, r, bevelHeight, thickness, ior, dispersion, specularMultiplier } = body;
      const minX = Math.max(0, Math.floor(cx - halfW - 8));
      const maxX = Math.min(W - 1, Math.ceil(cx + halfW + 8));
      const minY = Math.max(0, Math.floor(cy - halfH - 8));
      const maxY = Math.min(H - 1, Math.ceil(cy + halfH + 8));

      const etaG = 1.0 / ior;
      const etaR = 1.0 / (ior - dispersion);
      const etaB = 1.0 / (ior + dispersion);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const rx = x - cx;
          const ry = y - cy;

          const dist = sdPill(rx, ry, halfW, halfH, r);
          if (dist > 0) continue; // Outside current body

          const outIdx = (y * W + x) * 4;

          // Domed Convex Bevel normal gradient
          const eps = 0.5;
          const dX = sdPill(rx + eps, ry, halfW, halfH, r) - sdPill(rx - eps, ry, halfW, halfH, r);
          const dY = sdPill(rx, ry + eps, halfW, halfH, r) - sdPill(rx, ry - eps, halfW, halfH, r);
          const gLen = Math.hypot(dX, dY) || 1;
          const nx2d = dX / gLen;
          const ny2d = dY / gLen;

          const lensMax = halfH;
          const t = Math.min(1.0, Math.max(0.0, (-dist) / lensMax));
          const profileSlope = (1.0 - t) / Math.max(0.001, Math.sqrt(Math.max(0.0001, 1.0 - Math.pow(1.0 - t, 2))));

          const nz = 1.0;
          const nx = nx2d * profileSlope * (bevelHeight / lensMax);
          const ny = ny2d * profileSlope * (bevelHeight / lensMax);
          const nLen = Math.hypot(nx, ny, nz);
          const N: [number, number, number] = [nx / nLen, ny / nLen, nz / nLen];

          // 3D Vector Snell Refraction for R, G, B
          const rayR = refractRay(eyeDir, N, etaR);
          const rayG = refractRay(eyeDir, N, etaG);
          const rayB = refractRay(eyeDir, N, etaB);

          const tirDarken = !rayG ? 0.28 : 1.0;
          const distZ = thickness + bevelHeight * (1.0 - t) + 12;

          const hitRx = rayR ? x + (rayR[0] / -rayR[2]) * distZ : x;
          const hitRy = rayR ? y + (rayR[1] / -rayR[2]) * distZ : y;
          const hitGx = rayG ? x + (rayG[0] / -rayG[2]) * distZ : x;
          const hitGy = rayG ? y + (rayG[1] / -rayG[2]) * distZ : y;
          const hitBx = rayB ? x + (rayB[0] / -rayB[2]) * distZ : x;
          const hitBy = rayB ? y + (rayB[1] / -rayB[2]) * distZ : y;

          let red = sampleBilinear(hitRx, hitRy, 0);
          let green = sampleBilinear(hitGx, hitGy, 1);
          let blue = sampleBilinear(hitBx, hitBy, 2);

          // Volumetric Absorption
          const path = distZ / (rayG ? -rayG[2] : 1.0);
          const absorb = Math.exp(-0.035 * path * 0.08);
          red *= absorb * 0.96;
          green *= absorb * 0.99;
          blue *= absorb;

          // Blinn-Phong Specular Bevel Highlights & Fresnel
          const Hx = lightDir[0] - eyeDir[0];
          const Hy = lightDir[1] - eyeDir[1];
          const Hz = lightDir[2] - eyeDir[2];
          const hLen = Math.hypot(Hx, Hy, Hz);
          const NdotH = Math.max(0, (N[0] * Hx + N[1] * Hy + N[2] * Hz) / hLen);

          const VdotN = Math.max(0, -(eyeDir[0] * N[0] + eyeDir[1] * N[1] + eyeDir[2] * N[2]));
          const F0 = 0.04;
          const fresnel = F0 + (1.0 - F0) * Math.pow(1.0 - VdotN, 5.0);

          const broadSpec = Math.pow(NdotH, 14.0) * 55 * specularMultiplier;
          const sharpSpec = Math.pow(NdotH, 90.0) * 210 * specularMultiplier;
          const totalSpec = (broadSpec + sharpSpec) * fresnel;

          out[outIdx] = Math.min(255, red * tirDarken + totalSpec);
          out[outIdx + 1] = Math.min(255, green * tirDarken + totalSpec);
          out[outIdx + 2] = Math.min(255, blue * tirDarken + totalSpec * 1.1);
        }
      }
    }

    ctx.putImageData(img, 0, 0);
  }, []);

  // Initialize and draw rich high-contrast backdrop
  useEffect(() => {
    const setupBackdrop = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const W = Math.round(rect.width) || window.innerWidth;
      const H = Math.round(rect.height) || window.innerHeight;

      canvas.width = W;
      canvas.height = H;

      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = W;
      bgCanvas.height = H;
      const bctx = bgCanvas.getContext('2d');
      if (!bctx) return;

      // Dark background
      bctx.fillStyle = '#0a0d12';
      bctx.fillRect(0, 0, W, H);

      // Vibrant ambient gradient orbs
      const grad1 = bctx.createRadialGradient(W * 0.2, H * 0.25, 20, W * 0.2, H * 0.25, W * 0.5);
      grad1.addColorStop(0, '#ff2a6d');
      grad1.addColorStop(0.4, '#8b5cf6');
      grad1.addColorStop(0.8, '#05d9e8');
      grad1.addColorStop(1, 'transparent');
      bctx.fillStyle = grad1;
      bctx.fillRect(0, 0, W, H);

      const grad2 = bctx.createRadialGradient(W * 0.82, H * 0.65, 30, W * 0.82, H * 0.65, W * 0.5);
      grad2.addColorStop(0, '#10b981');
      grad2.addColorStop(0.5, '#3b82f6');
      grad2.addColorStop(1, 'transparent');
      bctx.fillStyle = grad2;
      bctx.fillRect(0, 0, W, H);

      // Fine alignment grid lines (1.5px) for clear optical bending verification
      bctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      bctx.lineWidth = 1.5;
      for (let x = 0; x < W; x += 36) {
        bctx.beginPath(); bctx.moveTo(x, 0); bctx.lineTo(x, H); bctx.stroke();
      }
      for (let y = 0; y < H; y += 36) {
        bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(W, y); bctx.stroke();
      }

      // App Icons floating behind
      const icons = [
        { x: W * 0.2, y: H * 0.52, color: '#10b981', name: 'Finder' },
        { x: W * 0.4, y: H * 0.52, color: '#f59e0b', name: 'Optics' },
        { x: W * 0.6, y: H * 0.52, color: '#6366f1', name: 'Spatial' },
        { x: W * 0.8, y: H * 0.52, color: '#ec4899', name: 'Liquid' }
      ];

      icons.forEach(ic => {
        bctx.fillStyle = ic.color;
        bctx.beginPath();
        bctx.roundRect(ic.x - 36, ic.y - 36, 72, 72, 18);
        bctx.fill();
        bctx.shadowColor = ic.color;
        bctx.shadowBlur = 28;
        bctx.fill();
        bctx.shadowBlur = 0;

        bctx.fillStyle = '#ffffff';
        bctx.font = '600 13px -apple-system, sans-serif';
        bctx.textAlign = 'center';
        bctx.fillText(ic.name, ic.x, ic.y + 56);
      });

      // Sharp headline text directly testable behind all liquid lenses
      bctx.fillStyle = '#ffffff';
      bctx.font = '800 48px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
      bctx.textAlign = 'center';
      bctx.fillText('LIQUID GLASS UI SYSTEM', W / 2, H * 0.32);

      bctx.font = '600 16px -apple-system, sans-serif';
      bctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      bctx.fillText('ALL CONTROLS EMIT TRUE 3D SNELL REFRACTION • CONVEX BEVELS • PRISMATIC DISPERSION', W / 2, H * 0.38);

      bctx.font = '500 15px -apple-system, sans-serif';
      bctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      bctx.fillText('Notice how the top menu button, tab bar, popover, sidebar, and input capsule all bend text.', W / 2, H * 0.66);
      bctx.fillText('Drag the bottom capsule or click tabs to observe dynamic optical warping across every lens.', W / 2, H * 0.71);

      bgCanvasRef.current = bgCanvas;
      bgDataRef.current = bctx.getImageData(0, 0, W, H);
      renderFrame();
    };

    setupBackdrop();
    window.addEventListener('resize', setupBackdrop);
    return () => window.removeEventListener('resize', setupBackdrop);
  }, [renderFrame]);

  // Re-render when position or states change
  useEffect(() => {
    renderFrame();
  }, [inputPos, sidebarOpen, activeTab, renderFrame]);

  // Dragging handlers for input capsule
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
    setIsDraggingInput(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: inputPos.x,
      startY: inputPos.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingInput) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    setInputPos({
      x: dragStartRef.current.startX + dx,
      y: dragStartRef.current.startY + dy,
    });
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingInput) return;
    setIsDraggingInput(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div ref={containerRef} className="lg-app" style={{ cursor: isDraggingInput ? 'grabbing' : 'default' }}>
      {/* 3D Real-Time Snell Vector Raytracer Canvas (Bends, refracts, and bevels ALL floating glass elements) */}
      <canvas ref={canvasRef} className="lg-ambient-canvas" />

      {/* Component 1: Top-Left Floating Liquid Glass Hamburger Trigger */}
      <div
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: '18px',
          left: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 90,
          background: 'transparent',
          boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.3)',
          transition: 'transform 0.15s ease'
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          {sidebarOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </div>

      {/* Component 2: Top Floating Liquid Navigation Indicator */}
      <header
        style={{
          position: 'fixed',
          top: '20px',
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 85
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '340px',
            height: '44px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            pointerEvents: 'auto',
            background: 'transparent',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
            padding: '4px'
          }}
        >
          {['3D Snell Lens', 'Convex Bevel', 'Prism Fringes'].map((label, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              style={{
                zIndex: 10,
                padding: '6px 14px',
                borderRadius: '9999px',
                border: 'none',
                background: 'transparent',
                color: activeTab === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'color 0.15s ease'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Component 3: Floating Contextual Popover Card with 3D Bevel Refraction */}
      <div
        style={{
          position: 'fixed',
          top: '68px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '420px',
          height: '84px',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '12px 20px',
          zIndex: 70,
          background: 'transparent',
          boxShadow: '0 16px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.3)',
          cursor: 'pointer'
        }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
          <span>Unified Liquid Glass Refraction System</span>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>›</span>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.45 }}>
          All floating controls (menu button, nav bar, popover card, and input capsule) run the 3D Snell vector raytracer with live lens curvature.
        </p>
      </div>

      {/* Component 4: Sliding Glass Sidebar Surface with 3D Edge Bevel Refraction */}
      {sidebarOpen && (
        <aside
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: 'min(320px, 82vw)',
            zIndex: 88,
            background: 'transparent',
            borderRadius: '0 28px 28px 0',
            boxShadow: '16px 0 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.35)',
            padding: '80px 22px 24px 22px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '18px' }}>
            Liquid Glass Layers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              'Per-Pixel Snell\'s Law Vectors',
              'Cauchy Spectral Dispersion',
              'Domed Convex Bevel Profile',
              'Subpixel Bilinear Warping',
              'Beer-Lambert Volumetric Tint'
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 500,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Component 5: Transparent Draggable Liquid Glass Input Capsule with Snell Refraction & Bevel Underneath */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate3d(calc(-50% + ${inputPos.x}px), calc(-50% + ${inputPos.y}px), 0)`,
          width: 'min(88vw, 540px)',
          height: '68px',
          borderRadius: '9999px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 40,
          cursor: isDraggingInput ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          background: 'transparent',
          boxShadow: isDraggingInput
            ? '0 32px 80px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)'
            : '0 20px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
        }}
      >
        {/* Plus Action Button */}
        <button
          aria-label="Add attachment"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Input prompt field */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask ChatGPT or drag this liquid capsule..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 500,
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
          }}
        />

        {/* Microphone Button */}
        <button
          aria-label="Voice dictation"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </button>

        {/* Blue Action Send Button */}
        <button
          aria-label="Send"
          onClick={() => setInputText('')}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#2563eb',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 2px 14px rgba(37, 99, 235, 0.65)'
          }}
        >
          {inputText.trim() ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          ) : (
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffffff' }} />
          )}
        </button>
      </div>

      {/* Footer Benchmark Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '6px 18px',
          borderRadius: '999px',
          background: 'rgba(0, 0, 0, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.6px',
          color: 'rgba(255, 255, 255, 0.85)',
          pointerEvents: 'none',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        FULL-SUITE 3D SNELL VECTOR REFRACTION • DOMED CONVEX BEVELS ACROSS ALL CONTROLS
      </div>
    </div>
  );
};

export default LiquidGlassShowcase;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { renderLiquidGlassFrame, RaytracerBody } from '../liquid-glass/engine/Raytracer';
import { useSettings } from '../liquid-glass/components/SettingsContext';
import '../liquid-glass/styles/liquid-glass.css';

export const PillsPage: React.FC = () => {
  const { settings, navbarBounds, bgData, bgCanvasSize } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Two Replicated Dynamic Island Pills
  const [island1Expanded, setIsland1Expanded] = useState(false);
  const [island2Expanded, setIsland2Expanded] = useState(false);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bgData) return;

    if (canvas.width !== bgCanvasSize.width || canvas.height !== bgCanvasSize.height) {
      canvas.width = bgCanvasSize.width;
      canvas.height = bgCanvasSize.height;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    if (W === 0 || H === 0) return;

    const img = ctx.createImageData(W, H);
    img.data.set(bgData.data);

    const bodies: RaytracerBody[] = [];

    // 0. Top Navbar Liquid Glass Housing
    if (navbarBounds) {
      bodies.push({
        id: 'navbar-outer',
        cx: navbarBounds.cx,
        cy: navbarBounds.cy,
        halfW: navbarBounds.halfW,
        halfH: navbarBounds.halfH,
        r: navbarBounds.r,
        bevelHeight: 18,
        thickness: 7,
        ior: settings.ior,
        dispersion: settings.dispersion,
        specularMultiplier: 1.0
      });
    }

    // 1. First Exact Replica Dynamic Island Pill (Upper)
    const pill1HalfW = (island1Expanded ? 360 : 200) / 2;
    const pill1HalfH = (island1Expanded ? 76 : 44) / 2;
    const pill1R = island1Expanded ? 38 : 22;

    bodies.push({
      id: 'dynamic-island-1',
      cx: W / 2,
      cy: H / 2 - 54,
      halfW: pill1HalfW,
      halfH: pill1HalfH,
      r: pill1R,
      bevelHeight: settings.bevelHeight,
      thickness: 8,
      ior: settings.ior,
      dispersion: settings.dispersion,
      specularMultiplier: 1.15
    });

    // 2. Second Exact Replica Dynamic Island Pill (Lower)
    const pill2HalfW = (island2Expanded ? 360 : 200) / 2;
    const pill2HalfH = (island2Expanded ? 76 : 44) / 2;
    const pill2R = island2Expanded ? 38 : 22;

    bodies.push({
      id: 'dynamic-island-2',
      cx: W / 2,
      cy: H / 2 + 54,
      halfW: pill2HalfW,
      halfH: pill2HalfH,
      r: pill2R,
      bevelHeight: settings.bevelHeight,
      thickness: 8,
      ior: settings.ior,
      dispersion: settings.dispersion,
      specularMultiplier: 1.15,
      blackTint: 0.28,
      blurRadius: 2.2
    });

    renderLiquidGlassFrame(img.data, bgData.data, W, H, bodies);
    ctx.putImageData(img, 0, 0);
  }, [island1Expanded, island2Expanded, navbarBounds, settings, bgData, bgCanvasSize]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  return (
    <div className="lg-page-stage">
      <canvas ref={canvasRef} className="lg-canvas" />

      {/* Pill 1: Dynamic Island Capsule */}
      <div
        onClick={() => setIsland1Expanded(!island1Expanded)}
        style={{
          position: 'fixed',
          top: 'calc(50% - 54px)',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: island1Expanded ? '360px' : '200px',
          height: island1Expanded ? '76px' : '44px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: island1Expanded ? '0 24px' : '0 18px',
          zIndex: 40,
          cursor: 'pointer',
          background: 'transparent',
          boxShadow: island1Expanded
            ? '0 24px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
            : '0 14px 36px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
          transition: 'all 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              {island1Expanded ? 'Now Playing • Spatial Sound' : 'Spatial Audio'}
            </span>
            {island1Expanded && (
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                Liquid Glass Engine • 48kHz Lossless
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {island1Expanded ? '3:24' : 'Tap to expand'}
          </span>
        </div>
      </div>

      {/* Pill 2: Exact Duplicate Replicated Dynamic Island Capsule with Subtle Optical Grey Tint */}
      <div
        onClick={() => setIsland2Expanded(!island2Expanded)}
        style={{
          position: 'fixed',
          top: 'calc(50% + 54px)',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: island2Expanded ? '360px' : '200px',
          height: island2Expanded ? '76px' : '44px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: island2Expanded ? '0 24px' : '0 18px',
          zIndex: 40,
          cursor: 'pointer',
          background: 'transparent',
          boxShadow: island2Expanded
            ? '0 24px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
            : '0 14px 36px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
          transition: 'all 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 10px #38bdf8'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              {island2Expanded ? 'Now Playing • Spatial Sound' : 'Spatial Audio'}
            </span>
            {island2Expanded && (
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                Liquid Glass Engine • 48kHz Lossless
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {island2Expanded ? '4:12' : 'Tap to expand'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PillsPage;

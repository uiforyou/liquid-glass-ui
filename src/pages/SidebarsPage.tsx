import React, { useState, useRef, useEffect, useCallback } from 'react';
import { renderLiquidGlassFrame, RaytracerBody } from '../liquid-glass/engine/Raytracer';
import { useSettings } from '../liquid-glass/components/SettingsContext';
import '../liquid-glass/styles/liquid-glass.css';

export const SidebarsPage: React.FC = () => {
  const { settings, navbarBounds, bgData, bgCanvasSize } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Single Liquid Glass Sidebar state
  const [leftOpen, setLeftOpen] = useState(true);

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

    // 1. One Single Hero Liquid Glass Navigation Drawer
    const sbW = Math.min(320, W * 0.82);
    if (leftOpen) {
      bodies.push({
        id: 'left-sidebar',
        cx: sbW / 2,
        cy: H / 2,
        halfW: sbW / 2,
        halfH: H / 2,
        r: 28,
        bevelHeight: Math.min(settings.bevelHeight, 26),
        thickness: 8,
        ior: settings.ior,
        dispersion: settings.dispersion,
        specularMultiplier: 1.1
      });
    }

    // 2. Liquid Glass Toggle Button Pill
    const btnCx = leftOpen ? sbW + 24 + 85 : W / 2;
    const btnCy = H / 2;
    bodies.push({
      id: 'drawer-toggle-btn',
      cx: btnCx,
      cy: btnCy,
      halfW: 85,
      halfH: 24,
      r: 24,
      bevelHeight: settings.bevelHeight,
      thickness: 7,
      ior: settings.ior,
      dispersion: settings.dispersion,
      specularMultiplier: 1.15
    });

    renderLiquidGlassFrame(img.data, bgData.data, W, H, bodies);
    ctx.putImageData(img, 0, 0);
  }, [leftOpen, navbarBounds, settings, bgData, bgCanvasSize]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  return (
    <div className="lg-page-stage">
      <canvas ref={canvasRef} className="lg-canvas" />

      {/* Pure Liquid Glass Toggle Button for Drawer */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: leftOpen ? 'calc(min(320px, 82vw) + 24px)' : '50%',
          transform: leftOpen ? 'translateY(-50%)' : 'translate(-50%, -50%)',
          zIndex: 40,
          transition: 'left 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          style={{
            width: '170px',
            height: '48px',
            borderRadius: '9999px',
            border: 'none',
            background: 'transparent',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14.5px',
            cursor: 'pointer',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
            userSelect: 'none'
          }}
        >
          {leftOpen ? 'Collapse Drawer' : 'Open Drawer'}
        </button>
      </div>

      {/* Single Hero Liquid Glass Navigation Drawer */}
      {leftOpen && (
        <aside
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: 'min(320px, 82vw)',
            zIndex: 50,
            background: 'transparent',
            borderRadius: '0 28px 28px 0',
            boxShadow: '16px 0 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.35)',
            padding: '90px 24px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            userSelect: 'none'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '16px' }}>
            Navigation Drawer
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Dashboard', 'Analytics', 'Optics Engine', 'Settings', 'Documentation'].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: idx === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{item}</span>
                {idx === 0 && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />}
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
};

export default SidebarsPage;

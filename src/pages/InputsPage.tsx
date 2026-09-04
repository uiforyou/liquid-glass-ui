import React, { useState, useRef, useEffect, useCallback } from 'react';
import { renderLiquidGlassFrame, RaytracerBody } from '../liquid-glass/engine/Raytracer';
import { Spring1D, SPRING_PRESETS } from '../liquid-glass/engine/physics';
import { useSettings } from '../liquid-glass/components/SettingsContext';
import '../liquid-glass/styles/liquid-glass.css';

export const InputsPage: React.FC = () => {
  const { settings, navbarBounds, bgData, bgCanvasSize } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Two Replicated Hero Input states
  const [input1Text, setInput1Text] = useState('');
  const [input2Text, setInput2Text] = useState('');

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

    const inputW = Math.min(W * 0.88, 540);
    const inputH = 58;

    // 1. First Exact Replica Liquid Glass Input Bar (Upper)
    bodies.push({
      id: 'input-replica-1',
      cx: W / 2,
      cy: H / 2 - 50,
      halfW: inputW / 2,
      halfH: inputH / 2,
      r: inputH / 2,
      bevelHeight: settings.bevelHeight,
      thickness: 8,
      ior: settings.ior,
      dispersion: settings.dispersion,
      specularMultiplier: 1.15
    });

    // 2. Second Exact Replica Liquid Glass Input Bar (Lower)
    bodies.push({
      id: 'input-replica-2',
      cx: W / 2,
      cy: H / 2 + 50,
      halfW: inputW / 2,
      halfH: inputH / 2,
      r: inputH / 2,
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
  }, [navbarBounds, settings, bgData, bgCanvasSize]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  return (
    <div className="lg-page-stage">
      <canvas ref={canvasRef} className="lg-canvas" />

      {/* Input Replica 1 */}
      <div
        style={{
          position: 'fixed',
          top: 'calc(50% - 50px)',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(88vw, 540px)',
          height: '58px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 14px',
          gap: '12px',
          zIndex: 50,
          background: 'transparent',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)'
        }}
      >
        <button
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <input
          type="text"
          className="lg-glass-input"
          value={input1Text}
          onChange={(e) => setInput1Text(e.target.value)}
          placeholder="First Liquid Glass Input..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 500,
            padding: '8px 4px',
            textShadow: '0 1px 4px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.95)'
          }}
        />

        <button
          onClick={() => setInput1Text('')}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: 'none',
            background: input1Text.trim() ? '#fff' : '#2563eb',
            color: input1Text.trim() ? '#000' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 14px rgba(37,99,235,0.55)',
            transition: 'background 0.2s, color 0.2s'
          }}
        >
          {input1Text.trim() ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          ) : (
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          )}
        </button>
      </div>

      {/* Input Replica 2 (Exact Duplicate with Subtle Grey Tint, Pure Liquid Glass Optics) */}
      <div
        style={{
          position: 'fixed',
          top: 'calc(50% + 50px)',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(88vw, 540px)',
          height: '58px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 14px',
          gap: '12px',
          zIndex: 50,
          background: 'transparent',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)'
        }}
      >
        <button
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <input
          type="text"
          className="lg-glass-input"
          value={input2Text}
          onChange={(e) => setInput2Text(e.target.value)}
          placeholder="Second Liquid Glass Input (Duplicate)..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 500,
            padding: '8px 4px',
            textShadow: '0 1px 4px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.95)'
          }}
        />

        <button
          onClick={() => setInput2Text('')}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: 'none',
            background: input2Text.trim() ? '#fff' : '#2563eb',
            color: input2Text.trim() ? '#000' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 14px rgba(37,99,235,0.55)',
            transition: 'background 0.2s, color 0.2s'
          }}
        >
          {input2Text.trim() ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          ) : (
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />
          )}
        </button>
      </div>
    </div>
  );
};

export default InputsPage;

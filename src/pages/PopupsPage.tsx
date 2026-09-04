import React, { useState, useRef, useEffect, useCallback } from 'react';
import { renderLiquidGlassFrame, RaytracerBody } from '../liquid-glass/engine/Raytracer';
import { useSettings } from '../liquid-glass/components/SettingsContext';
import '../liquid-glass/styles/liquid-glass.css';

export const PopupsPage: React.FC = () => {
  const { settings, navbarBounds, bgData, bgCanvasSize } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Liquid Glass Popups states (Two Replicated Modal Dialog Cards)
  const [isOpen1, setIsOpen1] = useState(true);
  const [isOpen2, setIsOpen2] = useState(true);

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

    const modalW = Math.min(W * 0.88, 440);
    const modalH = 190;

    // 1. Popup 1: First Replica Volumetric Modal Dialog Card (Upper)
    if (isOpen1) {
      bodies.push({
        id: 'modal-dialog-1',
        cx: W / 2,
        cy: H / 2 - 110,
        halfW: modalW / 2,
        halfH: modalH / 2,
        r: 28,
        bevelHeight: settings.bevelHeight,
        thickness: 8,
        ior: settings.ior,
        dispersion: settings.dispersion,
        specularMultiplier: 1.2
      });
    } else {
      bodies.push({
        id: 'reopen-btn-1',
        cx: W / 2,
        cy: H / 2 - 110,
        halfW: 130,
        halfH: 26,
        r: 26,
        bevelHeight: settings.bevelHeight,
        thickness: 7,
        ior: settings.ior,
        dispersion: settings.dispersion,
        specularMultiplier: 1.15
      });
    }

    // 2. Popup 2: Second Exact Replica Modal Dialog Card (Lower)
    if (isOpen2) {
      bodies.push({
        id: 'modal-dialog-2',
        cx: W / 2,
        cy: H / 2 + 110,
        halfW: modalW / 2,
        halfH: modalH / 2,
        r: 28,
        bevelHeight: settings.bevelHeight,
        thickness: 8,
        ior: settings.ior,
        dispersion: settings.dispersion,
        specularMultiplier: 1.2,
        blackTint: 0.28,
        blurRadius: 2.2
      });
    } else {
      bodies.push({
        id: 'reopen-btn-2',
        cx: W / 2,
        cy: H / 2 + 110,
        halfW: 130,
        halfH: 26,
        r: 26,
        bevelHeight: settings.bevelHeight,
        thickness: 7,
        ior: settings.ior,
        dispersion: settings.dispersion,
        specularMultiplier: 1.15,
        blackTint: 0.28,
        blurRadius: 2.2
      });
    }

    renderLiquidGlassFrame(img.data, bgData.data, W, H, bodies);
    ctx.putImageData(img, 0, 0);
  }, [isOpen1, isOpen2, navbarBounds, settings, bgData, bgCanvasSize]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  return (
    <div className="lg-page-stage">
      <canvas ref={canvasRef} className="lg-canvas" />

      {/* Reopen Button 1 if closed */}
      {!isOpen1 && (
        <div style={{ position: 'fixed', top: 'calc(50% - 110px)', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 40 }}>
          <button
            onClick={() => setIsOpen1(true)}
            style={{
              width: '260px',
              height: '52px',
              borderRadius: '9999px',
              border: 'none',
              background: 'transparent',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)'
            }}
          >
            Open Liquid Glass Card 1
          </button>
        </div>
      )}

      {/* Popup 1: Modal Dialog Card Replica 1 */}
      {isOpen1 && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(50% - 110px)',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(88vw, 440px)',
            height: '190px',
            borderRadius: '28px',
            zIndex: 60,
            background: 'transparent',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 600, margin: 0, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                Liquid Glass Card 1
              </h3>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>
                Modal
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.45, margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              Real-time volumetric Snell refraction with chromatic dispersion and specular highlights.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setIsOpen1(false)}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
            <button
              onClick={() => setIsOpen1(false)}
              style={{
                padding: '8px 20px',
                borderRadius: '9999px',
                border: 'none',
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.3)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Reopen Button 2 if closed */}
      {!isOpen2 && (
        <div style={{ position: 'fixed', top: 'calc(50% + 110px)', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 40 }}>
          <button
            onClick={() => setIsOpen2(true)}
            style={{
              width: '260px',
              height: '52px',
              borderRadius: '9999px',
              border: 'none',
              background: 'transparent',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)'
            }}
          >
            Open Liquid Glass Card 2 (Duplicate)
          </button>
        </div>
      )}

      {/* Popup 2: Exact Duplicate Modal Dialog Card Replica 2 with Subtle Optical Grey Tint */}
      {isOpen2 && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(50% + 110px)',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(88vw, 440px)',
            height: '190px',
            borderRadius: '28px',
            zIndex: 60,
            background: 'transparent',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 600, margin: 0, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                Liquid Glass Card 2 (Duplicate)
              </h3>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>
                Modal
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.45, margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              Real-time volumetric Snell refraction with chromatic dispersion and specular highlights.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setIsOpen2(false)}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
            <button
              onClick={() => setIsOpen2(false)}
              style={{
                padding: '8px 20px',
                borderRadius: '9999px',
                border: 'none',
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.3)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopupsPage;

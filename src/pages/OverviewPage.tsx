import React, { useState, useRef, useEffect, useCallback } from 'react';
import { renderLiquidGlassFrame, RaytracerBody } from '../liquid-glass/engine/Raytracer';
import { useSettings } from '../liquid-glass/components/SettingsContext';
import '../liquid-glass/styles/liquid-glass.css';

export const OverviewPage: React.FC = () => {
  const { settings, navbarBounds, bgData, bgCanvasSize } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draggable hero lens position
  const [lensPos, setLensPos] = useState({ x: 0, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, startX: 0, startY: 0 });
  const dragRafRef = useRef<number | null>(null);
  const pendingPosRef = useRef({ x: 0, y: 120 });

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

    // 1. Top Navbar Liquid Glass Outer Lens
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

    // 2. Hero draggable pill lens
    const pillW = Math.min(W * 0.85, 520);
    const pillH = 70;
    bodies.push({
      id: 'hero-lens',
      cx: W / 2 + lensPos.x,
      cy: H / 2 + lensPos.y,
      halfW: pillW / 2,
      halfH: pillH / 2,
      r: pillH / 2,
      bevelHeight: settings.bevelHeight,
      thickness: 8,
      ior: settings.ior,
      dispersion: settings.dispersion,
      specularMultiplier: 1.1
    });

    renderLiquidGlassFrame(img.data, bgData.data, W, H, bodies);
    ctx.putImageData(img, 0, 0);
  }, [lensPos, settings, navbarBounds, bgData, bgCanvasSize]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  // Clean up dragging RAF
  useEffect(() => {
    return () => {
      if (dragRafRef.current !== null) cancelAnimationFrame(dragRafRef.current);
    };
  }, []);

  return (
    <div className="lg-page-stage">
      <canvas ref={canvasRef} className="lg-canvas" />

      {/* Hero Draggable Capsule Overlay */}
      <div
        onPointerDown={(e) => {
          setIsDragging(true);
          dragStartRef.current = {
            pointerX: e.clientX,
            pointerY: e.clientY,
            startX: lensPos.x,
            startY: lensPos.y
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!isDragging) return;
          const nextX = dragStartRef.current.startX + (e.clientX - dragStartRef.current.pointerX);
          const nextY = dragStartRef.current.startY + (e.clientY - dragStartRef.current.pointerY);
          pendingPosRef.current = { x: nextX, y: nextY };

          if (dragRafRef.current === null) {
            dragRafRef.current = requestAnimationFrame(() => {
              setLensPos(pendingPosRef.current);
              dragRafRef.current = null;
            });
          }
        }}
        onPointerUp={(e) => {
          setIsDragging(false);
          if (dragRafRef.current !== null) {
            cancelAnimationFrame(dragRafRef.current);
            dragRafRef.current = null;
          }
          setLensPos(pendingPosRef.current);
          try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate3d(calc(-50% + ${lensPos.x}px), calc(-50% + ${lensPos.y}px), 0)`,
          width: 'min(85vw, 520px)',
          height: '70px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          zIndex: 40,
          cursor: isDragging ? 'grabbing' : 'grab',
          background: 'transparent',
          boxShadow: isDragging
            ? '0 32px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
            : '0 20px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)' }}>
          {isDragging ? '⚡ Raytracing at 60fps' : 'Drag this Pure Liquid Lens'}
        </span>
      </div>
    </div>
  );
};

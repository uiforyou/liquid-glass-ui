import React, { useRef, useState, useEffect } from 'react';
import { GlassButton } from './GlassButton';
import { Spring1D, SPRING_PRESETS } from '../physics';
import '../GlassMaterial.css';

interface GlassSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export const GlassSidebar: React.FC<GlassSidebarProps> = ({ isOpen, onClose, onToggle }) => {
  const [progress, setProgress] = useState(0);
  const spring = useRef(new Spring1D(0, SPRING_PRESETS.sidebar));
  const animFrame = useRef<number | null>(null);

  useEffect(() => {
    spring.current.setTarget(isOpen ? 1 : 0);
    if (animFrame.current !== null) cancelAnimationFrame(animFrame.current);

    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      const running = spring.current.update(dt);
      setProgress(spring.current.current);
      if (running) {
        animFrame.current = requestAnimationFrame(loop);
      } else {
        animFrame.current = null;
      }
    };
    animFrame.current = requestAnimationFrame(loop);

    return () => {
      if (animFrame.current !== null) cancelAnimationFrame(animFrame.current);
    };
  }, [isOpen]);

  const translateX = (progress - 1) * 100;
  const backdropOpacity = Math.min(Math.max(progress, 0), 1) * 0.45;

  return (
    <>
      {/* Top Floating Glass Hamburger / Close Trigger */}
      <div
        style={{
          position: 'fixed',
          top: 'calc(18px + env(safe-area-inset-top, 0px))',
          left: '20px',
          zIndex: 110
        }}
      >
        <GlassButton
          ariaLabel={isOpen ? "Close sidebar" : "Open sidebar"}
          size={42}
          onClick={onToggle}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line
              x1={progress > 0.5 ? "6" : "4"}
              y1={progress > 0.5 ? "6" : "7"}
              x2={progress > 0.5 ? "18" : "20"}
              y2={progress > 0.5 ? "18" : "7"}
              style={{
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                transformOrigin: 'center'
              }}
            />
            <line
              x1="4"
              y1="12"
              x2="20"
              y2="12"
              style={{
                opacity: 1 - Math.min(progress * 2, 1),
                transition: 'opacity 0.15s ease'
              }}
            />
            <line
              x1={progress > 0.5 ? "6" : "4"}
              y1={progress > 0.5 ? "18" : "17"}
              x2={progress > 0.5 ? "18" : "20"}
              y2={progress > 0.5 ? "6" : "17"}
              style={{
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                transformOrigin: 'center'
              }}
            />
          </svg>
        </GlassButton>
      </div>

      {/* Dimmed Dimmer Backdrop */}
      {progress > 0.01 && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: `rgba(0, 0, 0, ${backdropOpacity})`,
            zIndex: 95,
            pointerEvents: isOpen ? 'auto' : 'none',
            backdropFilter: `blur(${Math.min(progress * 8, 8)}px)`,
            WebkitBackdropFilter: `blur(${Math.min(progress * 8, 8)}px)`
          }}
        />
      )}

      {/* Floating Glass Sidebar Surface */}
      <aside
        className="liquid-glass-panel"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'min(300px, 85vw)',
          zIndex: 100,
          transform: `translateX(${translateX}%) translateZ(0)`,
          borderRadius: '0 26px 26px 0',
          padding: 'calc(76px + env(safe-area-inset-top, 0px)) 18px 24px 18px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          boxShadow: '16px 0 48px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.45)' }}>
            Recent Sessions
          </span>
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.8)' }}>
            Physical Glass
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            'Volumetric Liquid Glass Rendering',
            '3D Snell Refraction Raytracer',
            'Spring Physics & Velocity Model',
            '180° Directional Hairline Edge',
            'Safe Area & Visual Viewport'
          ].map((title, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.04)',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '12px' }}>›</span>
            </div>
          ))}
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>
          <span>Liquid Glass UI Engine</span>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
        </div>
      </aside>
    </>
  );
};

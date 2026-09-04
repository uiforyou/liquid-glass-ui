import React, { useRef, useState, useEffect } from 'react';
import { Spring1D, SPRING_PRESETS } from '../physics';
import '../GlassMaterial.css';

interface GlassPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  snippet: string;
}

export const GlassPopover: React.FC<GlassPopoverProps> = ({ isOpen, onClose, title, snippet }) => {
  const [scale, setScale] = useState(0.92);
  const [opacity, setOpacity] = useState(0);
  const [translateY, setTranslateY] = useState(8);
  const spring = useRef(new Spring1D(0, SPRING_PRESETS.pop));
  const animFrame = useRef<number | null>(null);

  useEffect(() => {
    spring.current.setTarget(isOpen ? 1 : 0);
    if (animFrame.current !== null) cancelAnimationFrame(animFrame.current);

    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      const running = spring.current.update(dt);
      const val = spring.current.current;

      setScale(0.92 + val * 0.08);
      setOpacity(Math.min(Math.max(val, 0), 1));
      setTranslateY((1 - val) * 8);

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

  if (opacity <= 0.01 && !isOpen) return null;

  return (
    <div
      className="liquid-glass-panel clear-variant"
      onClick={onClose}
      style={{
        borderRadius: '18px',
        padding: '14px 18px',
        maxWidth: '380px',
        opacity,
        transform: `translateY(${translateY}px) scale(${scale}) translateZ(0)`,
        pointerEvents: isOpen ? 'auto' : 'none',
        boxShadow: '0 12px 36px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.22)',
        cursor: 'pointer',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.92)', marginBottom: '4px' }}>
        <span>{title}</span>
        <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>›</span>
      </div>
      <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.55, margin: 0 }}>
        {snippet}
      </p>
    </div>
  );
};

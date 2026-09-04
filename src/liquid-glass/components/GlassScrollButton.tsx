import React, { useRef, useState, useEffect } from 'react';
import { GlassButton } from './GlassButton';
import { Spring1D, SPRING_PRESETS } from '../physics';
import '../GlassMaterial.css';

interface GlassScrollButtonProps {
  visible: boolean;
  onClick: () => void;
}

export const GlassScrollButton: React.FC<GlassScrollButtonProps> = ({ visible, onClick }) => {
  const [scale, setScale] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const [translateY, setTranslateY] = useState(14);
  const spring = useRef(new Spring1D(0, SPRING_PRESETS.pop));
  const animFrame = useRef<number | null>(null);

  useEffect(() => {
    spring.current.setTarget(visible ? 1 : 0);

    if (animFrame.current !== null) cancelAnimationFrame(animFrame.current);

    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      const running = spring.current.update(dt);
      const val = spring.current.current;
      setScale(Math.max(val, 0));
      setOpacity(Math.min(Math.max(val, 0), 1));
      setTranslateY((1 - Math.min(Math.max(val, 0), 1)) * 14);

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
  }, [visible]);

  if (opacity <= 0.01 && !visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '88px',
        right: '24px',
        zIndex: 50,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale}) translateZ(0)`,
        pointerEvents: visible ? 'auto' : 'none'
      }}
    >
      <GlassButton
        ariaLabel="Scroll to newest messages"
        size={40}
        onClick={onClick}
        className="text-white/80 hover:text-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </GlassButton>
    </div>
  );
};

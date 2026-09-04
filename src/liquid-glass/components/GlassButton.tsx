import React, { useRef, useState, useEffect } from 'react';
import { Spring1D, SPRING_PRESETS } from '../physics';
import '../GlassMaterial.css';

interface GlassButtonProps {
  onClick?: () => void;
  ariaLabel: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  onClick,
  ariaLabel,
  size = 44,
  className = '',
  style = {},
  children
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [scale, setScale] = useState(1);
  const springRef = useRef(new Spring1D(1, SPRING_PRESETS.buttonPress));
  const animFrameRef = useRef<number | null>(null);

  const triggerAnimation = () => {
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);

    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      const running = springRef.current.update(dt);
      setScale(springRef.current.current);
      if (running) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        animFrameRef.current = null;
      }
    };
    animFrameRef.current = requestAnimationFrame(loop);
  };

  const handlePointerDown = () => {
    // Compress on press (0.94)
    springRef.current.setTarget(0.94);
    triggerAnimation();
  };

  const handlePointerUp = () => {
    // Release with slight overshoot (1.02) then settle back to 1.00
    springRef.current.setTarget(1.0);
    triggerAnimation();
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <button
      ref={btnRef}
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`liquid-glass-btn ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `scale(${scale}) translateZ(0)`,
        ...style
      }}
    >
      {children}
    </button>
  );
};

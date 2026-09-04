import React, { useRef, useState, useEffect } from 'react';
import { Spring1D, SPRING_PRESETS, VelocityTracker, calculateFluidDeformation } from '../physics';
import '../GlassMaterial.css';

interface TabItem {
  id: string;
  label: string;
}

interface LiquidNavIndicatorProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const LiquidNavIndicator: React.FC<LiquidNavIndicatorProps> = ({ tabs, activeTab, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 4,
    width: 100,
    scaleX: 1,
    scaleY: 1
  });

  const posXSpring = useRef(new Spring1D(4, SPRING_PRESETS.liquidNav));
  const widthSpring = useRef(new Spring1D(100, SPRING_PRESETS.liquidNav));
  const velocityTracker = useRef(new VelocityTracker());
  const animFrame = useRef<number | null>(null);

  const updateTargetForTab = (tabId: string) => {
    const container = containerRef.current;
    if (!container) return;
    const activeEl = container.querySelector(`[data-tab-id="${tabId}"]`) as HTMLElement;
    if (!activeEl) return;

    const parentRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const targetLeft = activeRect.left - parentRect.left;
    const targetWidth = activeRect.width;

    posXSpring.current.setTarget(targetLeft);
    widthSpring.current.setTarget(targetWidth);
    velocityTracker.current.start(posXSpring.current.current);

    if (animFrame.current !== null) cancelAnimationFrame(animFrame.current);

    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      const movingX = posXSpring.current.update(dt);
      const movingW = widthSpring.current.update(dt);

      const currentX = posXSpring.current.current;
      const vel = velocityTracker.current.update(currentX);
      const { stretchX, squashY } = calculateFluidDeformation(vel, 0.2);

      setIndicatorStyle({
        left: currentX,
        width: widthSpring.current.current,
        scaleX: stretchX,
        scaleY: squashY
      });

      if (movingX || movingW) {
        animFrame.current = requestAnimationFrame(loop);
      } else {
        animFrame.current = null;
        velocityTracker.current.reset();
        setIndicatorStyle(prev => ({ ...prev, scaleX: 1, scaleY: 1 }));
      }
    };
    animFrame.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    // slight timeout to allow layout measurement
    const t = setTimeout(() => updateTargetForTab(activeTab), 40);
    return () => clearTimeout(t);
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (animFrame.current !== null) cancelAnimationFrame(animFrame.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="liquid-glass-panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        userSelect: 'none',
        padding: '3px',
        borderRadius: '9999px',
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* Liquid stretchy glass pill indicator */}
      <div
        style={{
          position: 'absolute',
          top: '3px',
          bottom: '3px',
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          transform: `scale(${indicatorStyle.scaleX}, ${indicatorStyle.scaleY}) translateZ(0)`,
          transformOrigin: 'center center',
          borderRadius: '9999px',
          pointerEvents: 'none',
          background: 'rgba(255, 255, 255, 0.14)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
          transition: 'none'
        }}
      />

      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              position: 'relative',
              zIndex: 10,
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '9999px',
              border: 'none',
              background: 'transparent',
              color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
              cursor: 'pointer',
              transition: 'color 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

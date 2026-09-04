import React, { useRef, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { Spring1D, VelocityTracker } from '../engine/physics';
import '../styles/liquid-glass.css';

export interface GlassNavbarProps {
  activePage: string;
  onPageChange: (pageId: string) => void;
}

export const PAGES = [
  { id: 'overview', label: '✦ Overview' },
  { id: 'inputs', label: '⌨ Inputs' },
  { id: 'pills', label: '💊 Pills' },
  { id: 'sidebars', label: '☰ Sidebars' },
  { id: 'popups', label: '💬 Popups' },
];

export const GlassNavbar: React.FC<GlassNavbarProps> = ({ activePage, onPageChange }) => {
  const { setNavbarBounds } = useSettings();
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const dispMapRef = useRef<SVGFEDisplacementMapElement>(null);

  // Snappy, lively liquid spring: high stiffness, tuned damping for organic elastic overshoot
  const posXSpring = useRef(new Spring1D(0, { stiffness: 380, damping: 22, mass: 0.85, precision: 0.05 }));
  const widthSpring = useRef(new Spring1D(0, { stiffness: 360, damping: 24, mass: 0.85, precision: 0.05 }));
  const velocityTracker = useRef(new VelocityTracker());
  const animFrame = useRef<number | null>(null);
  const isFirstMount = useRef(true);

  // Measure tab target and trigger 60fps spring animation via direct DOM manipulation
  const updateActiveTabPosition = () => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector(`[data-tab-id="${activePage}"]`) as HTMLElement | null;
    if (!activeEl) return;

    const navRect = navRef.current.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    const targetLeft = activeRect.left - navRect.left;
    const targetWidth = activeRect.width;
    const targetTop = activeRect.top - navRect.top;
    const targetHeight = activeRect.height;

    const ind = indicatorRef.current;

    // First mount: place indicator immediately with 0 delay
    if (isFirstMount.current) {
      isFirstMount.current = false;
      posXSpring.current.setCurrent(targetLeft);
      widthSpring.current.setCurrent(targetWidth);
      if (ind) {
        ind.style.transform = `translate3d(${targetLeft}px, ${targetTop}px, 0px) scale(1, 1)`;
        ind.style.width = `${targetWidth}px`;
        ind.style.height = `${targetHeight}px`;
        ind.style.opacity = '1';
      }
      reportBounds(targetLeft, targetTop, targetWidth, targetHeight);
      return;
    }

    posXSpring.current.setTarget(targetLeft);
    widthSpring.current.setTarget(targetWidth);
    velocityTracker.current.start(posXSpring.current.current);

    if (animFrame.current !== null) {
      cancelAnimationFrame(animFrame.current);
    }

    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      const movingX = posXSpring.current.update(dt);
      const movingW = widthSpring.current.update(dt);

      const currentX = posXSpring.current.current;
      const currentW = widthSpring.current.current;
      const vel = velocityTracker.current.update(currentX);

      // Liquid deformation based on instantaneous velocity
      // Elongate in travel direction, compress perpendicular axis
      const speed = Math.abs(vel);
      const normV = Math.min(speed / 900, 1.0);
      const stretch = normV * 0.32; // up to 32% stretch
      const stretchX = 1 + stretch;
      const squashY = 1 / (1 + stretch * 0.7);

      // Subtle dynamic inertia tilt (glass trailing edge lags behind)
      const skew = Math.max(-8, Math.min(8, (vel / 900) * -7));

      // Dynamic optical displacement (faster = more chromatic/lens distortion)
      const dispScale = normV * 14;
      if (dispMapRef.current) {
        dispMapRef.current.setAttribute('scale', dispScale.toFixed(1));
      }

      // Dynamic specular highlight offset (shifts towards travel direction)
      const highlightShift = Math.max(-20, Math.min(20, (vel / 900) * 18));
      if (highlightRef.current) {
        highlightRef.current.style.transform = `translateX(${highlightShift}px)`;
        highlightRef.current.style.opacity = `${0.6 + normV * 0.4}`;
      }

      // DIRECT DOM UPDATE: Zero React reconciliation overhead, pure 60fps GPU transform
      if (ind) {
        ind.style.transform = `translate3d(${currentX}px, ${targetTop}px, 0px) scale(${stretchX}, ${squashY}) skewX(${skew}deg)`;
        ind.style.width = `${currentW}px`;
        ind.style.height = `${targetHeight}px`;
        ind.style.opacity = '1';
      }

      if (movingX || movingW) {
        animFrame.current = requestAnimationFrame(tick);
      } else {
        animFrame.current = null;
        velocityTracker.current.reset();

        // Settled: reset deformation to rest state
        if (ind) {
          ind.style.transform = `translate3d(${targetLeft}px, ${targetTop}px, 0px) scale(1, 1) skewX(0deg)`;
          ind.style.width = `${targetWidth}px`;
        }
        if (dispMapRef.current) {
          dispMapRef.current.setAttribute('scale', '0');
        }
        if (highlightRef.current) {
          highlightRef.current.style.transform = 'translateX(0px)';
          highlightRef.current.style.opacity = '0.6';
        }

        // Report final settled bounds to raytracer once motion completes
        reportBounds(targetLeft, targetTop, targetWidth, targetHeight);
      }
    };

    animFrame.current = requestAnimationFrame(tick);
  };

  const reportBounds = (indLeft: number, indTop: number, indW: number, indH: number) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    setNavbarBounds({
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      halfW: rect.width / 2,
      halfH: rect.height / 2,
      r: rect.height / 2,
      activeTabBounds: {
        cx: rect.left + indLeft + indW / 2,
        cy: rect.top + indTop + indH / 2,
        halfW: indW / 2,
        halfH: indH / 2,
        r: indH / 2
      }
    });
  };

  useEffect(() => {
    updateActiveTabPosition();
  }, [activePage]);

  useEffect(() => {
    const handleResize = () => {
      updateActiveTabPosition();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrame.current !== null) {
        cancelAnimationFrame(animFrame.current);
      }
    };
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 'calc(14px + env(safe-area-inset-top, 0px))',
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 100,
        padding: '0 10px'
      }}
    >
      {/* SVG Liquid Refraction Distortion Filter (dynamically scaled by velocity) */}
      <svg
        style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <filter id="liquid-distortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02 0.05"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              ref={dispMapRef}
              in="SourceGraphic"
              in2="noise"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <nav ref={navRef} className="lg-navbar-container">
        {/* Dynamic Physical Liquid Glass Indicator Capsule */}
        <div
          ref={indicatorRef}
          className="lg-nav-liquid-indicator"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0,
            willChange: 'transform, width',
            pointerEvents: 'none',
            zIndex: 5
          }}
        >
          {/* Velocity-shifting specular dynamic highlight */}
          <div ref={highlightRef} className="lg-nav-indicator-highlight" />
          {/* Inner chromatic dispersion rim */}
          <div className="lg-nav-indicator-sheen" />
          {/* Liquid glass refractive bevel border */}
          <div className="lg-nav-indicator-bevel" />
        </div>

        {PAGES.map((page) => {
          const isActive = activePage === page.id;
          return (
            <button
              key={page.id}
              data-tab-id={page.id}
              onClick={() => onPageChange(page.id)}
              className={`lg-nav-btn ${isActive ? 'active' : ''}`}
            >
              {page.label}
            </button>
          );
        })}

        {/* Settings Overlay Toggle Button */}
        <button
          onClick={() => (window as any).__toggleGlassSettings?.()}
          aria-label="Settings"
          title="Open Liquid Glass Settings"
          className="lg-nav-btn lg-nav-settings-btn"
        >
          <span style={{ fontSize: '15px' }}>⚙️</span>
          <span className="lg-settings-text" style={{ marginLeft: '5px' }}>Settings</span>
        </button>
      </nav>
    </header>
  );
};


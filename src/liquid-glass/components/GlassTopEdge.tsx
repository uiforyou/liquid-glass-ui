import React, { useEffect, useState } from 'react';
import '../GlassMaterial.css';

interface GlassTopEdgeProps {
  scrollY?: number;
}

export const GlassTopEdge: React.FC<GlassTopEdgeProps> = ({ scrollY = 0 }) => {
  // Dynamically increase veil darkness and blur when scrolling down
  const intensity = Math.min(Math.max(scrollY / 100, 0), 1);
  const opacity = 0.85 + intensity * 0.15;
  const blurVal = 18 + intensity * 6;

  return (
    <div
      className="liquid-glass-top-veil"
      style={{
        opacity,
        backdropFilter: `blur(${blurVal}px) saturate(140%)`,
        WebkitBackdropFilter: `blur(${blurVal}px) saturate(140%)`,
      }}
      aria-hidden="true"
    />
  );
};

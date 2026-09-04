import { describe, it, expect } from 'vitest';
import { refractRay, sdPill, sampleBilinear } from './Raytracer';
import { Spring1D, SPRING_PRESETS } from './physics';

describe('Liquid Glass 3D Snell Optical Raytracer Engine', () => {
  it('correctly calculates 3D Snell vector refraction according to n1*sin(t1) = n2*sin(t2)', () => {
    const eyeDir: [number, number, number] = [0, 0, -1];
    const surfaceNormal: [number, number, number] = [0, 0, 1];
    const eta = 1.0 / 1.5; // Vacuum/Air to Glass

    const refracted = refractRay(eyeDir, surfaceNormal, eta);
    expect(refracted).not.toBeNull();
    if (refracted) {
      // Ray going straight down normal vector should continue along -Z without deflection
      expect(refracted[0]).toBeCloseTo(0, 4);
      expect(refracted[1]).toBeCloseTo(0, 4);
      expect(refracted[2]).toBeCloseTo(-1, 4);
    }
  });

  it('detects Total Internal Reflection (TIR) when angle exceeds critical angle', () => {
    // Ray coming from dense medium (glass, ior=1.5) exiting into air (ior=1.0), eta = 1.5 / 1.0 = 1.5
    // Critical angle is arcsin(1 / 1.5) = 41.8 degrees.
    // At 60 degrees from normal: cosI = cos(60 deg) = 0.5.
    // sinT2 = (1.5)^2 * (1 - 0.5^2) = 2.25 * 0.75 = 1.6875 > 1.0 => TIR!
    const cos60 = 0.5;
    const sin60 = Math.sqrt(1.0 - cos60 * cos60);
    const eyeDir: [number, number, number] = [sin60, 0, -cos60];
    const surfaceNormal: [number, number, number] = [0, 0, 1];
    const eta = 1.5; // Dense to rare medium

    const tirResult = refractRay(eyeDir, surfaceNormal, eta);
    expect(tirResult).toBeNull();
  });

  it('calculates accurate Signed Distance Field (SDF) for glass capsule pill lenses', () => {
    const halfW = 100;
    const halfH = 25;
    const r = 25;

    // Center of pill lens
    expect(sdPill(0, 0, halfW, halfH, r)).toBeLessThan(0);
    // Boundary of pill lens
    expect(sdPill(0, 25, halfW, halfH, r)).toBeCloseTo(0, 1);
    // Well outside the pill lens
    expect(sdPill(0, 60, halfW, halfH, r)).toBeGreaterThan(0);
  });

  it('samples subpixel pixels smoothly with bilinear interpolation', () => {
    const W = 2;
    const H = 2;
    // 2x2 red-channel gradient image: [0, 100, 200, 255]
    const pixels = new Uint8ClampedArray([
      0, 0, 0, 255,     100, 0, 0, 255,
      200, 0, 0, 255,   255, 0, 0, 255
    ]);

    const sampledCenter = sampleBilinear(pixels, W, H, 0.5, 0.5, 0);
    expect(sampledCenter).toBeGreaterThan(0);
    expect(sampledCenter).toBeLessThan(255);
    expect(sampledCenter).toBeCloseTo(138.75, 1);
  });
});

describe('Semi-Implicit Euler Spring Physics Engine', () => {
  it('converges smoothly toward target equilibrium without runaway oscillation', () => {
    const spring = new Spring1D(0, SPRING_PRESETS.morph);
    spring.setTarget(100);

    for (let i = 0; i < 60; i++) {
      spring.update(1 / 60);
    }

    expect(spring.current).toBeCloseTo(100, 0);
    expect(Math.abs(spring.velocity)).toBeLessThan(1.0);
  });
});

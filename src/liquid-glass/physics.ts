// Liquid Glass Spring Physics and Velocity Engine

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
  precision?: number;
}

export const SPRING_PRESETS: Record<string, SpringConfig> = {
  // Snappy for buttons (+ button overshoot)
  buttonPress: { stiffness: 450, damping: 26, mass: 0.8, precision: 0.001 },
  // Smooth, physical for morphing glass input and popovers
  morph: { stiffness: 280, damping: 28, mass: 1.0, precision: 0.001 },
  // Fluid liquid indicator stretch & settle
  liquidNav: { stiffness: 220, damping: 18, mass: 0.9, precision: 0.001 },
  // Gentle drawer entrance
  sidebar: { stiffness: 320, damping: 32, mass: 1.1, precision: 0.001 },
  // Scroll button pop
  pop: { stiffness: 400, damping: 24, mass: 0.7, precision: 0.001 }
};

export class Spring1D {
  current: number;
  target: number;
  velocity: number;
  config: SpringConfig;

  constructor(initial: number, config: SpringConfig = SPRING_PRESETS.morph) {
    this.current = initial;
    this.target = initial;
    this.velocity = 0;
    this.config = config;
  }

  setTarget(target: number) {
    this.target = target;
  }

  setCurrent(val: number) {
    this.current = val;
    this.velocity = 0;
  }

  update(dt: number): boolean {
    const { stiffness, damping, mass, precision = 0.001 } = this.config;
    // Semi-implicit Euler integration
    const displacement = this.current - this.target;
    const springForce = -stiffness * displacement;
    const dampingForce = -damping * this.velocity;
    const acceleration = (springForce + dampingForce) / mass;

    this.velocity += acceleration * dt;
    this.current += this.velocity * dt;

    if (Math.abs(displacement) < precision && Math.abs(this.velocity) < precision) {
      this.current = this.target;
      this.velocity = 0;
      return false; // Settled
    }
    return true; // Still animating
  }
}

// Velocity tracker for gestures & animated transforms
export class VelocityTracker {
  private lastPos: number = 0;
  private lastTime: number = 0;
  public velocity: number = 0;

  start(pos: number) {
    this.lastPos = pos;
    this.lastTime = performance.now();
    this.velocity = 0;
  }

  update(pos: number): number {
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    if (dt > 0.005) {
      const instantV = (pos - this.lastPos) / dt;
      // Exponential smoothing filter
      this.velocity = this.velocity * 0.4 + instantV * 0.6;
      this.lastPos = pos;
      this.lastTime = now;
    }
    return this.velocity;
  }

  reset() {
    this.velocity = 0;
  }
}

// Derive dynamic stretch and squash from velocity
export function calculateFluidDeformation(velocity: number, maxStretch: number = 0.28): {
  stretchX: number;
  squashY: number;
} {
  const normV = Math.min(Math.abs(velocity) / 1200, 1.0);
  const stretch = normV * maxStretch;
  // Volume conservation: if width stretches by (1 + s), height squashes by ~ 1 / (1 + s)
  return {
    stretchX: 1 + stretch,
    squashY: 1 / (1 + stretch * 0.75)
  };
}

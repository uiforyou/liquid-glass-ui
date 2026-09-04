# Liquid Glass UI Engine

> A high-fidelity, production-grade **volumetric Liquid Glass** rendering and interaction engine for React and modern Web/PWA applications, inspired by modern translucent operating system interfaces.

Unlike generic "glassmorphism" that relies merely on `backdrop-filter: blur()`, this system implements **true volumetric optical silica lens physics**:
- **3D Vector Snell's Law Refraction** ($n_1 \sin\theta_1 = n_2 \sin\theta_2$)
- **Convex Domed Bevel Profiles** with analytical surface normals $\vec{N}$
- **Cauchy Chromatic Dispersion** (splitting Red, Green, and Blue wavelength frequencies)
- **Beer-Lambert Volumetric Absorption**
- **Schlick Fresnel & Blinn-Phong Specular Highlights**
- **Semi-Implicit Euler Spring Physics** for fluid velocity-driven stretch & overshoot

---

## 🚀 Interactive Multi-Page Showcase

The repository includes a persistent **Liquid Glass Top Navigation Bar** allowing live exploration of 5 dedicated showcase sections:

1. **✦ Overview (`/`)**: Flagship optical physics laboratory. Live interactive sliders for Index of Refraction ($IOR$), Bevel Elevation, and Chromatic Dispersion with real-time letter warping and freeform 60fps draggable liquid lens capsule.
2. **⌨ Inputs (`/inputs`)**: Two replicated production input pills demonstrating clear physical liquid glass vs. frosted smoked black liquid glass, with dual-layer high-contrast text silhouettes.
3. **💊 Pills & Dynamic Island (`/pills`)**: Two replicated dynamic island capsules with fluid expand/collapse states (Now Playing / Audio status) showcasing clear vs. frosted smoked optical refraction.
4. **☰ Sidebars & Drawers (`/sidebars`)**: Volumetric sliding Left Navigation Drawer with beveled curved edge and Snell refraction across the entire screen height.
5. **💬 Popups & Dialogs (`/popups`)**: Replicated modal confirmation dialog cards and interactive reopen controls, showing both pure clear silica refraction and frosted black tinted glass with Blinn-Phong specular highlights.

---

## 🛠 Project Structure

```
src/
├── liquid-glass/                     # Core Reusable Optical Engine
│   ├── engine/
│   │   ├── Raytracer.ts              # 3D Snell's law, bevel normals, 9-tap Gaussian blur & Cauchy dispersion
│   │   ├── physics.ts                # Semi-implicit Euler spring integrator
│   │   └── tokens.ts                 # Optical and material constants
│   ├── components/                   # Reusable UI Controls
│   │   ├── GlassNavbar.tsx           # Floating persistent navbar
│   │   ├── SettingsContext.tsx       # Global optics state & background image pipeline
│   │   └── SettingsOverlay.tsx       # Real-time optical parameter inspector
│   ├── styles/
│   │   └── liquid-glass.css          # Clean 180° directional hairline & glass styles
│   └── index.ts                      # Clean library entry point
├── pages/                            # Showcase Pages
│   ├── OverviewPage.tsx
│   ├── InputsPage.tsx
│   ├── PillsPage.tsx
│   ├── SidebarsPage.tsx
│   └── PopupsPage.tsx
├── App.tsx                           # Main app shell & router
└── main.tsx
```

---

## 💻 Getting Started

```bash
# Clone the repository
git clone https://github.com/uiforyou/liquid-glass-ui.git
cd liquid-glass-ui

# Install dependencies
npm install

# Run automated optical unit tests (Snell refraction, TIR, SDF, Springs)
npm test

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser to experience the showcase!

---

## 📄 License & Disclaimer

- **License**: MIT License.
- **Trademark Notice**: This is an independent open-source research and engineering project demonstrating real-time browser optical physics. All visual references, trademarks, and design aesthetics belong to their respective copyright and trademark owners, and this project is not affiliated with, sponsored by, or endorsed by Apple Inc. or any other entity.

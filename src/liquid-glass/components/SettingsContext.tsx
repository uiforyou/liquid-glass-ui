import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface OpticsSettings {
  ior: number;
  bevelHeight: number;
  dispersion: number;
  wallpaperImage: string | null;
  showGrid: boolean;
}

export interface NavbarBounds {
  cx: number;
  cy: number;
  halfW: number;
  halfH: number;
  r: number;
  activeTabBounds?: {
    cx: number;
    cy: number;
    halfW: number;
    halfH: number;
    r: number;
  };
}

interface SettingsContextType {
  settings: OpticsSettings;
  updateSettings: (partial: Partial<OpticsSettings>) => void;
  resetSettings: () => void;
  isOverlayOpen: boolean;
  setIsOverlayOpen: (open: boolean) => void;
  customWallpaperUrl: string | null;
  setCustomWallpaperUrl: (url: string | null) => void;
  navbarBounds: NavbarBounds | null;
  setNavbarBounds: (bounds: NavbarBounds | null) => void;
  wallpaperImg: HTMLImageElement | null;
  bgData: ImageData | null;
  bgCanvasSize: { width: number; height: number };
}

const DEFAULT_SETTINGS: OpticsSettings = {
  ior: 1.88,
  bevelHeight: 30,
  dispersion: 0.085,
  wallpaperImage: '/wallpaper.jpg',
  showGrid: true,
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<OpticsSettings>(DEFAULT_SETTINGS);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState<string | null>('/wallpaper.jpg');
  const [navbarBounds, setNavbarBounds] = useState<NavbarBounds | null>(null);
  const [wallpaperImg, setWallpaperImg] = useState<HTMLImageElement | null>(null);
  const [bgData, setBgData] = useState<ImageData | null>(null);
  const [bgCanvasSize, setBgCanvasSize] = useState({ width: 0, height: 0 });

  const updateSettings = (partial: Partial<OpticsSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setCustomWallpaperUrl('/wallpaper.jpg');
  };

  // Pre-load wallpaper image once globally so pages never blink black
  React.useEffect(() => {
    const url = customWallpaperUrl || '/wallpaper.jpg';
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setWallpaperImg(img);
    };
  }, [customWallpaperUrl]);

  // Compute shared background ImageData buffer on resize or when wallpaperImg updates
  React.useEffect(() => {
    if (!wallpaperImg || !wallpaperImg.complete || wallpaperImg.naturalWidth === 0) return;

    const updateBuffer = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      if (W === 0 || H === 0) return;

      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = W;
      bgCanvas.height = H;
      const bctx = bgCanvas.getContext('2d', { willReadFrequently: true });
      if (!bctx) return;

      const imgRatio = wallpaperImg.naturalWidth / wallpaperImg.naturalHeight;
      const canvasRatio = W / H;
      let renderW = W;
      let renderH = H;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        renderW = W;
        renderH = W / imgRatio;
        offsetY = (H - renderH) / 2;
      } else {
        renderH = H;
        renderW = H * imgRatio;
        offsetX = (W - renderW) / 2;
      }

      bctx.drawImage(wallpaperImg, offsetX, offsetY, renderW, renderH);
      const data = bctx.getImageData(0, 0, W, H);
      setBgData(data);
      setBgCanvasSize({ width: W, height: H });
    };

    updateBuffer();
    window.addEventListener('resize', updateBuffer);
    return () => window.removeEventListener('resize', updateBuffer);
  }, [wallpaperImg]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isOverlayOpen,
        setIsOverlayOpen,
        customWallpaperUrl,
        setCustomWallpaperUrl,
        navbarBounds,
        setNavbarBounds,
        wallpaperImg,
        bgData,
        bgCanvasSize
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
};

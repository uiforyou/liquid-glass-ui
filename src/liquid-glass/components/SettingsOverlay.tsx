import React, { useRef } from 'react';
import { useSettings } from './SettingsContext';
import '../styles/liquid-glass.css';

export const SettingsOverlay: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetSettings,
    isOverlayOpen,
    setIsOverlayOpen,
    customWallpaperUrl,
    setCustomWallpaperUrl
  } = useSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smooth local slider states to decouple slider thumb tracking from heavy raytracing
  const [localIor, setLocalIor] = React.useState(settings.ior);
  const [localBevel, setLocalBevel] = React.useState(settings.bevelHeight);
  const [localDispersion, setLocalDispersion] = React.useState(settings.dispersion);
  const rafRef = useRef<number | null>(null);

  // Sync local state when settings change externally
  React.useEffect(() => {
    setLocalIor(settings.ior);
    setLocalBevel(settings.bevelHeight);
    setLocalDispersion(settings.dispersion);
  }, [settings.ior, settings.bevelHeight, settings.dispersion]);

  const scheduleUpdate = (partial: Partial<typeof settings>) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      updateSettings(partial);
      rafRef.current = null;
    });
  };

  if (!isOverlayOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCustomWallpaperUrl(result);
      updateSettings({ wallpaperImage: result });
    };
    reader.readAsDataURL(file);
  };

  const clearWallpaper = () => {
    setCustomWallpaperUrl(null);
    updateSettings({ wallpaperImage: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      {/* Dimmer Backdrop */}
      <div
        onClick={() => setIsOverlayOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 110,
          cursor: 'pointer'
        }}
      />

      {/* Centered Borderless Liquid Glass Settings Panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(90vw, 440px)',
          zIndex: 120,
          background: 'rgba(20, 22, 28, 0.65)',
          backdropFilter: 'blur(30px) saturate(160%)',
          WebkitBackdropFilter: 'blur(30px) saturate(160%)',
          borderRadius: '28px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxSizing: 'border-box',
          // Borderless with thin liquid glass directional rim
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 -1px 0 rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>⚙️</span>
            <h3 style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.2px', color: '#fff', margin: 0 }}>
              Liquid Glass Settings
            </h3>
          </div>
          <button
            onClick={() => setIsOverlayOpen(false)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Section 1: Wallpaper Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255, 255, 255, 0.5)' }}>
            Custom Wallpaper (Replaces Background Color)
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="wallpaper-file-input"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '14px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.14)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.15s ease'
              }}
            >
              <span>🖼️</span>
              <span>{customWallpaperUrl ? 'Change Wallpaper' : 'Upload Wallpaper'}</span>
            </button>

            {customWallpaperUrl && (
              <button
                onClick={clearWallpaper}
                style={{
                  padding: '10px 14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            )}
          </div>
          {customWallpaperUrl && (
            <span style={{ fontSize: '11px', color: '#10b981' }}>
              ✓ Custom wallpaper active & refracting through all liquid glass lenses
            </span>
          )}
        </div>

        {/* Section 2: Optical Physics Parameters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255, 255, 255, 0.5)' }}>
            Physical Lens Parameters
          </label>

          {/* IOR Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Index of Refraction (IOR)</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{localIor.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="1.1"
              max="2.4"
              step="0.02"
              value={localIor}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setLocalIor(val);
                scheduleUpdate({ ior: val });
              }}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }}
            />
          </div>

          {/* Bevel Elevation */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Bevel Convex Elevation</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{localBevel}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="1"
              value={localBevel}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setLocalBevel(val);
                scheduleUpdate({ bevelHeight: val });
              }}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }}
            />
          </div>

          {/* Dispersion */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Cauchy RGB Dispersion</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{localDispersion.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.18"
              step="0.005"
              value={localDispersion}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setLocalDispersion(val);
                scheduleUpdate({ dispersion: val });
              }}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            onClick={resetSettings}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Reset to Defaults
          </button>
          <button
            onClick={() => setIsOverlayOpen(false)}
            style={{
              padding: '8px 22px',
              borderRadius: '9999px',
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.45)'
            }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </>
  );
};

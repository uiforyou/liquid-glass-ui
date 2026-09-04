import React, { useState, useEffect } from 'react';
import { GlassNavbar } from './liquid-glass/components/GlassNavbar';
import { SettingsProvider, useSettings } from './liquid-glass/components/SettingsContext';
import { SettingsOverlay } from './liquid-glass/components/SettingsOverlay';
import { OverviewPage } from './pages/OverviewPage';
import { InputsPage } from './pages/InputsPage';
import { PillsPage } from './pages/PillsPage';
import { SidebarsPage } from './pages/SidebarsPage';
import { PopupsPage } from './pages/PopupsPage';
import './liquid-glass/styles/liquid-glass.css';

const AppContent: React.FC = () => {
  const [activePage, setActivePage] = useState('overview');
  const { isOverlayOpen, setIsOverlayOpen, customWallpaperUrl } = useSettings();

  useEffect(() => {
    (window as any).__toggleGlassSettings = () => {
      setIsOverlayOpen(!isOverlayOpen);
    };
  }, [isOverlayOpen, setIsOverlayOpen]);

  return (
    <div
      className="lg-page-stage"
      style={customWallpaperUrl ? { backgroundImage: `url(${customWallpaperUrl})` } : undefined}
    >
      {/* Persistent Floating Glass Top Navbar with Settings Button */}
      <GlassNavbar activePage={activePage} onPageChange={setActivePage} />

      {/* Centric Borderless Liquid Glass Settings Overlay */}
      <SettingsOverlay />

      {/* Dynamic Page Rendering */}
      {activePage === 'overview' && <OverviewPage />}
      {activePage === 'inputs' && <InputsPage />}
      {activePage === 'pills' && <PillsPage />}
      {activePage === 'sidebars' && <SidebarsPage />}
      {activePage === 'popups' && <PopupsPage />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
};

export default App;

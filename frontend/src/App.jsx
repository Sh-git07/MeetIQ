import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ScannerField } from './components/effects/ScannerField';
import { TextMagnifier } from './components/effects/TextMagnifier';
import { Navbar } from './components/layout/Navbar';
import { ToastProvider } from './hooks/useToast';

import { Landing } from './pages/Landing';
import { HowItWorks } from './pages/HowItWorks';
import { Dashboard } from './pages/Dashboard';
import { NewBriefing } from './pages/NewBriefing';
import { Research } from './pages/Research';
import { Briefing } from './pages/Briefing';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

export function App() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      if (prefersReducedMotion) {
        setDisplayLocation(location);
      } else {
        setTransitionStage('fadeOut');
      }
    }
  }, [location, displayLocation, prefersReducedMotion]);

  const handleAnimationEnd = () => {
    if (transitionStage === 'fadeOut') {
      setTransitionStage('fadeIn');
      setDisplayLocation(location);
      window.scrollTo(0, 0);
    }
  };

  return (
    <ToastProvider>
      <div className="relative min-h-screen text-[#1B1630] font-sans selection:bg-[#F5E8A8] selection:text-[#1B1630]">
        {/* Background Full-Screen Scanner Field Canvas */}
        <ScannerField />

        {/* Word Magnifier Effect */}
        <TextMagnifier />

        {/* Adaptive Navbar */}
        <Navbar />

        {/* Main Content with soft fade page transition */}
        <main
          id="main-content"
          onTransitionEnd={handleAnimationEnd}
          className={`relative z-10 transition-opacity duration-250 ease-in-out ${
            transitionStage === 'fadeOut' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Routes location={displayLocation}>
            <Route path="/" element={<Landing />} />
            <Route path="/how" element={<HowItWorks />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new" element={<NewBriefing />} />
            <Route path="/research/:researchId" element={<Research />} />
            <Route path="/briefings/:briefingId" element={<Briefing />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;

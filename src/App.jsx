import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import MainScene from './scenes/MainScene';
import useScrollProgress from './hooks/useScrollProgress';
import useAudio from './hooks/useAudio';
import './App.css';

const MENU_ITEMS = [
  "01. HOME",
  "02. COLLECTION",
  "03. CRAFTSMANSHIP",
  "04. OUR WORLD",
  "05. CONTACT"
];

const PAGE_CONTENT = {
  2: { title: "THE COLLECTION", desc: "Discover our latest masterworks, where dark luxury meets delicate nature." },
  3: { title: "CRAFTSMANSHIP", desc: "Every piece is hand-blown and meticulously crafted to bend light perfectly." },
  4: { title: "OUR WORLD", desc: "Step into the Elysian universe, a place of silence, beauty, and magic." },
  5: { title: "CONTACT", desc: "Reach out to commission a bespoke piece for your sanctuary." },
};

export default function App() {
  const progress = useScrollProgress();
  const { startAmbient, updateScroll, toggleMute } = useAudio();
  const [muted, setMuted] = useState(true);
  const [activePage, setActivePage] = useState(1);

  // Feed scroll progress into the audio engine for pitch shifting
  useEffect(() => {
    updateScroll(progress);
  }, [progress, updateScroll]);

  // Handle sound toggle
  const handleSoundToggle = () => {
    if (muted) {
      startAmbient(); // First click starts the ambient drone
    }
    const nowMuted = toggleMute();
    setMuted(nowMuted);
  };

  // Fade the hero section out smoothly from 0→0.3
  const section1Opacity = Math.max(0, 1 - progress / 0.3);
  // Fade section 2 in between 0.4→0.6 and out between 0.75→0.95
  const section2Opacity = progress < 0.4 ? 0
    : progress < 0.6 ? (progress - 0.4) / 0.2
    : progress < 0.75 ? 1
    : Math.max(0, 1 - (progress - 0.75) / 0.2);
  // Fade scroll indicator away as user starts scrolling
  const scrollIndicatorOpacity = Math.max(0, 1 - progress / 0.08);

  return (
    <>
      {/* ── 3D Canvas (fixed background) ── */}
      <div className="canvas-container">
        <Canvas
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          camera={{ position: [0, 2.5, 6.5], fov: 45, near: 0.1, far: 200 }}
          onPointerDown={() => window.dispatchEvent(new Event('burst'))}
        >
          <Suspense fallback={null}>
            <MainScene progress={progress} />
          </Suspense>
        </Canvas>
      </div>

      {/* ── HTML Overlay (scrollable) ── */}
      <div className="scroll-container">

        {/* Top Navbar */}
        <div className="top-nav">
          <div className="brand">ELYSIAN</div>
          <div className="grid-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="5" cy="5" r="2" /><circle cx="12" cy="5" r="2" /><circle cx="19" cy="5" r="2" />
              <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
              <circle cx="5" cy="19" r="2" /><circle cx="12" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
            </svg>
          </div>
        </div>

        {/* Left Sidebar */}
        <div className="sidebar">
          {MENU_ITEMS.map((item, index) => (
            <div 
              key={item}
              className={`menu-item ${activePage === index + 1 ? 'active' : ''}`}
              onClick={() => setActivePage(index + 1)}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Right Counter */}
        <div className="right-counter">0{activePage} / 05</div>

        {/* Bottom HUD */}
        <div className="bottom-area">
          <div className="bottom-left-icons">
            {/* Sound toggle button — functional */}
            <div
              className={`sound-toggle ${muted ? '' : 'active'}`}
              onClick={handleSoundToggle}
              title={muted ? 'Enable sound' : 'Mute sound'}
            >
              {muted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </div>
            <span className="divider" />
            <div className="bag-container">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="badge">2</span>
            </div>
          </div>

          <motion.div
            className="scroll-explore"
            style={{ opacity: scrollIndicatorOpacity }}
          >
            SCROLL TO EXPLORE
            <div className="scroll-line" />
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {activePage === 1 ? (
            <motion.div
              key="home-page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* ── Section 1: Hero Title ── */}
              <motion.div
                className="section-1"
                style={{ opacity: section1Opacity }}
              >
                <div className="hero-content">
                  <div className="subtitle">REFINED BEAUTY, ELEVATED.</div>
                  <h1 className="title">LUMIÈRE</h1>
                  <div className="cta">
                    DISCOVER THE COLLECTION
                    <span className="arrow">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* ── Section 2: The Convergence (appears mid-scroll) ── */}
              <motion.div
                className="section-2"
                style={{ opacity: section2Opacity }}
              >
                <h2>The Convergence</h2>
                <p>
                  Where artistry meets nature. Each petal drawn into an ancient vessel,
                  converging light and form into a singular moment of beauty.
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key={`demo-page-${activePage}`}
              className="demo-page"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="demo-content">
                <div className="subtitle">EXPLORE THE UNIVERSE</div>
                <h1 className="title">{PAGE_CONTENT[activePage]?.title}</h1>
                <p>{PAGE_CONTENT[activePage]?.desc}</p>
                <div className="cta" onClick={() => setActivePage(1)}>
                  RETURN TO HOME
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

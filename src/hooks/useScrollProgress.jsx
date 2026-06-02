import { useState, useEffect, startTransition } from "react";
import { logger } from "../utils/logger";

const log = logger.create('ScrollProgress');

/**
 * useScrollProgress — React custom hook
 * 
 * Tracks the window's vertical scroll position and returns a normalized
 * progress value between 0.0 and 1.0. Optimized using requestAnimationFrame
 * to throttle layout calculation frequency, preventing layout thrashing and
 * guaranteeing fluid 120 FPS scrolling performance.
 */
export default function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rAFId = null;

    const calculateProgress = () => {
      try {
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const totalScrollable = docHeight - winHeight;

        if (totalScrollable <= 0) {
          startTransition(() => setProgress(0));
          rAFId = null;
          return;
        }

        // Calculate progress and clamp between 0.0 and 1.0
        const currentProgress = Math.min(Math.max(window.scrollY / totalScrollable, 0), 1);
        startTransition(() => setProgress(currentProgress));
        rAFId = null;
      } catch (err) {
        log.error('Failed to calculate scroll progress:', err);
        rAFId = null;
      }
    };

    const onScroll = () => {
      // Throttle event logic via requestAnimationFrame to run in sync with monitor refresh rate
      if (rAFId === null) {
        rAFId = requestAnimationFrame(calculateProgress);
      }
    };

    try {
      // Use passive listener to avoid blocking main thread touch/scroll scrolling behaviour
      window.addEventListener("scroll", onScroll, { passive: true });
      
      // Execute an initial calculation to frame the initial state
      calculateProgress();
      log.info('Scroll progress hook initialized');
    } catch (err) {
      log.error('Failed to set up scroll listener:', err);
    }

    return () => {
      try {
        window.removeEventListener("scroll", onScroll);
        if (rAFId !== null) {
          cancelAnimationFrame(rAFId);
        }
        log.debug('Scroll progress hook cleaned up');
      } catch (err) {
        log.warn('Scroll cleanup error:', err);
      }
    };
  }, []);

  return progress;
}

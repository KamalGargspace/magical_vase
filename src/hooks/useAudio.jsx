import { useRef, useCallback, useEffect } from 'react';
import { logger } from '../utils/logger';

const log = logger.create('Audio');

/**
 * useAudio — Procedural audio engine for the Elysian experience.
 *
 * Uses the Web Audio API to synthesize:
 *   1. An ethereal wind sound at night (filtered noise + LFO)
 *   2. A crystalline chime on click (burst)
 *   3. Scroll-reactive wind intensity
 *
 * Audio is gated behind user interaction (browser policy).
 * All Web Audio API calls are wrapped in try/catch for browser compatibility.
 */
export default function useAudio() {
  const ctxRef       = useRef(null);
  const masterGain   = useRef(null);
  const ambientNodes = useRef([]);
  const isPlaying    = useRef(false);
  const isMuted      = useRef(false);

  // ─── Create the AudioContext lazily on first interaction ───────────────
  const getCtx = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        log.warn('Web Audio API not supported in this browser');
        return null;
      }

      const ctx = new AudioContextClass();
      ctxRef.current = ctx;

      // Master gain
      const gain = ctx.createGain();
      gain.gain.value = 0.5; // Wind needs slightly more volume
      gain.connect(ctx.destination);
      masterGain.current = gain;

      log.info('AudioContext created', { sampleRate: ctx.sampleRate, state: ctx.state });
      return ctx;
    } catch (err) {
      log.error('Failed to create AudioContext:', err);
      return null;
    }
  }, []);

  // ─── Start the ambient wind drone ──────────────────────────────────────────
  const startAmbient = useCallback(() => {
    if (isPlaying.current) return;

    try {
      const ctx = getCtx();
      if (!ctx) {
        log.warn('Cannot start ambient: no AudioContext');
        return;
      }

      if (ctx.state === 'suspended') {
        ctx.resume().catch((err) => log.warn('AudioContext resume failed:', err));
      }

      // Generate White Noise Buffer
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // 1. The "Breeze" (Low frequency body, steady)
      const breezeFilter = ctx.createBiquadFilter();
      breezeFilter.type = 'lowpass';
      breezeFilter.frequency.value = 400;
      breezeFilter.Q.value = 0.5;

      // 2. The "Howl" (High frequency whistle, sweeping)
      const howlFilter = ctx.createBiquadFilter();
      howlFilter.type = 'bandpass';
      howlFilter.frequency.value = 1000;
      howlFilter.Q.value = 18; // Extremely tight Q makes it whistle instead of roar

      // LFO to modulate the Howl frequency (pitch bends)
      const howlLfo = ctx.createOscillator();
      howlLfo.type = 'sine';
      howlLfo.frequency.value = 0.25; // Faster, erratic shifting
      
      const howlLfoGain = ctx.createGain();
      howlLfoGain.gain.value = 500; // Sweeps from 500Hz to 1500Hz
      
      howlLfo.connect(howlLfoGain);
      howlLfoGain.connect(howlFilter.frequency);

      // Mix the two components
      whiteNoise.connect(breezeFilter);
      whiteNoise.connect(howlFilter);

      const windGain = ctx.createGain();
      windGain.gain.value = 0;
      windGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 3);

      breezeFilter.connect(windGain);
      
      const howlMix = ctx.createGain();
      howlMix.gain.value = 1.2;
      howlFilter.connect(howlMix);
      howlMix.connect(windGain);

      windGain.connect(masterGain.current);

      whiteNoise.start();
      howlLfo.start();
      
      ambientNodes.current.push({ noise: whiteNoise, lfo: howlLfo, lfoGain: howlLfoGain, filter: howlFilter, breeze: breezeFilter, gain: windGain });
      isPlaying.current = true;

      log.info('Ambient wind drone started');
    } catch (err) {
      log.error('Failed to start ambient audio:', err);
    }
  }, [getCtx]);

  // ─── Play a crystalline chime on click ────────────────────────────────
  const playChime = useCallback(() => {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch((err) => log.warn('AudioContext resume failed:', err));
      }
      if (isMuted.current) return;

      const now = ctx.currentTime;

      // Two harmonics for a glass-bell timbre
      [880, 1320].forEach((freq, i) => {
        try {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq + (Math.random() - 0.5) * 20;

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.15 - i * 0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

          // Gentle filter for softness
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 3000;
          filter.Q.value = 1.5;

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain.current);

          osc.start(now);
          osc.stop(now + 2);
        } catch (err) {
          log.warn(`Chime harmonic ${freq}Hz failed:`, err);
        }
      });

      // High shimmer overtone
      try {
        const shimmer = ctx.createOscillator();
        shimmer.type = 'triangle';
        shimmer.frequency.value = 2640 + Math.random() * 100;
        const shimGain = ctx.createGain();
        shimGain.gain.setValueAtTime(0.04, now);
        shimGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        shimmer.connect(shimGain);
        shimGain.connect(masterGain.current);
        shimmer.start(now);
        shimmer.stop(now + 1.3);
      } catch (err) {
        log.warn('Shimmer overtone failed:', err);
      }

      log.debug('Chime played');
    } catch (err) {
      log.error('playChime failed:', err);
    }
  }, [getCtx]);

  // ─── Scroll-reactive wind intensity ──────────────────────────────────
  const updateScroll = useCallback((progress) => {
    try {
      if (!ambientNodes.current.length) return;
      // Increase wind pitch as user scrolls deeper
      ambientNodes.current.forEach((node) => {
        if (node.filter && node.lfoGain && node.breeze) {
          // Higher base whistle and stronger gusts
          node.filter.frequency.value = 1000 + progress * 500;
          node.lfoGain.gain.value = 500 + progress * 400;
          // Let more high frequencies through the body breeze
          node.breeze.frequency.value = 400 + progress * 600;
        }
      });
    } catch (err) {
      log.warn('updateScroll audio failed:', err);
    }
  }, []);

  // ─── Toggle mute ──────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    try {
      isMuted.current = !isMuted.current;
      if (masterGain.current && ctxRef.current) {
        masterGain.current.gain.linearRampToValueAtTime(
          isMuted.current ? 0 : 0.5,
          ctxRef.current.currentTime + 0.3
        );
      }
      log.info(`Audio ${isMuted.current ? 'muted' : 'unmuted'}`);
      return isMuted.current;
    } catch (err) {
      log.error('toggleMute failed:', err);
      return isMuted.current;
    }
  }, []);

  // ─── Listen for burst events ──────────────────────────────────────────
  useEffect(() => {
    const onBurst = () => {
      try {
        startAmbient();  // ensure ambient is running
        playChime();
      } catch (err) {
        log.error('Burst event handler failed:', err);
      }
    };
    window.addEventListener('burst', onBurst);
    return () => window.removeEventListener('burst', onBurst);
  }, [startAmbient, playChime]);

  // Cleanup
  useEffect(() => {
    return () => {
      log.info('Cleaning up audio resources');
      ambientNodes.current.forEach(n => {
        try { if (n.noise) n.noise.stop(); } catch (e) { /* already stopped */ }
        try { if (n.lfo) n.lfo.stop(); } catch (e) {}
      });
      try {
        if (ctxRef.current) ctxRef.current.close();
      } catch (err) {
        log.warn('AudioContext close failed:', err);
      }
    };
  }, []);

  return { startAmbient, playChime, updateScroll, toggleMute };
}

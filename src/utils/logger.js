/**
 * logger.js — Lightweight structured logging utility for Elysian.
 *
 * Features:
 *   • Log levels: DEBUG, INFO, WARN, ERROR
 *   • Component-scoped prefixes (e.g., logger.create('PetalSystem'))
 *   • Performance timing (logger.time / logger.timeEnd)
 *   • Environment-aware: verbose in dev, errors-only in prod
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   const log = logger.create('MyComponent');
 *   log.info('Initialized', { count: 42 });
 *   log.time('render');
 *   // ... work ...
 *   log.timeEnd('render');
 */

const LOG_LEVELS = Object.freeze({
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4,
});

// In production builds Vite sets import.meta.env.PROD to true.
const IS_PROD = typeof import.meta !== 'undefined' && import.meta.env?.PROD;
const CURRENT_LEVEL = IS_PROD ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;

// Color palette for component prefixes (cycles through)
const PREFIX_COLORS = [
  '#a78bfa', // violet
  '#38bdf8', // sky
  '#34d399', // emerald
  '#fb923c', // orange
  '#f472b6', // pink
  '#facc15', // yellow
];
let colorIndex = 0;

/**
 * Timestamp string in compact HH:MM:SS.mmm format.
 */
function timestamp() {
  const d = new Date();
  return (
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0') + '.' +
    String(d.getMilliseconds()).padStart(3, '0')
  );
}

/**
 * Creates a scoped logger instance for a specific component / module.
 *
 * @param {string} scope — Human-readable name (e.g. 'PetalSystem')
 * @returns {{ debug, info, warn, error, time, timeEnd }}
 */
function createScopedLogger(scope) {
  const color = PREFIX_COLORS[colorIndex % PREFIX_COLORS.length];
  colorIndex++;

  const prefix = `%c[${scope}]`;
  const style = `color:${color};font-weight:bold`;

  const timers = new Map();

  return {
    debug(...args) {
      if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
        console.debug(`${timestamp()} ${prefix}`, style, ...args);
      }
    },

    info(...args) {
      if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
        console.info(`${timestamp()} ${prefix}`, style, ...args);
      }
    },

    warn(...args) {
      if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
        console.warn(`${timestamp()} ${prefix}`, style, ...args);
      }
    },

    error(...args) {
      if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
        console.error(`${timestamp()} ${prefix}`, style, ...args);
      }
    },

    /**
     * Start a named timer for performance profiling.
     * @param {string} label
     */
    time(label) {
      if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
        timers.set(label, performance.now());
      }
    },

    /**
     * End a named timer and log the elapsed time.
     * @param {string} label
     */
    timeEnd(label) {
      if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
        const start = timers.get(label);
        if (start !== undefined) {
          const elapsed = (performance.now() - start).toFixed(2);
          console.debug(`${timestamp()} ${prefix}`, style, `⏱ ${label}: ${elapsed}ms`);
          timers.delete(label);
        }
      }
    },
  };
}

export const logger = {
  /** Create a component-scoped logger */
  create: createScopedLogger,

  /** Top-level convenience methods (no scope) */
  debug: (...args) => { if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) console.debug(`${timestamp()}`, ...args); },
  info:  (...args) => { if (CURRENT_LEVEL <= LOG_LEVELS.INFO)  console.info(`${timestamp()}`, ...args); },
  warn:  (...args) => { if (CURRENT_LEVEL <= LOG_LEVELS.WARN)  console.warn(`${timestamp()}`, ...args); },
  error: (...args) => { if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) console.error(`${timestamp()}`, ...args); },
};
